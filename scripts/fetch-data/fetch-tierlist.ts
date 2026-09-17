/**
 * 칼바람 챔피언 티어리스트 데이터를 굽는다 → src/features/tierlist/data/
 *   - tierlist.json                생성물. 로케일 무관(숫자 id + 숫자 값), 승률 내림차순 정렬 완료
 *                                  증강은 챔피언마다 **전량**이라 튜플로 눕힌다 — 자세한 건 AugEntry.
 *   - tierlist-items.{ko,en}.json  참조된 아이템의 이름·아이콘 사전
 *
 * 소스 2개:
 *   - data.dtodo.cn (aram.gg)      챔피언 승률 + 챔피언별 증강 승률 + 아이템
 *   - CommunityDragon              숫자 id ↔ 앱 슬러그 매핑, 아이템 이름/아이콘, 스펠 아이콘
 *
 * 티어는 우리가 매기지 않는다 — dtodo 의 `stats.tier`(1~5)를 S/A/B/C/D 로 옮길 뿐이다.
 * 승률만으로 줄 세우면 픽률 3%대 장인픽이 S로 올라오고 징크스 같은 주력픽이 빠져서 다른
 * 집계 사이트와 어긋난다. 소스 티어는 우리가 못 보는 표본 수까지 반영돼 승률·픽률
 * 선형결합으로는 재현되지 않는다(실측: 어떤 계수로도 tier1 적중 4/7이 한계).
 *
 * dtodo 는 비공식 내부 API다. 문서·SLA 없고 예고 없이 바뀐다. 그래서 런타임이 아니라
 * 빌드타임에만 때리고, 하단 sanity 가드로 반쯤 죽은 응답이 좋은 JSON을 덮어쓰는 걸 막는다.
 *
 * Run: npx tsx scripts/fetch-data/fetch-tierlist.ts        (전량, 3~5분)
 *      npx tsx scripts/fetch-data/fetch-tierlist.ts 5      (5챔피언 스모크)
 */
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve(__dirname, '../../src/features/tierlist/data');
const APP_DIR = path.resolve(__dirname, '../../src/features');

const DTODO = 'https://data.dtodo.cn/api/client/v1';
const CDRAGON = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global';

/**
 * 상황템 최소 표본. 판수 내림차순이라 순위를 흔들진 않지만, 저픽 챔피언에서 수십 판짜리
 * 아이템이 꼬리에 붙는 노이즈를 막는다.
 */
const MIN_GAMES = 200;

/**
 * 빌드 순서(코어 조합·확장 step) 최소 표본. 조합 단위라 상황템보다 판수가 훨씬 적다.
 * dtodo 가 확장에 이미 ~50판 하한을 거는 듯하지만(실측 최저 52) 정책이 바뀌면 노이즈가 샌다.
 */
const MIN_BUILD_GAMES = 50;

const LIMIT = Number(process.argv[2]) || Infinity;

/**
 * 증강 한 줄 — `[augIds 인덱스, 승률×10000, 소스 티어(1~4)]`.
 *
 * 챔피언마다 120개 넘게 실으므로 `{id, score, games}` 객체로 두면 파일이 1.3MB가 된다.
 * 슬러그를 파일 상단 `augIds` 사전으로 빼고 값만 눕혀 ~450KB로 줄였다. 판수는 화면이
 * 쓰지 않아 버렸다(상위 목록도 승률만 보여준다).
 */
type AugEntry = [number, number, number];
type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

/**
 * 소스 tier(1~5) → 표시 등급. 1+2 를 S 로 합치는 건 aramgg.com 표기와 맞추기 위해서다
 * (징크스가 S 로 들어오는 기준). 5는 챔피언의 60%가 몰려 있어 여기서 안 끊고,
 * 아래에서 승률 기준으로 반 갈라 C/D 로 나눈다.
 */
const TIER_MAP: Record<number, Tier> = { 1: 'S', 2: 'S', 3: 'A', 4: 'B' };

