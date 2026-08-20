#!/usr/bin/env node
/**
 * 칼바람 증강 등급 확률 자체 검증.
 *
 *   node scripts/check-rarity-odds.mjs
 *
 * rollRarity()를 대량으로 굴려 실제 분포가 RARITY_ODDS와 일치하는지 본다.
 * 확률은 화면만 봐서는 틀린 걸 알 수 없어서(몇 판 굴려선 편차와 구분이 안 된다)
 * 이 스크립트가 유일한 검증 수단이다.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modUrl = pathToFileURL(
  path.resolve(__dirname, '../src/features/aram/rarity-odds.ts'),
);
// rarity-odds.ts 는 React 의존이 없어 Node 의 타입 스트립으로 그대로 실행된다.
const { RARITY_ODDS, rollRarity } = await import(modUrl.href);

const ROLLS = 200_000;
const TOLERANCE = 0.03; // ±3%p

const sum = RARITY_ODDS.reduce((acc, [, p]) => acc + p, 0);
assert.ok(
  Math.abs(sum - 1) < 1e-9,
  `RARITY_ODDS 합이 1이 아니다: ${sum}`,
);

const counts = new Map(RARITY_ODDS.map(([r]) => [r, 0]));
for (let i = 0; i < ROLLS; i++) {
  const r = rollRarity();
  assert.ok(counts.has(r), `알 수 없는 등급이 나왔다: ${r}`);
  counts.set(r, counts.get(r) + 1);
}

console.log(`${ROLLS.toLocaleString()}회 롤 결과 (허용 오차 ±${TOLERANCE * 100}%p)\n`);
let failed = false;
for (const [rarity, expected] of RARITY_ODDS) {
  const actual = counts.get(rarity) / ROLLS;
  const drift = Math.abs(actual - expected);
  const ok = drift <= TOLERANCE;
  if (!ok) failed = true;
  console.log(
    `  ${ok ? '✓' : '✗'} ${rarity.padEnd(10)} 기대 ${(expected * 100).toFixed(1)}%  실제 ${(actual * 100).toFixed(2)}%  (편차 ${(drift * 100).toFixed(2)}%p)`,
  );
}

assert.ok(!failed, '등급 분포가 허용 오차를 벗어났다');
console.log('\n✓ 등급 확률 정상');
