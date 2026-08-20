#!/usr/bin/env node
/**
 * 클래식(무작위 총력전: 아수라장 — 클래식 스타일) 전용 아이템 수급.
 *
 *   node scripts/fetch-classic-items.mjs             # 수집 + 저장
 *   node scripts/fetch-classic-items.mjs --refresh   # map453 캐시 무시하고 다시 받기
 *
 * 클래식은 협곡 아이템을 쓰지 않는다. 시즌 초기 레트로 아이템 세트(77xxxx id)를 쓴다 —
 * 스타크의 열정·쌍둥이 그림자·아트마의 창·마드레드의 피갈퀴손 같은 구버전 아이템이라
 * 앱의 items.{ko,en}.json(협곡 map 11) 254개에는 한 개도 없다.
 *
 * 정답지는 게임 bin 이다(아레나 증강 수치에 map30.bin.json 을 쓰는 것과 같은 구조):
 *   Maps/Shipping/Map453/Modes/JADE
 *     ├ itemLists[]   → GameModeItemList.mItems      : 상점 전체
 *     └ mItemShopData → ItemShopGameModeData
 *                        .CompletedItems             : 완성 아이템(빌드 그리드용)
 *
 * DDragon 의 maps 필드를 믿으면 안 된다 — map 453 에 현대 협곡 아이템까지 true 로 달려 있어
 * 무한의 대검이 3031·773031 두 벌로 잡힌다. bin 의 상점 목록만이 실제 진열이다.
 *
 * 해시 키({7d7e7c08} 등)는 패치마다 바뀔 수 있으므로 절대 하드코딩하지 않는다.
 * 반드시 JADE 노드에서 포인터를 따라가고, 두 itemList 중 원소가 77 로 시작하는 쪽을 상점으로 고른다.
 *
 * 출력:
 *   src/features/items/data/classic-items.{ko,en}.json  — Item 스키마(items.*.json 과 동일)
 *   src/features/items/data/classic-item-ids.json       — 완성 아이템 id 배열
 *
 * stats 는 비워 두고 나온다. 반드시 이어서 실행할 것:
 *   node scripts/parse-item-stats.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const REFRESH = process.argv.includes('--refresh');

const DATA_DIR = path.join(root, 'src/features/items/data');
const CACHE_DIR = path.join(root, 'node_modules/.cache/augment-data');
const MAP453_CACHE = path.join(CACHE_DIR, 'map453.bin.json');
const MAP453_URL =
  'https://raw.communitydragon.org/latest/game/data/maps/shipping/map453/map453.bin.json';

// 아이템 메타·아이콘은 DDragon 에서 온다. 앱이 이미지 URL 에 쓰는 버전과 반드시 같아야
// 한다 — 버전이 낮으면 레트로 아이콘이 403 이다(16.11.1 에는 773031.png 가 없다).
const DDRAGON_VERSION = JSON.parse(
  readFileSync(path.join(root, 'src/lib/version.json'), 'utf8'),
).ddragonVersion;

const LOCALES = [
  ['ko', 'ko_KR'],
  ['en', 'en_US'],
];

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (augment-data-build)' } });
  if (!res.ok) throw new Error(`fetch ${res.status}: ${url}`);
  return res.json();
}

// map453 bin(1.4MB)을 캐시해 둔다. 패치가 바뀌면 상점 구성이 바뀌므로 하루면 만료된다.
function loadMap453() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

  const MAX_AGE_MS = 24 * 60 * 60 * 1000;
  const stale =
    REFRESH ||
    !existsSync(MAP453_CACHE) ||
    Date.now() - statSync(MAP453_CACHE).mtimeMs > MAX_AGE_MS;

  if (stale) {
    console.log('  map453.bin.json 내려받는 중…');
    // 임시 파일에 받고 성공했을 때만 옮긴다 — 잘린 파일이 캐시에 남으면 영영 parse 에서 죽는다.
    const tmp = MAP453_CACHE + '.download';
    try {
      execFileSync('curl', ['-sSL', '--fail', '--max-time', '300', '-o', tmp, MAP453_URL], {
        stdio: 'inherit',
      });
      renameSync(tmp, MAP453_CACHE);
    } catch (e) {
      rmSync(tmp, { force: true });
      throw new Error('map453.bin.json 다운로드 실패: ' + e.message);
    }
  }

  try {
    return JSON.parse(readFileSync(MAP453_CACHE, 'utf8'));
  } catch (e) {
    rmSync(MAP453_CACHE, { force: true });
    throw new Error('map453 캐시가 깨져 있어 삭제했다. 다시 실행할 것 (' + e.message + ')');
  }
}

const itemIds = (list) => (list?.mItems ?? []).map((s) => String(s).split('/')[1]);
const isRetro = (id) => /^77\d{4}$/.test(id);

// JADE 게임모드 노드에서 상점 목록과 완성 아이템 목록을 뽑는다.
function readShop(bin) {
  const jade = bin['Maps/Shipping/Map453/Modes/JADE'];
  if (!jade) throw new Error('Maps/Shipping/Map453/Modes/JADE 노드가 없다 — bin 구조가 바뀌었다');

  // itemLists 는 [상점, 소모품] 두 벌이다. 레트로 id 비중이 높은 쪽이 상점.
  const lists = (jade.itemLists ?? []).map((ref) => itemIds(bin[ref]));
  if (!lists.length) throw new Error('JADE.itemLists 가 비었다');
  const shop = lists.sort(
    (a, b) => b.filter(isRetro).length - a.filter(isRetro).length,
  )[0];
  if (!shop.some(isRetro)) throw new Error('상점 목록에 레트로(77xxxx) 아이템이 없다');

  const shopData = bin[jade.mItemShopData];
  if (!shopData) throw new Error('JADE.mItemShopData 를 따라갈 수 없다');
  const completed = (shopData.CompletedItems ?? []).map((s) => String(s).split('/')[1]);
  if (!completed.length) throw new Error('CompletedItems 가 비었다');

  const orphan = completed.filter((id) => !shop.includes(id));
  if (orphan.length) {
    throw new Error(`완성 아이템이 상점 목록 밖에 있다: ${orphan.join(', ')}`);
  }

  return { shop, completed };
}

async function main() {
  console.log(`DDragon ${DDRAGON_VERSION} 기준으로 클래식 아이템을 수집한다.`);

  const bin = loadMap453();
  const { shop, completed } = readShop(bin);
  console.log(`  상점 ${shop.length}개 / 완성 ${completed.length}개`);

  // id 오름차순으로 고정 — ko/en 파일 순서가 같아야 대조·diff 가 성립한다.
  const ids = [...shop].sort((a, b) => Number(a) - Number(b));

  for (const [suffix, ddLocale] of LOCALES) {
    const data = (
      await getJson(
        `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/${ddLocale}/item.json`,
      )
    ).data;

    const missing = ids.filter((id) => !data[id]);
    if (missing.length) {
      throw new Error(
        `DDragon ${DDRAGON_VERSION}/${ddLocale} 에 없는 아이템 ${missing.length}개: ${missing.join(', ')}`,
      );
    }

    // items.*.json 과 완전히 같은 Item 스키마로 맞춘다(useItems 가 두 목록을 이어 붙인다).
    // stats 는 parse-item-stats.mjs 가 ko description 의 <stats> 블록에서 다시 채운다.
    const items = ids.map((id) => {
      const it = data[id];
      return {
        id,
        name: it.name,
        description: it.description,
        plaintext: it.plaintext ?? '',
        gold: it.gold,
        tags: it.tags ?? [],
        stats: it.stats ?? {},
        imageKey: it.image.full,
      };
    });

    writeFileSync(
      path.join(DATA_DIR, `classic-items.${suffix}.json`),
      JSON.stringify(items, null, 2) + '\n',
    );
    console.log(`  → classic-items.${suffix}.json (${items.length}개)`);
  }

  writeFileSync(
    path.join(DATA_DIR, 'classic-item-ids.json'),
    JSON.stringify([...completed].sort((a, b) => Number(a) - Number(b))) + '\n',
  );
  console.log(`  → classic-item-ids.json (${completed.length}개)`);

  console.log('\n이어서 실행할 것: node scripts/parse-item-stats.mjs');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
