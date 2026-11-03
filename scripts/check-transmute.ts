/**
 * 칼바람 전환·판도라 규칙 점검 — `npx tsx scripts/check-transmute.ts`.
 *
 * 테스트 러너가 없으므로 assert만 쓴다(check-headliners.ts 와 같은 방식). 뽑기가 무작위라
 * 화면에서 몇 판 굴려서는 1라운드 판도라 같은 경우를 놓친다. 실제 칼바람 풀로 여러 번 돌린다.
 */
import assert from 'node:assert/strict';

import ko from '../src/features/augments/data/augments.ko.json';
import type { Augment } from '../src/features/augments/types';
import { PANDORA_ID, applyPick, cardPool } from '../src/features/aram/transmute';

const all = (ko as Augment[]).filter((a) => a.modes?.includes('aram'));
const byId = (id: string) => {
  const a = all.find((x) => x.id === id);
  assert.ok(a, `칼바람 풀에 ${id} 가 없다`);
  return a;
};
const TRANSMUTES = ['transmute-gold', 'transmute-prismatic', 'transmute-chaos', PANDORA_ID];
const normal = all.filter((a) => !TRANSMUTES.includes(a.id));

// 판도라는 바꿀 증강이 없으면(1라운드) 카드로 나오지 않는다.
assert.ok(!cardPool(all, [], []).some((a) => a.id === PANDORA_ID), '1라운드에 판도라가 뜬다');
assert.ok(cardPool(all, [], [normal[0]]).some((a) => a.id === PANDORA_ID), '2라운드부터는 판도라가 뜬다');
assert.ok(!cardPool(all, [normal[0].id], [normal[0]]).some((a) => a.id === normal[0].id), 'exclude 가 빠지지 않는다');

// 일반 증강은 그대로 들어가고 새로 얻는 건 없다.
{
  const r = applyPick(normal[1], [normal[0]], all, new Set([normal[0].id, normal[1].id]));
  assert.deepEqual(r.picked.map((a) => a.id), [normal[0].id, normal[1].id]);
  assert.equal(r.granted.length, 0);
}

for (let i = 0; i < 2_000; i++) {
  const had = [normal[i % normal.length], normal[(i + 7) % normal.length], normal[(i + 13) % normal.length]];
  const exclude = new Set(had.map((a) => a.id));

  for (const [id, count, rarity] of [
    ['transmute-gold', 1, 'gold'],
    ['transmute-prismatic', 1, 'prismatic'],
    ['transmute-chaos', 2, undefined],
  ] as const) {
    const r = applyPick(byId(id), had, all, new Set([...exclude, id]));
    assert.equal(r.picked.length, had.length + count, `${id} 개수`);
    assert.deepEqual(r.picked.slice(0, had.length), had, `${id} 가 기존 증강을 건드렸다`);
    for (const g of r.granted) {
      assert.ok(!exclude.has(g.id), `${id} 가 이미 얻은 증강을 다시 줬다`);
      assert.ok(!TRANSMUTES.includes(g.id), `${id} 가 전환 증강을 줬다(연쇄)`);
      if (rarity) assert.equal(g.rarity, rarity, `${id} 등급`);
    }
    assert.equal(new Set(r.granted.map((a) => a.id)).size, count, `${id} 가 같은 증강을 두 번 줬다`);
    assert.ok(r.picked.slice(had.length).every((a) => a.transmuted), `${id} 로 얻은 증강에 transmuted 가 없다`);
    assert.ok(had.every((a) => !('transmuted' in a)), '원본 증강 객체가 바뀌었다');
  }

  // 판도라: 지금까지 얻은 만큼 프리즘으로 모두 바꾼다.
  for (const n of [1, 3]) {
    const r = applyPick(byId(PANDORA_ID), had.slice(0, n), all, new Set([...exclude, PANDORA_ID]));
    assert.equal(r.picked.length, n, `판도라 ${n}개 → 개수`);
    assert.ok(r.picked.every((a) => a.rarity === 'prismatic' && a.transmuted), '판도라 결과는 전환된 프리즘이다');
    assert.ok(r.picked.every((a) => !exclude.has(a.id)), '판도라가 이미 얻은 증강을 다시 줬다');
    assert.equal(new Set(r.picked.map((a) => a.id)).size, n, '판도라가 같은 증강을 두 번 줬다');
  }
}

console.log('✓ 전환 증강 규칙 정상');
