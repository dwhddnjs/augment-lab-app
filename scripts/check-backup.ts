/**
 * .alab 백업 포맷 자체 점검 — `npx tsx scripts/check-backup.ts`.
 * 테스트 러너가 없으므로 assert만 쓴다. backup-format은 IO가 없어 node에서 그대로 돈다.
 */
import assert from 'node:assert/strict';

import {
  buildFileName,
  countBuilds,
  parseBackup,
  serializeBackup,
} from '../src/lib/backup-format';

const builds = JSON.stringify([
  { id: 'a', mode: 'aram', championId: 'Ahri', augmentIds: [], itemIds: [], createdAt: '2026-08-20T00:00:00.000Z' },
  { id: 'b', mode: 'arena', championId: 'Jinx', augmentIds: [], itemIds: [], createdAt: '2026-08-19T00:00:00.000Z' },
]);
const exportedAt = '2026-08-20T09:30:00.000Z';

// 1. 라운드트립 — 저장한 문자열이 그대로 돌아온다.
const text = serializeBackup(
  { 'builds:v1': builds, 'theme:v1': 'dark', 'locale:v1': 'ko' },
  exportedAt
);
const parsed = parseBackup(text);
assert.equal(parsed.data['builds:v1'], builds);
assert.equal(parsed.data['theme:v1'], 'dark');
assert.equal(parsed.data['locale:v1'], 'ko');
assert.equal(parsed.exportedAt, exportedAt);
assert.equal(countBuilds(parsed), 2);

// 2. 파일명은 로컬 날짜를 쓴다 — UTC로 자르면 KST 새벽에 하루 전 날짜가 된다.
assert.equal(buildFileName(new Date(2026, 7, 20, 4, 57)), 'augment-lab-2026-08-20.alab');
assert.equal(buildFileName(new Date('2026-08-19T19:57:00.000Z')).length, 'augment-lab-2026-08-20.alab'.length);

// 3. 일부 키만 있어도 통과하고, 없는 키는 undefined로 남는다(복원 시 삭제 대상).
const partial = parseBackup(serializeBackup({ 'locale:v1': 'en' }, exportedAt));
assert.equal(partial.data['locale:v1'], 'en');
assert.equal(partial.data['builds:v1'], undefined);
assert.equal(countBuilds(partial), 0);

// 4. 화이트리스트 밖 키는 조용히 버린다(미래 버전 파일 대비).
const extra = parseBackup(
  JSON.stringify({
    app: 'augment-lab',
    version: 1,
    exportedAt,
    data: { 'locale:v1': 'ko', 'session:v9': 'secret-token' },
  })
);
assert.deepEqual(Object.keys(extra.data), ['locale:v1']);

// 5. 거부 케이스 — 전부 throw여야 한다(저장소를 건드리기 전에 막힌다).
const rejected: [string, string][] = [
  ['깨진 JSON', '{ not json'],
  ['객체 아님', '[1,2,3]'],
  ['다른 앱', JSON.stringify({ app: 'other', version: 1, data: {} })],
  ['미지원 버전', JSON.stringify({ app: 'augment-lab', version: 2, data: {} })],
  ['data 없음', JSON.stringify({ app: 'augment-lab', version: 1 })],
  [
    'builds 손상',
    JSON.stringify({ app: 'augment-lab', version: 1, data: { 'builds:v1': '{oops' } }),
  ],
  [
    'builds가 배열 아님',
    JSON.stringify({ app: 'augment-lab', version: 1, data: { 'builds:v1': '{"a":1}' } }),
  ],
];
for (const [label, bad] of rejected) {
  assert.throws(() => parseBackup(bad), `거부해야 함: ${label}`);
}

console.log('✓ backup-format 체크 통과');
