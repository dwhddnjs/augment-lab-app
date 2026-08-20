#!/usr/bin/env node
/**
 * 증강 데이터 정합성 자체 검증.
 *
 *   node scripts/check-augment-data.mjs
 *
 * 모드 분리가 깨지면 화면만 봐서는 알 수 없다 — 다른 모드 증강이 칼바람 풀에 섞여도
 * 카드는 멀쩡히 렌더되기 때문이다. 실제로 그렇게 클래식 전용 증강 55개가 칼바람에
 * 들어갔던 적이 있어서, 그 사고를 잡아내는 게 이 스크립트의 존재 이유다.
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
const badMode = ko.filter((a) => !Array.isArray(a.modes) || a.modes.some((m) => !VALID.has(m)));
check(badMode.length === 0, `modes 값이 모두 유효${badMode.length ? ` — ${badMode.map((a) => a.name).join(', ')}` : ''}`);

const aram = ko.filter((a) => a.modes?.includes('aram'));
const classic = ko.filter((a) => a.modes?.includes('classic'));
const unreleased = ko.filter((a) => !a.modes?.length);
console.log(`\n  칼바람 ${aram.length} · 클래식 ${classic.length} · 미출시 ${unreleased.length} (전체 ${ko.length})`);
check(
  aram.length + unreleased.length + classic.filter((a) => !a.modes.includes('aram')).length === ko.length,
  '모드 분류에 빠진 항목 없음',
);

// 4) 칼바람 풀에 다른 모드 전용이 섞이지 않았는지 — 이게 이 스크립트의 핵심
const strays = aram.filter((a) => !a.modes.includes('aram'));
check(strays.length === 0, '칼바람 풀에 aram 태그 없는 항목 없음');
const classicOnlyInAram = ko.filter((a) => a.modes?.includes('classic') && !a.modes.includes('aram') && a.modes.includes('aram'));
check(classicOnlyInAram.length === 0, '클래식 전용이 칼바람에 섞이지 않음');

// 5) 칼바람에 반드시 있어야 하는 것 / 절대 없어야 하는 것 — 게임에서 직접 확인한 결과다.
for (const id of ['upgrade-sundered-sky', 'upgrade-ravenous-hydra']) {
  const a = ko.find((x) => x.id === id);
  check(!!a?.modes?.includes('aram'), `${a?.name ?? id} 가 칼바람에 있음`);
}
// 풀 목록에는 있지만 실제 드래프트에 뜨지 않아 뺀 증강. 스크립트를 다시 돌려도 살아나면 안 된다.
for (const id of ['double-strike', 'support-main', 'sneakerhead',
                  'adamant', 'void-dash', 'snap-back', 'reload', 'vampirism', 'pursuit-of-power']) {
  const a = ko.find((x) => x.id === id);
  check(!a?.modes?.includes('aram'), `${a?.name ?? id} 가 칼바람에서 빠져 있음`);
}

// 6) 아이콘
const noIcon = ko.filter((a) => !a.iconPath);
check(noIcon.length === 0, `iconPath 누락 없음${noIcon.length ? ` — ${noIcon.map((a) => a.name).join(', ')}` : ''}`);

// 7) 설명 — 카드에서 잘리지 않는 길이인지
const LIMIT = 130;
const tooLong = ko.filter((a) => a.description.length > LIMIT);
check(
  tooLong.length === 0,
  `설명 ${LIMIT}자 이하 (초과 ${tooLong.length}건${tooLong.length ? `: ${tooLong.slice(0, 5).map((a) => `${a.name} ${a.description.length}`).join(', ')}` : ''})`,
);
const empty = ko.filter((a) => !a.description.trim() || !en.find((e) => e.id === a.id)?.description.trim());
check(empty.length === 0, `빈 설명 없음${empty.length ? ` — ${empty.map((a) => a.name).join(', ')}` : ''}`);

// 8) 수치가 빠져 문장이 깨진 흔적
const broken = ko.filter(
  (a) => /[가-힣]\s(의|을|를)\s/.test(a.description) || /\s%/.test(a.description) || /[가-힣](가|이|을|를|의)%/.test(a.description),
);
check(broken.length === 0, `수치 빈칸으로 깨진 설명 없음${broken.length ? ` — ${broken.map((a) => a.name).join(', ')}` : ''}`);

console.log('');
assert.ok(fails.length === 0, `${fails.length}건 실패:\n  - ${fails.join('\n  - ')}`);
console.log('✓ 증강 데이터 정상');