interface Row {
  key: string;
  score: number;
  sub: number;
  tier: Tier;
  augments: AugEntry[];
  /** 완성템 구매 순서(코어 3 + 확장 최대 3). */
  build: string[];
  /** 상황템 — 판수 내림차순, build 에 있는 건 뺀다. */
  situational: string[];
  spells: number[];
  /** 위 스펠 조합의 픽률 — 태그 빌드 전체 판수 대비(최다 빌드 하나 안의 비율이 아니다). */
  spellPick: number;
  /** 소스 tier(1~5). 정렬·매핑에만 쓰고 JSON 에는 남기지 않는다. */
  srcTier: number;
}

async function fetchJson(url: string, tries = 3): Promise<any | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch {
      if (i < tries - 1) await sleep(i === 0 ? 500 : 1500);
    }
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** 소수 4자리면 승률 표시에 충분하다. 원본은 자릿수가 길어 파일이 배로 커진다. */
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
const readApp = (p: string) => JSON.parse(fs.readFileSync(path.join(APP_DIR, p), 'utf8'));
const setKey = (ids: number[]) => [...ids].sort((a, b) => a - b).join('-');

/**
 * 완성템 구매 순서. `coreItems[0].itemIds` 가 최다 코어 3개를 **산 순서대로** 준다
 * (같은 셋이 순서만 달리 별개 항목으로 온다). 4~6번째는 `itemExtensions` 에서 잇는다 —
 * extension 의 `coreItemIds` 는 정렬된 셋이라 셋으로 맞추고, `itemIds` 는 step 까지 누적된 셋이다.
 *
 * ponytail: 탐욕 경로 — step 마다 지금까지 붙인 아이템을 전부 포함하는 후보 중 최다 판수 하나.
 * 이어지는 후보가 없으면 거기서 멈춘다 — 3~5개로 끝나는 챔피언이 있다(step1 이 비고 step2 만
 * 있는 챔피언도 있는데, 건너뛰면 두 아이템의 선후를 모르므로 붙이지 않는다).
 * 전역 최다 경로가 필요하면 step3 셋을 먼저 고르고 역추적.
 */
function buildOrder(b: any): number[] {
  const top = b?.coreItems?.[0];
  if (!top || top.games < MIN_BUILD_GAMES || !Array.isArray(top.itemIds)) return [];
  const core: number[] = top.itemIds;
  // 비공식 API라 필드가 빠진 항목이 섞여도 수집 전체가 죽지 않게 거른다.
  const ext = ((b?.itemExtensions ?? []) as any[]).filter(
    (e) =>
      Array.isArray(e.coreItemIds) &&
      Array.isArray(e.itemIds) &&
      e.games >= MIN_BUILD_GAMES &&
      setKey(e.coreItemIds) === setKey(core),
  );
  const order = [...core];
  for (const step of [1, 2, 3]) {
    const next = ext
      .filter((e) => e.step === step && order.slice(core.length).every((id) => e.itemIds.includes(id)))
      .sort((x, y) => y.games - x.games)[0];
    if (!next) break;
    order.push(...(next.itemIds as number[]).filter((id) => !order.includes(id)));
  }
  return order;
}

/**
 * 최다 스펠 조합과 그 픽률. `build.summonerSpells` 의 pickRate 는 최다 태그 빌드 **안에서의** 비율이라
 * (말파이트는 AP 빌드가 전체의 62%뿐) 태그 빌드(`builds`) 전체를 조합별로 합산해 다시 나눈다.
 * 분모는 빌드 판수(`stats.games`) — summonerSpells 는 상위 몇 개만 와서 합이 판수에 못 미친다.
 */
