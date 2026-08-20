#!/usr/bin/env node
/**
 * 증강마다 CDragon augmentNameId 와 등장 모드(modes)를 확정해 박아넣는다.
 *
 *   node scripts/tag-augment-modes.mjs           # 미리보기(dry-run)
 *   node scripts/tag-augment-modes.mjs --write    # 실제 반영
 *
 * 왜 필요한가 —
 *   cherry-augments.json 에는 모드 구분이 없다. 그래서 "CDragon 에 있는데 앱에 없는 증강"을
 *   전부 칼바람에 넣었다가, 실제로는 아수라장 클래식 스타일 전용인 증강이 칼바람 풀을 오염시켰다.
 *   모드를 가르는 정답은 augment-lists.json 이다:
 *     KIWI      → 칼바람 나락 아수라장 (aram)
 *     KIWI_JADE → 아수라장 클래식 스타일 (classic)
 *     CHERRY    → 아레나 (이 앱에서는 features/arena 가 따로 관리)
 *
 * 그리고 CDragon 에는 동명 증강이 115쌍 있다(ARAM_ADAPt vs ADAPt 처럼 한쪽만 풀에 속한다).
 * 이름으로 매칭하면 어느 쌍둥이가 걸릴지 순회 순서에 달리므로, 풀 소속을 이름보다 먼저 본다.
 * 한 번 확정한 augmentNameId 는 데이터에 저장해 이후 조회가 이 키 하나로 가게 한다.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const CDRAGON = 'https://raw.communitydragon.org/latest';
const UA = { 'User-Agent': 'Mozilla/5.0 (augment-data-build)' };
const EN_PATH = path.join(root, 'src/features/augments/data/augments.en.json');
const KO_PATH = path.join(root, 'src/features/augments/data/augments.ko.json');

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
const base = (p) => (p || '').replace(/.*\//, '').toLowerCase();
// modeName → 이 앱에서 쓰는 모드 키. CHERRY 는 아레나라 여기서 다루지 않는다.
const MODE_OF = { KIWI: 'aram', KIWI_JADE: 'classic' };

// augment-lists 의 KIWI 풀에는 들어 있지만 실제 칼바람 드래프트에서는 뜨지 않는 증강.
// 게임에서 직접 확인한 결과라 데이터보다 우선한다 — 여기 있으면 'aram' 을 붙이지 않는다.
// (풀 목록이 실제 출현과 어긋나는 경우가 있어, 사람이 확인한 걸 스크립트가 되돌리면 안 된다.)
const NOT_IN_ARAM = new Set([
  'DoubleStrike',           // 2연속 방어
  'SupportMain',            // 서포터 주력
  'Quest_Sneakerhead',      // 신발 수집가
  'Adamant',                // 단호함
  'VoidDash',               // 공허 돌진
  'SnapBack',               // 원상복구
  'KeepGoing',              // 재장전
  'Vampirism',              // 흡혈병
  'SpecializedEmpowerment', // 위력 추구
]);

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`fetch ${res.status}: ${url}`);
  return res.json();
}

const [augments, lists] = await Promise.all([
  getJson(`${CDRAGON}/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json`),
  getJson(`${CDRAGON}/plugins/rcp-be-lol-game-data/global/default/v1/augment-lists.json`),
]);

const cd = Object.values(augments).filter((x) => x && x.augmentNameId);
const byNameId = new Map(cd.map((a) => [a.augmentNameId, a]));

// modeName → augmentNameId 집합
const pools = new Map();
for (const entry of lists) {
  pools.set(entry.modeName, new Set(entry.augmentList.map((p) => p.split('/').pop())));
}
const poolsOf = (nameId) =>
  [...pools].filter(([, set]) => set.has(nameId)).map(([m]) => m);

// 이름이 같은 CDragon 후보들
const byName = new Map();
for (const a of cd) {
  const k = norm(a.nameTRA);
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(a);
}

/**
 * 앱 증강 하나의 augmentNameId 를 확정한다.
 * 풀 소속 > 아이콘 일치 > 남은 후보 순. 동명이인 함정을 피하는 게 핵심이다.
 */
function resolveNameId(app) {
  if (app.augmentNameId && byNameId.has(app.augmentNameId)) {
    return { a: byNameId.get(app.augmentNameId), how: 'kept' };
  }
  const cands = byName.get(norm(app.name)) ?? [];
  if (!cands.length) return { a: null, how: 'none' };
  for (const mode of ['KIWI', 'KIWI_JADE', 'CHERRY']) {
    const hit = cands.find((a) => pools.get(mode)?.has(a.augmentNameId));
    if (hit) return { a: hit, how: `pool:${mode}` };
  }
  const byIcon = cands.find((a) => base(a.augmentSmallIconPath) === base(app.iconPath));
  if (byIcon) return { a: byIcon, how: 'icon' };
  return { a: cands[0], how: cands.length > 1 ? 'name(ambiguous)' : 'name' };
}

const en = JSON.parse(readFileSync(EN_PATH, 'utf8'));
const ko = JSON.parse(readFileSync(KO_PATH, 'utf8'));
const koById = new Map(ko.map((a) => [a.id, a]));

