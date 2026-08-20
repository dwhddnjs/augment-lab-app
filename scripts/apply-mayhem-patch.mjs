#!/usr/bin/env node
/**
 * ARAM 아수라장 패치 반영 (공용 증강분). 최신 실행 기준: 26.16.
 *
 *   node scripts/apply-mayhem-patch.mjs           # 미리보기(dry-run)
 *   node scripts/apply-mayhem-patch.mjs --write    # 실제 파일 반영
 *
 * 기준선 = 현재 augments.{ko,en}.json (augmentNameId로 CDragon에 매핑).
 * CommunityDragon latest 를 정답으로:
 *   - 신규 공용 증강 추가 (설명은 stringtable 자동 정제 초안 → 검수 페이지에서 다듬을 것)
 *   - 개명/리워크된 증강은 id 유지(빌드 augmentIds 참조 보호) 후 이름·rarity·아이콘 갱신
 *   - 아이콘 경로 / rarity 변경 반영
 * 기존 199개의 다듬어진 설명은 보존(개명건 제외).
 *
 * 챔피언 고유 증강은 아직 CDragon 미노출 → 이 스크립트 범위 밖.
 *
 * 수치 출처 주의: CDragon 에는 증강 수치가 없다(cherry-augments.json 에 dataValues 없음).
 * stringtable 설명의 수치는 @Var@ 플레이스홀더라 정제하면 사라진다. 그래서 이 스크립트는
 * 신규 증강의 설명을 "초안"으로만 만들고, 수치가 유실된 항목을 따로 리포트한다.
 * 기존 증강의 실수치는 위키(Module:MayhemAugmentData/data)에만 있어 대조용으로 받아
 *   - 앱에 수치가 아예 없고 위키엔 있는 "명백한 누락"만 보강 후보로 뽑고
 *   - 나머지 수치 차이는 docs/augment-diff.json 으로 떨궈 검수 페이지에서 눈으로 판단한다.
 * 위키 수치를 일괄 반영하지 않는다 — 서술 상세도 차이가 대부분이라 덮으면 기존 설명이 무너진다.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const CDRAGON = 'https://raw.communitydragon.org/latest';
const UA = { 'User-Agent': 'Mozilla/5.0 (augment-data-build)' };
const EN_PATH = path.join(root, 'src/features/augments/data/augments.en.json');
const KO_PATH = path.join(root, 'src/features/augments/data/augments.ko.json');
const DIFF_PATH = path.join(root, 'docs/augment-diff.json');
const CACHE_DIR = path.join(root, 'node_modules/.cache/augment-data');
const MAP30_CACHE = path.join(CACHE_DIR, 'map30.bin.json');

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9가-힣]/gi, '');
const base = (p) => (p || '').replace(/.*\//, '').toLowerCase();
const core = (id) => id.replace(/^ARAM_/i, '').replace(/_(Active|Cutlass)$/i, '').replace(/^Quest_/i, '').toLowerCase();
const slugify = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isGeneric = (b) => /genericability/i.test(b);
const RAR = { kSilver: 'silver', kGold: 'gold', kPrismatic: 'prismatic' };
const iconSlug = (p) => base(p).replace(/\.(png|jpg|jpeg).*$/i, '').replace(/_(small|large)$/i, '');

// stringtable 변수·마크업 정제 (초안 품질 — 검수에서 다듬음)
function clean(s) {
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\(%i:[^%]*%\)/g, '')
    .replace(/%i:[^%]*%/g, '')
    .replace(/@[^@]*@%?/g, '') // trailing % 까지 — 안 그러면 "적을% 둔화" 같은 조각이 남는다
    .replace(/\s+([.,%)])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`fetch ${res.status}: ${url}`);
  return res.json();
}

// 위키 마크업을 평문으로. 수치는 살리고 링크·강조·틀만 벗긴다.
function stripWiki(s) {
  let out = s.replace(/\\"/g, '"');
  // 중첩 틀을 안쪽부터 반복해서 벗긴다 — 한 번만 돌리면 {{as|…{{fd|…}}…}} 에서 수치가 깨진다.
  for (let i = 0; i < 6; i++) {
    const before = out;
    out = out
      .replace(/\{\{(?:as|ap|ad|fd|pp|pt|sbc|tt)\|([^{}|]*?)(?:\|[^{}|]*)*\}\}/gi, '$1')
      .replace(/\{\{tip\|[^{}|]*\|([^{}|]*)\}\}/gi, '$1')
      .replace(/\{\{tip\|([^{}|]*)\}\}/gi, '$1')
      .replace(/\{\{(?:ai|si|ii|bi)\|([^{}|]*)(?:\|[^{}|]*)*\}\}/gi, '$1');
    if (out === before) break;
  }
  return out
    .replace(/\{\{[^{}]*\}\}/g, '') // 남은 틀
    .replace(/\[\[File:[^\]]*\]\]/gi, '') // 파일 임베드
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1') // [[대상|표시]] → 표시
    .replace(/\[\[([^\]]*)\]\]/g, '$1') // [[표시]]
    .replace(/'''/g, '')
    .replace(/''/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\|icononly=true/gi, '')
    .replace(/\s+([.,%)])/g, '$1')
    .replace(/\(\s*\+?\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// 위키 Module:MayhemAugmentData/data → Map<이름, {desc, tier}>
// 기존 증강의 실수치는 여기에만 있다. 신규분은 아직 반영돼 있지 않다(대조에 쓰지 않음).
async function getWiki() {
  // 위키는 Cloudflare 뒤에 있어 node fetch 의 TLS 지문으로는 403 이 난다(curl 은 통과).
  // 외부 프로세스 한 줄이 우회 라이브러리보다 싸다.
  const url = 'https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data?action=raw';
  const lua = execFileSync(
    'curl',
    ['-sSL', '--max-time', '60', '-A', 'Mozilla/5.0 (augment-data-build)', url],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  if (!/^\s*--\s*<pre>|return \{/.test(lua)) throw new Error('위키 응답이 Lua 데이터가 아니다');
  const m = new Map();
  const re = /\t\["(.+?)"\] = \{\s*\["description"\] = "((?:[^"\\]|\\.)*)",\s*\["tier"\] = "(\w+)"/g;
  for (const g of lua.matchAll(re)) {
    m.set(g[1], { desc: stripWiki(g[2]), tier: g[3].toLowerCase() });
  }
  if (m.size === 0) throw new Error('위키 파싱 결과가 비었다');
  return m;
}

// 게임 bin(map30)에서 증강 계수를 뽑는다. stringtable 설명의 @Var@ 를 실제 수치로 바꾸는 유일한 출처.
// 20MB 라 로컬에 캐시한다.
async function getSpellValues() {
  const url = 'https://raw.communitydragon.org/latest/game/data/maps/shipping/map30/map30.bin.json';
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  if (!existsSync(MAP30_CACHE)) {
    console.log('  map30.bin.json 내려받는 중(20MB, 최초 1회)…');
    execFileSync('curl', ['-sSL', '--max-time', '300', '-o', MAP30_CACHE, url], { stdio: 'inherit' });
  }
  const bin = JSON.parse(readFileSync(MAP30_CACHE, 'utf8'));

  // 경로 기반 인덱스: Augment_<코드명> → {변수: 값}
  const byName = new Map();
  for (const [k, v] of Object.entries(bin)) {
    const m = /^Maps\/Shipping\/Map30\/Spells\/Augment_(.+)$/.exec(k);
    if (!m) continue;
    const dv = v?.mSpell?.DataValues;
    if (!Array.isArray(dv)) continue;
    const vals = {};
    for (const e of dv) if (e?.name != null) vals[e.name] = e.values?.[0];
    if (Object.keys(vals).length) byName.set(m[1].toLowerCase().replace(/_/g, ''), vals);
  }
  return byName;
}

// @Var@ · @Var*100@ 같은 표현식을 실제 수치로. 못 채우면 null 을 돌려 호출부가 판단하게 한다.
function fillVars(raw, vals) {
  if (!raw) return { text: '', filled: true, missing: [] };
  // @f1@/@f2@ 는 게임 안에서 "입힌 피해량: 1,234" 처럼 누적 통계를 띄우는 자리다.
  // 증강 카드에는 필요 없는 정보라 그 조각을 통째로 걷어낸다.
  raw = raw
    .replace(/(<br\s*\/?>|\n)*\s*<?[^.<>\n]{0,24}?:?\s*@f\d+@[^.<>\n]*/gi, '')
    .replace(/(<br\s*\/?>|\n)+\s*$/g, '');
  const missing = [];
  const text = raw.replace(/@([^@]+)@/g, (_, expr) => {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*(?:([*/])\s*([\d.]+))?$/.exec(expr.trim());
    if (!m || vals?.[m[1]] == null) { missing.push(expr.trim()); return ''; }
    let n = vals[m[1]];
    if (m[2] === '*') n *= Number(m[3]);
    if (m[2] === '/') n /= Number(m[3]);
    return String(Math.round(n * 1000) / 1000);
  });
  return { text, filled: missing.length === 0, missing };
}

