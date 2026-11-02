/**
 * 헤드라이너 규칙 점검 — `npx tsx scripts/check-headliners.ts`.
 *
 * 테스트 러너가 없으므로 assert만 쓴다(check-backup.ts 와 같은 방식). 등장 분포와 스티커 확률은
 * 화면에서 몇 판 굴려서는 편차와 구분이 안 되므로 여기서 대량으로 돌린다.
 */
import assert from 'node:assert/strict';

import ko from '../src/features/headliners/data/headliners.ko.json';
import en from '../src/features/headliners/data/headliners.en.json';
import { parseMarked } from '../src/features/headliners/marked';
import {
  ARAM_ROUNDS,
  HEADLINER_IDS,
  STICKER_IDS,
  anvilCount,
  nextRarity,
  rollHeadliner,
  rollRoundStickers,
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
  // 색 표기([as]…[/as])는 짝이 맞고 중첩이 없어야 하며, 키가 색 맵에 있어야 한다.
  // 어긋나면 화면에 대괄호가 글자로 나오거나 색이 조용히 빠진다.
  // ponytail: 키 목록은 StatTextColors(theme.ts)·skill-card 의 MARK_COLORS 를 옮겨 적었다. theme.ts 가 CSS 를 import 해서 여기서 못 읽는다.
  const marked: [string, string[]][] = [
    ...Object.values(texts.stickers).map(({ full }): [string, string[]] => [full, ['k', 'ad', 'ap', 'as', 'hp', 'sv']]),
    [texts.skillTitle, ['e', 's', 'h', 'b']],
    [texts.skillBonus, ['e', 's', 'h', 'b']],
  ];
  for (const [text, keys] of marked) {
    for (const part of parseMarked(text)) {
      assert.ok(!/[[\]]/.test(part.text), `색 표기 짝이 안 맞거나 중첩됐다: ${text}`);
      assert.ok(part.mark === undefined || keys.includes(part.mark), `색 맵에 없는 키 [${part.mark}]: ${text}`);
    }
  }
}

// 파서: 같은 키로만 닫히고, 중첩·짝 오류는 대괄호가 든 평문으로 남는다.
assert.deepEqual(parseMarked('a [x]b[/x] c'), [{ text: 'a ' }, { text: 'b', mark: 'x' }, { text: ' c' }]);
assert.ok(parseMarked('[k]a [hp]b[/hp] c[/k]').some((p) => /[[\]]/.test(p.text)));
assert.ok(parseMarked('[a]b[/c]').some((p) => /[[\]]/.test(p.text)));

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

// 스티커: 매 라운드 정확히 두 칸, 서로 다른 멤버. 빈 칸 위치와 멤버는 고르게 나온다.
const emptySlots = [0, 0, 0];
const seen = new Set<string>();
for (let i = 0; i < ROLLS; i++) {
  const slots = rollRoundStickers();
  const members = slots.filter((s) => s !== null);
  assert.equal(slots.length, 3);
  assert.equal(members.length, 2);
  assert.equal(new Set(members).size, members.length, '한 라운드에 같은 멤버가 두 번 붙었다');
  emptySlots[slots.indexOf(null)] += 1;
  members.forEach((m) => seen.add(m));
}
for (const n of emptySlots) assert.ok(Math.abs(n / ROLLS - 1 / 3) <= TOLERANCE, '빈 칸 위치가 치우친다');
assert.equal(seen.size, STICKER_IDS.length);

console.log('✓ 헤드라이너 규칙 정상');
