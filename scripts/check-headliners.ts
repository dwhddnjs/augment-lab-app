/**
 * 헤드라이너 규칙 점검 — `npx tsx scripts/check-headliners.ts`.
 *
 * 테스트 러너가 없으므로 assert만 쓴다(check-backup.ts 와 같은 방식). 등장 분포와 스티커 확률은
 * 화면에서 몇 판 굴려서는 편차와 구분이 안 되므로 여기서 대량으로 돌린다.
 */
import assert from 'node:assert/strict';

import ko from '../src/features/headliners/data/headliners.ko.json';
import en from '../src/features/headliners/data/headliners.en.json';
import {
  ARAM_ROUNDS,
  HEADLINER_IDS,
  STICKER_CHANCE,
  STICKER_IDS,
  anvilCount,
  nextRarity,
  rollHeadliner,
  rollSticker,
  roundsFor,
  skillChoices,
} from '../src/features/headliners/rules';

// 펜타킬: 처음엔 기본기 3개, 그다음엔 고른 것을 빼고 궁극기를 더한다.
assert.deepEqual(skillChoices([]), ['q', 'w', 'e']);
assert.deepEqual(skillChoices(['q']), ['w', 'e', 'r']);
assert.deepEqual(skillChoices(['w']), ['q', 'e', 'r']);
assert.deepEqual(skillChoices(['e']), ['q', 'w', 'r']);

// 커맨드 라인: 프리즘은 위가 없다.
assert.equal(nextRarity('silver'), 'gold');
assert.equal(nextRarity('gold'), 'prismatic');
assert.equal(nextRarity('prismatic'), null);

// K/DA 만 한 번 더 고른다.
assert.equal(roundsFor('kda'), ARAM_ROUNDS + 1);
for (const id of HEADLINER_IDS.filter((h) => h !== 'kda')) assert.equal(roundsFor(id), ARAM_ROUNDS);

// 아펠리오스 스티커 하나당 모루 2개, 나머지 멤버와 모르는 id 는 0.
assert.equal(anvilCount([]), 0);
assert.equal(anvilCount(['yone', 'sett']), 0);
assert.equal(anvilCount(['aphelios']), 2);
assert.equal(anvilCount(['aphelios', 'yone', 'aphelios', 'unknown']), 4);

// 두 언어 모두 모든 id 의 문구가 있다.
for (const texts of [ko, en]) {
  assert.deepEqual(Object.keys(texts.headliners).sort(), [...HEADLINER_IDS].sort());
  assert.deepEqual(Object.keys(texts.stickers).sort(), [...STICKER_IDS].sort());
  assert.deepEqual(Object.keys(texts.skills).sort(), ['e', 'q', 'r', 'w']);
  assert.ok(texts.skillTitle.includes('{spell}'));
  assert.ok(texts.anvils.includes('{n}'));
}

const ROLLS = 200_000;
const TOLERANCE = 0.01;

const headliners = new Map<string, number>();
for (let i = 0; i < ROLLS; i++) {
  const id = rollHeadliner();
  headliners.set(id, (headliners.get(id) ?? 0) + 1);
}
assert.equal(headliners.size, HEADLINER_IDS.length);
for (const [id, n] of headliners) {
  const drift = Math.abs(n / ROLLS - 1 / HEADLINER_IDS.length);
  assert.ok(drift <= TOLERANCE, `${id} 등장 확률 편차 ${drift}`);
}

let stickers = 0;
const seen = new Set<string>();
for (let i = 0; i < ROLLS; i++) {
  const id = rollSticker();
  if (id) {
    stickers += 1;
    seen.add(id);
  }
}
assert.ok(Math.abs(stickers / ROLLS - STICKER_CHANCE) <= TOLERANCE, '스티커 확률이 어긋난다');
assert.equal(seen.size, STICKER_IDS.length);

console.log('✓ 헤드라이너 규칙 정상');
