#!/usr/bin/env node
/**
 * 증강 데이터 정합성 자체 검증.
 *
 *   node scripts/check-augment-data.mjs
 *
 * 모드 분리가 깨지면 화면만 봐서는 알 수 없다 — 다른 모드 증강이 칼바람 풀에 섞여도
 * 카드는 멀쩡히 렌더되기 때문이다. 실제로 그렇게 클래식 전용 증강 55개가 칼바람에
 * 들어갔던 적이 있어서, 그 사고를 잡아내는 게 이 스크립트의 존재 이유다.
 *
 * 검사는 ko·en 양쪽에 똑같이 건다. 한쪽만 보면 다른 쪽 로케일에서만 깨지는 건을 놓친다
 * (실제로 설명 길이를 ko 로만 재던 동안 en 은 119건이 카드 밖으로 넘쳐 있었다).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const load = (l) =>
  JSON.parse(readFileSync(path.join(root, `src/features/augments/data/augments.${l}.json`), 'utf8'));

const ko = load('ko');
const en = load('en');
const LOCALES = [
  ['ko', ko],
  ['en', en],
];
const fails = [];
const check = (ok, msg) => {
  console.log(`  ${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) fails.push(msg);
};

console.log('증강 데이터 검증\n');

// 1) 두 로케일 구조 일치
check(ko.length === en.length, `ko/en 개수 일치 (${ko.length} / ${en.length})`);
const koIds = ko.map((a) => a.id);
const enIds = en.map((a) => a.id);
check(new Set(koIds).size === koIds.length, 'ko id 중복 없음');
check(new Set(enIds).size === enIds.length, 'en id 중복 없음');
check(
  koIds.every((id, i) => id === enIds[i]),
  'ko/en id 순서까지 동일',
);
// 모드·등급·아이콘은 로케일과 무관한 값이라 두 파일이 어긋나면 그 자체가 사고다.
const enById = new Map(en.map((a) => [a.id, a]));
const drifted = ko.filter((a) => {
  const e = enById.get(a.id);
  if (!e) return true;
  return (
    JSON.stringify(a.modes ?? null) !== JSON.stringify(e.modes ?? null) ||
    a.rarity !== e.rarity ||
    a.iconPath !== e.iconPath ||
    a.augmentNameId !== e.augmentNameId
  );
});
check(
  drifted.length === 0,
  `ko/en 의 modes·rarity·iconPath·augmentNameId 동일${drifted.length ? ` — ${drifted.slice(0, 5).map((a) => a.name).join(', ')}` : ''}`,
);

// 2) 매칭 키
const noNameId = ko.filter((a) => !a.augmentNameId);
check(
  noNameId.length <= 1,
  `augmentNameId 누락 ${noNameId.length}건${noNameId.length ? ` (${noNameId.map((a) => a.name).join(', ')})` : ''}`,
);
const nameIds = ko.map((a) => a.augmentNameId).filter(Boolean);
const dupeNameId = nameIds.filter((v, i) => nameIds.indexOf(v) !== i);
check(dupeNameId.length === 0, `augmentNameId 중복 없음${dupeNameId.length ? ` — ${dupeNameId.join(', ')}` : ''}`);

// 3) 모드 태그
const VALID = new Set(['aram', 'classic']);
for (const [locale, list] of LOCALES) {
  const badMode = list.filter((a) => !Array.isArray(a.modes) || a.modes.some((m) => !VALID.has(m)));
  check(badMode.length === 0, `[${locale}] modes 값이 모두 유효${badMode.length ? ` — ${badMode.map((a) => a.name).join(', ')}` : ''}`);
}

const aram = ko.filter((a) => a.modes?.includes('aram'));
const classic = ko.filter((a) => a.modes?.includes('classic'));
const unreleased = ko.filter((a) => !a.modes?.length);
console.log(`\n  칼바람 ${aram.length} · 클래식 ${classic.length} · 미출시 ${unreleased.length} (전체 ${ko.length})`);
check(
  aram.length + unreleased.length + classic.filter((a) => !a.modes.includes('aram')).length === ko.length,
  '모드 분류에 빠진 항목 없음',
);

// 4) 모드별 개수 스냅샷 — 이게 이 스크립트의 핵심이다.
//
// 어떤 증강이 어느 모드에 속하는지의 정답은 CDragon `v1/augment-lists.json` 에만 있고,
// 데이터 파일 안에서는 자기 자신을 근거로 삼을 수밖에 없어 논리적으로 검증이 불가능하다.
// (예전 검사가 `!modes.includes('aram') && modes.includes('aram')` 라는 모순식이라
//  영원히 통과했던 이유다 — 검증할 수 없는 것을 검증하는 척했다.)
//
// 그래서 사람이 확인한 시점의 개수를 박아두고 흔들리면 멈춘다. 클래식 전용 55개가
// 칼바람에 섞였던 사고는 aram 이 211 → 266 으로 뛰므로 여기서 확실히 걸린다.
// 패치로 증강이 늘거나 줄면 tag-augment-modes.mjs 를 돌린 뒤 이 값을 함께 갱신할 것.
const EXPECTED = { total: 280, aram: 211, classic: 187, unreleased: 38 };
check(ko.length === EXPECTED.total, `전체 ${EXPECTED.total}개 유지 (실제 ${ko.length})`);
check(aram.length === EXPECTED.aram, `칼바람 ${EXPECTED.aram}개 유지 (실제 ${aram.length})`);
check(classic.length === EXPECTED.classic, `클래식 ${EXPECTED.classic}개 유지 (실제 ${classic.length})`);
check(unreleased.length === EXPECTED.unreleased, `미출시 ${EXPECTED.unreleased}개 유지 (실제 ${unreleased.length})`);

// 5) 칼바람에 반드시 있어야 하는 것 / 절대 없어야 하는 것 — 게임에서 직접 확인한 결과다.
// 두 루프 모두 항목이 실제로 존재하는지를 먼저 본다. `!a?.modes?.includes(...)` 만 쓰면
// id 가 사라졌을 때 undefined 라 그냥 통과해버려, 손으로 확인한 제외가 조용히 무효가 된다.
for (const id of ['upgrade-sundered-sky', 'upgrade-ravenous-hydra']) {
  const a = ko.find((x) => x.id === id);
  check(!!a && a.modes.includes('aram'), `${a?.name ?? id} 가 칼바람에 있음`);
}
// 풀 목록에는 있지만 실제 드래프트에 뜨지 않아 뺀 증강. 스크립트를 다시 돌려도 살아나면 안 된다.
for (const id of ['double-strike', 'support-main', 'sneakerhead',
                  'adamant', 'void-dash', 'snap-back', 'reload', 'vampirism', 'pursuit-of-power']) {
  const a = ko.find((x) => x.id === id);
  check(!!a && !a.modes.includes('aram'), `${a?.name ?? id} 가 칼바람에서 빠져 있음`);
}

// 6) 아이콘
for (const [locale, list] of LOCALES) {
  const noIcon = list.filter((a) => !a.iconPath);
  check(noIcon.length === 0, `[${locale}] iconPath 누락 없음${noIcon.length ? ` — ${noIcon.map((a) => a.name).join(', ')}` : ''}`);
}

// 7) 설명 — 카드에서 잘리지 않는 길이인지.
// 130자는 rarity-card-frame 의 numberOfLines={6} · fontSize 8 에서 실제로 들어가는 한계다.
// 넘으면 레이아웃이 깨지진 않지만 뒷부분이 말줄임으로 잘려 정보가 사라진다.
const LIMIT = 130;
for (const [locale, list] of LOCALES) {
  const tooLong = list.filter((a) => (a.description ?? '').length > LIMIT);
  check(
    tooLong.length === 0,
    `[${locale}] 설명 ${LIMIT}자 이하 (초과 ${tooLong.length}건${tooLong.length ? `: ${tooLong.slice(0, 5).map((a) => `${a.name} ${a.description.length}`).join(', ')}` : ''})`,
  );
  const empty = list.filter((a) => !(a.description ?? '').trim());
  check(empty.length === 0, `[${locale}] 빈 설명 없음${empty.length ? ` — ${empty.map((a) => a.name).join(', ')}` : ''}`);
}

// 8) 수치가 빠져 문장이 깨진 흔적
const broken = ko.filter(
  (a) => /[가-힣]\s(의|을|를)\s/.test(a.description) || /\s%/.test(a.description) || /[가-힣](가|이|을|를|의)%/.test(a.description),
);
check(broken.length === 0, `[ko] 수치 빈칸으로 깨진 설명 없음${broken.length ? ` — ${broken.map((a) => a.name).join(', ')}` : ''}`);
// en 은 조사가 없어 다른 흔적을 본다 — 정제가 수치를 지우고 남긴 빈 괄호·떠 있는 % ·
// 채우지 못한 @Var@ 플레이스홀더.
const brokenEn = en.filter(
  (a) => /\s%/.test(a.description) || /\(\s*\)/.test(a.description) || /@[^@]+@/.test(a.description),
);
check(brokenEn.length === 0, `[en] 수치 빈칸으로 깨진 설명 없음${brokenEn.length ? ` — ${brokenEn.map((a) => a.name).join(', ')}` : ''}`);

console.log('');
assert.ok(fails.length === 0, `${fails.length}건 실패:\n  - ${fails.join('\n  - ')}`);
console.log('✓ 증강 데이터 정상');