const numsIn = (s) => (s.match(/\d+(?:\.\d+)?/g) ?? []).sort();

async function main() {
  console.log('CDragon 소스 로드…');
  const spellVals = await getSpellValues();
  const [cdEn, cdKo, stEn, stKo] = await Promise.all([
    getJson(`${CDRAGON}/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json`),
    getJson(`${CDRAGON}/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json`),
    getJson(`${CDRAGON}/game/en_us/data/menu/en_us/lol.stringtable.json`),
    getJson(`${CDRAGON}/game/ko_kr/data/menu/en_us/lol.stringtable.json`),
  ]);
  const cd = Object.values(cdEn).filter((x) => x && x.augmentNameId);
  const koNameById = new Map(Object.values(cdKo).filter((x) => x && x.id != null).map((x) => [x.id, x.nameTRA]));

  // stringtable → slug별 {summary, tooltip, desc} (프리픽스 체인 유연 처리)
  const buildSlugs = (st) => {
    const e = st.entries ?? st;
    const m = new Map();
    const addVar = (rec, kind, v) => { if (rec[kind] === undefined) rec[kind] = v; };
    for (const [k0, v] of Object.entries(e)) {
      const k = k0.toLowerCase();
      // 퀘스트 진행/마일스톤 등 본설명 아닌 키 제외
      if (/milestone|questcomplete|questmilestone|quest_finished|_quest_desc|spellmodifier|playerbuff/.test(k)) continue;
      const mm = /^(.*?)_(summary|tooltip|name|desc)$/.exec(k);
      if (!mm) continue;
      const [, slug, kind] = mm;
      // 프리픽스 체인(kiwi/cherry/aram/augment/quest)을 점진적으로 벗긴 변형 모두 등록
      const variants = new Set([slug, slug.replace(/_/g, '')]);
      let s = slug, prev;
      do { prev = s; s = s.replace(/^(kiwi|cherry|aram|augment|quest)_/, ''); variants.add(s); variants.add(s.replace(/_/g, '')); } while (s !== prev);
      for (const vv of variants) { if (!vv) continue; if (!m.has(vv)) m.set(vv, {}); addVar(m.get(vv), kind, v); }
    }
    return m;
  };
  const slugsEn = buildSlugs(stEn);
  const slugsKo = buildSlugs(stKo);
  const rawFrom = (slugs, a) => {
    const ic = iconSlug(a.augmentSmallIconPath);
    // augmentNameId 를 먼저 본다. 아이콘 파일명을 앞에 두면 파일을 돌려 쓰는 증강끼리 설명이 뒤바뀐다
    // (Executioner 의 아이콘이 spiritualpurification 이라 Spirit of the Jungle Main 설명을 물어왔었다).
    const cands = [
      a.augmentNameId.toLowerCase(), a.augmentNameId.toLowerCase().replace(/_/g, ''),
      core(a.augmentNameId), core(a.augmentNameId).replace(/_/g, ''),
      norm(a.nameTRA), norm(a.simpleNameTRA),
      ic, ic.replace(/_/g, ''),
    ];
    for (const c of cands) {
      const r = slugs.get(c);
      if (r && (r.summary || r.tooltip || r.desc)) return r.summary || r.tooltip || r.desc;
    }
    return '';
  };
  const descFrom = (slugs, a) => clean(rawFrom(slugs, a));

  const en = JSON.parse(readFileSync(EN_PATH, 'utf8'));
  const ko = JSON.parse(readFileSync(KO_PATH, 'utf8'));
  const koById = new Map(ko.map((a) => [a.id, a]));

  // 기준선 매핑
  const cdByName = new Map(), cdByIcon = new Map();
  for (const a of cd) { const n = norm(a.nameTRA); if (!cdByName.has(n)) cdByName.set(n, a); const b = base(a.augmentSmallIconPath); if (!isGeneric(b) && !cdByIcon.has(b)) cdByIcon.set(b, a); }
  const baseline = en.map((a) => ({ app: a, cd: cdByName.get(norm(a.name)) || cdByIcon.get(base(a.iconPath)) }));
  const baseIds = new Set(baseline.map((b) => b.cd?.augmentNameId).filter(Boolean));
  const baseCore = new Set([...baseIds].map(core));
  const appNames = new Set(en.map((a) => norm(a.name)));

  // 분류
  // 미완성/테스트 항목(이름이 '???' 인 ARAM_MissingPingAugment 등)도 신규에서 제외한다.
  const isNoise = (id) => /^(GoH|Crafting|Gamba|GainStat|Special|Null|Replace|Transmute)/i.test(id)
    || /AugmentSlot|StatAnvil/i.test(id)
    || /MissingPing|placeholder|_test$|debug/i.test(id);
  const isUnfinished = (a) => !a.nameTRA || a.nameTRA === '???';
  const looks = (a) => /^ARAM_/i.test(a.augmentNameId) || /\/Kiwi\//i.test(a.augmentSmallIconPath);
  const seen = new Set();
  const cand = cd.filter((a) => looks(a) && !isNoise(a.augmentNameId) && !isUnfinished(a) && (seen.has(a.augmentNameId) ? false : (seen.add(a.augmentNameId), true)));
  const added = [], renamed = [];
  for (const a of cand) {
    if (baseIds.has(a.augmentNameId) || appNames.has(norm(a.nameTRA))) continue;
    if (baseCore.has(core(a.augmentNameId))) {
      const old = baseline.find((b) => b.cd && core(b.cd.augmentNameId) === core(a.augmentNameId));
      if (old) renamed.push({ old, a });
    } else added.push(a);
  }

  // 1) 신규 추가
  const newEn = [], newKo = [], needsNumbers = [], noCoefficients = [];
  const valsFor = (a) => {
    const ids = [
      a.augmentNameId.toLowerCase().replace(/_/g, ''),
      a.augmentNameId.replace(/^ARAM_/i, '').toLowerCase().replace(/_/g, ''),
      norm(a.nameTRA),
    ];
    for (const k of ids) if (spellVals.has(k)) return spellVals.get(k);
    return null;
  };
  for (const a of added) {
    const id = slugify(a.nameTRA);
    const rarity = RAR[a.rarity];
    const iconPath = a.augmentSmallIconPath;
    const koName = koNameById.get(a.id) || a.nameTRA;
    const rawEn = rawFrom(slugsEn, a), rawKo = rawFrom(slugsKo, a);
    const vals = valsFor(a);
    // stringtable 의 @Var@ 를 게임 계수로 채운 뒤 정제한다. 순서를 바꾸면 수치가 먼저 지워진다.
    const fEn = fillVars(rawEn, vals), fKo = fillVars(rawKo, vals);
    const enDesc = clean(fEn.text);
    const koDesc = clean(fKo.text) || enDesc;
    newEn.push({ id, name: a.nameTRA, description: enDesc, rarity, iconPath });
    newKo.push({ id, name: koName, description: koDesc, rarity, iconPath });

    const hadVars = /@(?!f\d+@)[^@]+@/.test(rawKo) || /@(?!f\d+@)[^@]+@/.test(rawEn);
    if (hadVars && (!fKo.filled || !fEn.filled)) {
      needsNumbers.push({
        id, name: koName, en: a.nameTRA, rarity,
        description: koDesc,
        missingVars: [...new Set([...fKo.missing, ...fEn.missing])],
      });
    }
    // 게임 bin 에 계수가 아예 없다 = 아직 미출시거나 이미 제거된 증강일 수 있다(예: Speed Demon 은 26.14 에서 제거).
    if (!vals) noCoefficients.push({ id, name: koName, en: a.nameTRA, rarity });
  }

  // 2) 개명/리워크: id 유지, 이름·rarity·아이콘 갱신 (설명은 보존)
  const renameLog = [];
  for (const { old, a } of renamed) {
    const id = old.app.id;
    const enRec = en.find((x) => x.id === id);
    const koRec = koById.get(id);
    renameLog.push(`${old.app.name} → ${a.nameTRA} (id 유지: ${id})`);
    if (enRec) { enRec.name = a.nameTRA; enRec.rarity = RAR[a.rarity]; enRec.iconPath = a.augmentSmallIconPath; }
    if (koRec) { koRec.name = koNameById.get(a.id) || a.nameTRA; koRec.rarity = RAR[a.rarity]; koRec.iconPath = a.augmentSmallIconPath; }
  }

  // 3) 아이콘/rarity 변경 (개명·신규 외 기존 항목)
  const changeLog = [];
  for (const b of baseline) {
    if (!b.cd) continue;
    const enRec = en.find((x) => x.id === b.app.id);
    const koRec = koById.get(b.app.id);
    const newIcon = b.cd.augmentSmallIconPath;
    if (!isGeneric(base(newIcon)) && base(b.app.iconPath) !== base(newIcon)) {
      changeLog.push(`아이콘 ${b.app.name}: ${base(b.app.iconPath)} → ${base(newIcon)}`);
      if (enRec) enRec.iconPath = newIcon;
      if (koRec) koRec.iconPath = newIcon;
    }
    if (b.app.rarity !== RAR[b.cd.rarity]) {
      changeLog.push(`rarity ${b.app.name}: ${b.app.rarity} → ${RAR[b.cd.rarity]}`);
      if (enRec) enRec.rarity = RAR[b.cd.rarity];
      if (koRec) koRec.rarity = RAR[b.cd.rarity];
    }
  }

  // 4) 위키 대조 — 기존 증강의 수치 누락/차이만 뽑는다. 자동 반영은 하지 않는다.
  console.log('위키 대조 데이터 로드…');
  let wiki = new Map();
  try {
    wiki = await getWiki();
  } catch (e) {
    console.log(`  ⚠️  위키 로드 실패(${e.message}) — 수치 대조를 건너뛴다.`);
  }
  const wikiByName = new Map([...wiki].map(([k, v]) => [norm(k), { name: k, ...v }]));
  const missingNumbers = [], numberDiffs = [], disabled = [];
  for (const a of en) {
    const w = wikiByName.get(norm(a.name));
    if (!w) continue;
    if (/currently disabled/i.test(w.desc)) disabled.push(a.name);
    const appNums = numsIn(a.description), wikiNums = numsIn(w.desc);
    if (JSON.stringify(appNums) === JSON.stringify(wikiNums)) continue;
    const row = { id: a.id, name: a.name, app: a.description, wiki: w.desc, appNums, wikiNums };
    // 앱 설명에 수치가 아예 없는데 위키엔 있다 = 명백한 누락. 그 외는 서술 상세도 차이일 뿐이라 판단 보류.
    if (appNums.length === 0 && wikiNums.length > 0) missingNumbers.push(row);
    else numberDiffs.push(row);
  }

  const outEn = [...en, ...newEn];
  const outKo = [...ko, ...newKo];

  console.log(`\n신규 ${newEn.length} · 개명 ${renamed.length} · 변경 ${changeLog.length}  →  ${en.length} → ${outEn.length}개`);
  console.log('\n[개명]'); renameLog.forEach((l) => console.log('  ' + l));
  console.log('\n[변경]'); changeLog.forEach((l) => console.log('  ' + l));
  console.log('\n[신규 설명 정제 샘플 5]');
  for (const a of newKo.slice(0, 5)) console.log(`  · ${a.name} [${a.rarity}]\n      ${a.description || '(설명 없음)'}`);
  const emptyDesc = newKo.filter((a) => !a.description);
  if (emptyDesc.length) console.log(`\n⚠️  설명 비어있는 신규: ${emptyDesc.length} → ${emptyDesc.map((a) => a.name).join(', ')}`);

  console.log(`\n[게임 계수를 못 찾은 신규] ${noCoefficients.length}건 — 미출시이거나 이미 제거된 증강일 수 있다`);
  console.log('  ' + noCoefficients.map((a) => `${a.name}(${a.en})`).join(', '));

  console.log(`\n[수치를 여전히 못 채운 신규] ${needsNumbers.length}건 — 손으로 확인해야 한다`);
  for (const a of needsNumbers) console.log(`  · ${a.name} (${a.en}) [${a.rarity}]  못 채운 변수: ${a.missingVars.join(', ')}\n      ${a.description.slice(0, 160)}`);

  console.log(`\n[명백한 수치 누락] ${missingNumbers.length}건 — 앱 설명엔 수치가 없고 위키엔 있다 (보강 대상)`);
  for (const d of missingNumbers) console.log(`  · ${d.name}\n      app : ${d.app}\n      wiki: ${d.wiki}`);

  console.log(`\n[확인 필요한 수치 차이] ${numberDiffs.length}건 — 대개 서술 상세도 차이. 자동 반영하지 않는다`);
  console.log(`  (전체 목록은 docs/augment-diff.json / 검수 페이지에서 확인)`);

  if (disabled.length) console.log(`\n[위키가 "현재 비활성"이라 적은 증강] ${disabled.length}건 → ${disabled.join(', ')}`);

  if (WRITE) {
    writeFileSync(EN_PATH, JSON.stringify(outEn, null, 2) + '\n');
    writeFileSync(KO_PATH, JSON.stringify(outKo, null, 2) + '\n');
    writeFileSync(
      DIFF_PATH,
      JSON.stringify({ generatedFrom: 'CDragon latest + map30.bin + wiki MayhemAugmentData', newIds: newEn.map((a) => a.id), needsNumbers, noCoefficients, missingNumbers, numberDiffs, disabled }, null, 2) + '\n',
    );
    console.log('\n✓ 파일 반영 완료. 이제: node scripts/gen-augment-check.mjs');
  } else {
    console.log('\n(미리보기 — 반영하려면 --write)');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