const unresolved = [];
const ambiguous = [];
const iconDiffs = [];
const forcedOut = [];
const tally = { aram: 0, classic: 0, both: 0, unreleased: 0 };
const byMode = { aram: [], classic: [], unreleased: [] };

for (const a of en) {
  const { a: cdEntry, how } = resolveNameId(a);
  const koRec = koById.get(a.id);
  if (!cdEntry) {
    unresolved.push(a.name);
    a.augmentNameId = a.augmentNameId ?? '';
    a.modes = [];
    if (koRec) { koRec.augmentNameId = a.augmentNameId; koRec.modes = []; }
    byMode.unreleased.push(a.name);
    tally.unreleased++;
    continue;
  }
  if (how === 'name(ambiguous)') ambiguous.push(`${a.name} → ${cdEntry.augmentNameId}`);

  let modes = poolsOf(cdEntry.augmentNameId)
    .map((m) => MODE_OF[m])
    .filter(Boolean);
  if (NOT_IN_ARAM.has(cdEntry.augmentNameId)) {
    modes = modes.filter((m) => m !== 'aram');
    forcedOut.push(a.name);
  }

  // 아이콘은 **건드리지 않는다.** CDragon 값이 실제 인게임 아이콘과 다른 경우가 있어
  // (BONK! 은 게임에서 generic 을 쓰고, 바늘꽂이는 아예 다른 파일이 잡혔다) 자동 교정이
  // 손으로 맞춰둔 아이콘을 도로 망가뜨렸다. 차이는 리포트만 하고 판단은 사람이 한다.
  const cdIcon = cdEntry.augmentSmallIconPath;
  if (cdIcon && base(cdIcon) !== base(a.iconPath)) {
    iconDiffs.push(`${a.name}: 앱 ${base(a.iconPath)} / CDragon ${base(cdIcon)}`);
  }

  a.augmentNameId = cdEntry.augmentNameId;
  a.modes = modes;
  if (koRec) { koRec.augmentNameId = cdEntry.augmentNameId; koRec.modes = modes; }

  if (modes.length === 0) { tally.unreleased++; byMode.unreleased.push(a.name); }
  else {
    if (modes.includes('aram')) { tally.aram++; byMode.aram.push(a.name); }
    if (modes.includes('classic')) { tally.classic++; byMode.classic.push(a.name); }
    if (modes.length === 2) tally.both++;
  }
}

// 클래식 풀에 있는데 앱에 아직 없는 증강
const appIds = new Set(en.map((a) => a.augmentNameId).filter(Boolean));
const missingClassic = [...(pools.get('KIWI_JADE') ?? [])]
  .filter((nid) => !appIds.has(nid))
  .map((nid) => ({ nid, name: byNameId.get(nid)?.nameTRA ?? '(CDragon 에 없음)' }));
const missingAram = [...(pools.get('KIWI') ?? [])]
  .filter((nid) => !appIds.has(nid))
  .map((nid) => ({ nid, name: byNameId.get(nid)?.nameTRA ?? '(CDragon 에 없음)' }));

console.log(`전체 ${en.length}개`);
console.log(`  칼바람(aram)   ${tally.aram}`);
console.log(`  클래식(classic) ${tally.classic}   (그중 양쪽 공유 ${tally.both})`);
console.log(`  미출시(modes=[]) ${tally.unreleased}`);

if (forcedOut.length) {
  console.log(`\n[풀에는 있지만 칼바람에서 확인 안 돼 제외한 건] ${forcedOut.length}건 → ${forcedOut.join(', ')}`);
}

console.log(`\n[아이콘이 CDragon 과 다른 건] ${iconDiffs.length}건 — 자동으로 바꾸지 않는다. 눈으로 판단할 것`);
iconDiffs.forEach((l) => console.log('  ' + l));

if (ambiguous.length) {
  console.log(`\n⚠️  [동명이인인데 풀·아이콘으로도 못 가린 건] ${ambiguous.length}건 — 눈으로 확인할 것`);
  ambiguous.forEach((l) => console.log('  ' + l));
}
if (unresolved.length) {
  console.log(`\n⚠️  [CDragon 에서 못 찾음] ${unresolved.length}건 → ${unresolved.join(', ')}`);
}

console.log(`\n[미출시로 빠지는 것] ${byMode.unreleased.length}건`);
console.log('  ' + byMode.unreleased.join(', '));

if (missingAram.length) {
  console.log(`\n[칼바람 풀에 있는데 앱에 없는 증강] ${missingAram.length}건`);
  missingAram.forEach((m) => console.log(`  ${m.nid} — ${m.name}`));
}
if (missingClassic.length) {
  console.log(`\n[클래식 풀에 있는데 앱에 없는 증강] ${missingClassic.length}건`);
  missingClassic.forEach((m) => console.log(`  ${m.nid} — ${m.name}`));
}

if (WRITE) {
  writeFileSync(EN_PATH, JSON.stringify(en, null, 2) + '\n');
  writeFileSync(KO_PATH, JSON.stringify(ko, null, 2) + '\n');
  console.log('\n✓ 반영 완료. 이제: node scripts/gen-augment-check.mjs');
} else {
  console.log('\n(미리보기 — 반영하려면 --write)');
}