function topSpells(dt: any): { ids: number[]; pick: number } | null {
  const builds = ((dt.builds?.length ? dt.builds : [dt.build]) as any[]).filter(Boolean);
  let total = 0;
  const combos = new Map<string, { ids: number[]; games: number }>();
  for (const b of builds) {
    total += b.stats?.games ?? 0;
    for (const s of (b.summonerSpells ?? []) as any[]) {
      if (!Array.isArray(s.summonerSpellIds)) continue;
      const k = setKey(s.summonerSpellIds);
      const c = combos.get(k) ?? { ids: s.summonerSpellIds, games: 0 };
      c.games += s.games ?? 0;
      combos.set(k, c);
    }
  }
  const top = [...combos.values()].sort((a, b) => b.games - a.games)[0];
  return top && total > 0 ? { ids: top.ids, pick: Math.min(1, top.games / total) } : null;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── 앱 로컬 데이터: 조인의 목적지 ──────────────────────────────────
  const champions = readApp('champions/data/champions.ko.json') as { key: string; name: string; tags: string[] }[];
  const tagsByKey = new Map(champions.map((c) => [c.key, c.tags]));
  const nameByKey = new Map(champions.map((c) => [c.key, c.name]));
  // 칼바람 풀만 — 클래식 전용 증강이 칼바람 추천에 섞이면 앱 뽑기 풀과 어긋난다.
  const aramAug = (readApp('augments/data/augments.ko.json') as any[]).filter((a) => a.modes?.includes('aram'));

  // ── CDragon: 숫자 id → 앱 증강 슬러그 ────────────────────────────
  const cherry = await fetchJson(`${CDRAGON}/ko_kr/v1/cherry-augments.json`);
  if (!cherry) throw new Error('CDragon cherry-augments fetch 실패');
  const byNameId = new Map<string, string>(
    aramAug.filter((a) => a.augmentNameId).map((a) => [a.augmentNameId, a.id]),
  );
  const augId = new Map<number, string>();
  for (const a of (cherry.augments ?? cherry) as any[]) {
    const slug = byNameId.get(a.augmentNameId);
    if (slug) augId.set(a.id, slug);
  }

  // ── CDragon 아이템: 이름·아이콘을 직접 굽는다 ────────────────────
  // ponytail: 앱 items.ko.json 에 조인하면 상위 아이템 일부가 통째로 빠진다(앱 아이템
  // 데이터에 없는 id 가 섞여 있다). CDragon 은 100% 커버하고 유니크가 금방 포화돼
  // ko/en 합쳐 ~28KB다. 앱 조인보다 오히려 코드가 짧다 — 접두사 제거도 필요 없어진다.
  const itemMeta: Record<'ko' | 'en', Map<string, { name: string; iconPath: string }>> = {
    ko: new Map(),
    en: new Map(),
  };
  for (const [suffix, loc] of [['ko', 'ko_kr'], ['en', 'default']] as const) {
    const items = await fetchJson(`${CDRAGON}/${loc}/v1/items.json`);
    if (!items) throw new Error(`CDragon items.json(${loc}) fetch 실패`);
    for (const i of items) {
      itemMeta[suffix].set(String(i.id), { name: i.name, iconPath: i.iconPath });
    }
  }

  const spells = await fetchJson(`${CDRAGON}/default/v1/summoner-spells.json`);
  if (!spells) throw new Error('CDragon summoner-spells.json fetch 실패');
  const spellIcon = new Map<number, string>((spells as any[]).map((s) => [s.id, s.iconPath]));

  // ── 소스 목록 ────────────────────────────────────────────────────
  const cfg = await fetchJson(`${DTODO}/config`);
  if (!cfg) throw new Error('dtodo config fetch 실패');
  const ver: string = cfg.dataVersion;

  const dtChamps = await fetchJson(`${DTODO}/data/${ver}/champions.json`);
  if (!dtChamps) throw new Error('dtodo champions.json fetch 실패');
  const stats = new Map<string, any>((dtChamps.data as any[]).map((c) => [String(c.id), c.stats]));
  const patch: string = cfg.gamePatch ?? '';
  const date: string = (dtChamps.data as any[])[0]?.stats?.date ?? '';

  console.log(`패치 ${patch} · 집계일 ${date} · dataVersion ${ver}`);
  console.log(`증강 매핑 ${augId.size} · 아이템 사전 ${itemMeta.ko.size}`);

  // ── 챔피언 루프 ──────────────────────────────────────────────────
  const keys = champions.map((c) => c.key).slice(0, LIMIT);
  const aram: Row[] = [];
  const usedItems = new Set<string>();
  const usedSpells = new Set<number>();
  /** 증강 슬러그 사전. 등장 순서대로 채우고 챔피언 행에는 인덱스만 싣는다. */
  const augIds: string[] = [];
  const augIndex = new Map<string, number>();
  const indexOfAug = (slug: string) => {
    let i = augIndex.get(slug);
    if (i == null) {
      i = augIds.push(slug) - 1;
      augIndex.set(slug, i);
    }
    return i;
  };
  const skipped: string[] = [];
  let augMiss = 0;
  let augTotal = 0;

  for (const [i, key] of keys.entries()) {
    const cs = stats.get(key);
    if (!cs || cs.winRate == null || cs.tier == null) continue;
    const dt = await fetchJson(`${DTODO}/data/${ver}/champions/${key}.json`);
    if (!dt) {
      skipped.push(key);
      continue;
    }

    // 증강은 전량 싣는다(화면이 "모든 증강 보기"로 펼친다). 희귀도 분류는 앱이
    // 자기 증강 풀에서 하므로 여기서는 나누지 않고 승률 내림차순으로만 둔다.
    const augments: AugEntry[] = (dt.augments ?? [])
      .map((a: any) => {
        const s = a.stats ?? {};
        augTotal++;
        const slug = augId.get(a.id) ?? null;
        if (!slug) augMiss++;
        // dtodo가 임계값을 같이 준다. 서버에서 이미 거른 듯하지만 정책이 바뀌면 노이즈가 샌다.
        const ok =
          slug != null &&
          s.winRate != null &&
          s.tier != null &&
          (s.games ?? 0) >= (s.winRateMinimumGames ?? 0);
        return ok ? { slug: slug as string, score: s.winRate as number, tier: s.tier as number } : null;
      })
      .filter((e: any): e is { slug: string; score: number; tier: number } => e != null)
      .sort((a: any, b: any) => b.score - a.score)
      .map((e: any): AugEntry => [indexOfAug(e.slug), Math.round(e.score * 1e4), e.tier]);

    // ponytail: 아이템은 build.queueId=450 — 일반 칼바람이지 광란(2400)이 아니다.
    // 광란 아이템 통계는 어느 소스에도 없다(Blitz는 tier 1~5만 준다).
    // 티어리스트 목록 하단 출처 문구에 "아이템은 일반 칼바람 통계"로 명시한다.
    //
    // `build` 는 태그별 빌드(`builds`) 중 최다 픽 하나다. 예전엔 코어를 버리고 situationalItems 를
    // 승률순으로 뽑아서 탱커 46명 중 강철심장이 4명에게만 나왔다 — 강철심장은 코어라 상황템 풀에
    // 애초에 없고, 승률순이면 늦게 사는 방템이 생존자 편향으로 뜬다. 코어 → 확장 → 상황템(판수순)이 정답.
    // startingItems 는 챔피언 대부분이 표본 1~11판이라 싣지 않는다.
    const build = buildOrder(dt.build).map(String);
    // 판수순은 응답 순서에 기대지 않고 직접 정렬한다 — 승률순으로 바뀌면 생존자 편향 방템이 앞에 온다.
    const situational = ((dt.build?.situationalItems ?? []) as any[])
      .filter((x) => (x.games ?? 0) >= MIN_GAMES && !build.includes(String(x.id)))
      .sort((a, b) => (b.games ?? 0) - (a.games ?? 0))
      .map((x) => String(x.id));
    // 아이콘이 없는 스펠이 하나라도 있으면 통째로 뺀다 — 화면은 스펠 pill 을 숨긴다.
    const spell = topSpells(dt);
    const spellIds: number[] = spell?.ids ?? [];

    const row: Row = {
      key,
      score: r4(cs.winRate),
      sub: r4(cs.pickRate ?? 0),
      tier: 'D', // 아래 매핑에서 덮어쓴다
      srcTier: cs.tier,
      augments,
      build,
      situational,
      ...(spellIds.length && spellIds.every((id) => spellIcon.has(id))
        ? { spells: spellIds, spellPick: r4(spell!.pick) }
        : { spells: [], spellPick: 0 }),
    };
    [...build, ...situational].forEach((id) => usedItems.add(id));
    row.spells.forEach((id) => usedSpells.add(id));
    aram.push(row);

    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${keys.length}...`);
    await sleep(150);
  }

  aram.sort((a, b) => a.srcTier - b.srcTier || b.score - a.score); // 소스 티어 순, 동티어는 승률 순

  // tier5 는 절반이 넘어서 그대로 두면 D 하나에 다 몰린다. 승률로 반 갈라 C/D.
  const half = Math.ceil(aram.filter((r) => r.srcTier === 5).length / 2);
  let i5 = 0;
  for (const row of aram) {
    row.tier = TIER_MAP[row.srcTier] ?? (i5++ < half ? 'C' : 'D');
    delete (row as Partial<Row>).srcTier;
  }

  // sanity 가드 — 소스가 반쯤 죽은 날 좋은 JSON을 쓰레기로 덮어쓰지 않게.
  if (LIMIT === Infinity && aram.length < 150) {
    throw new Error(`수집 부족 — ${aram.length}명. 쓰지 않고 중단.`);
  }

  // 스펠은 이름을 안 그려서 로케일 무관 — 아이콘 경로만 본 파일에 싣는다.
  const spellIcons = Object.fromEntries([...usedSpells].sort((a, b) => a - b).map((id) => [id, spellIcon.get(id)]));

  fs.writeFileSync(
    path.join(OUT_DIR, 'tierlist.json'),
    JSON.stringify({ patch, date, generatedAt: new Date().toISOString(), augIds, spellIcons, aram }),
  );
  for (const suffix of ['ko', 'en'] as const) {
    const dict = [...usedItems]
      .sort()
      .map((id) => ({ id, ...itemMeta[suffix].get(id)! }))
      .filter((x) => x.name);
    fs.writeFileSync(path.join(OUT_DIR, `tierlist-items.${suffix}.json`), JSON.stringify(dict));
  }

  const kb = (f: string) => (fs.statSync(path.join(OUT_DIR, f)).size / 1024).toFixed(0);
  const dist = (['S', 'A', 'B', 'C', 'D'] as Tier[])
    .map((t) => `${t} ${aram.filter((r) => r.tier === t).length}`)
    .join(' · ');
  console.log(`\n칼바람 ${aram.length}명 (${dist}) · 증강 사전 ${augIds.length}개 · 아이템 사전 ${usedItems.size}개`);
  console.log(`증강 조인 실패 ${augMiss}/${augTotal} (${((augMiss / augTotal) * 100).toFixed(1)}%)`);
  // 정확도 회귀 체크 — 탱커 빌드에 강철심장이 빠지면 매핑이 다시 깨진 것이다.
  const tanks = aram.filter((r) => tagsByKey.get(r.key)?.includes('Tank'));
  const noHeart = tanks.filter((r) => !r.build.includes('3084')).map((r) => nameByKey.get(r.key));
  console.log(`탱커 빌드 강철심장 ${tanks.length - noHeart.length}/${tanks.length} · 없음: ${noHeart.join(', ')}`);
  if (skipped.length) console.log(`스킵: ${skipped.join(', ')}`);
  console.log(
    `→ tierlist.json ${kb('tierlist.json')}KB · items.ko ${kb('tierlist-items.ko.json')}KB · items.en ${kb('tierlist-items.en.json')}KB`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
