/**
 * 빌드 저장소의 **쓰기 실패 롤백**과 **제거된 모드 필터** 점검 — `npx tsx scripts/check-build-storage.ts`.
 *
 * 테스트 러너가 없으므로 assert만 쓴다(check-backup.ts 와 같은 방식).
 *
 * build-storage 는 화면이 즉시 갱신되도록 캐시를 먼저 바꾸고 나중에 디스크에 쓴다.
 * 그 쓰기가 실패했을 때 캐시를 되돌리지 않으면, 목록에는 있는데 앱을 껐다 켜면
 * 사라지는(또는 지웠는데 되살아나는) 빌드가 생긴다. 시뮬레이터에서는 저장 실패를
 * 만들 수 없으므로 여기서 확인한다.
 *
 * AsyncStorage 는 node 에서 web 구현으로 떨어져 window.localStorage 를 쓴다.
 * 그래서 window 를 세워 주기만 하면 실제 build-storage 를 그대로 돌릴 수 있고,
 * 그 localStorage 의 setItem 만 던지게 해서 디스크 실패를 흉내 낸다.
 */
import assert from 'node:assert/strict';

const disk = new Map<string, string>();
let failWrite = false;

(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (k: string) => disk.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (failWrite) throw new Error('quota exceeded');
      disk.set(k, v);
    },
    removeItem: (k: string) => {
      disk.delete(k);
    },
    clear: () => disk.clear(),
    key: (i: number) => [...disk.keys()][i] ?? null,
    get length() {
      return disk.size;
    },
  },
};

const KEY = 'builds:v1';
const onDisk = (): unknown[] => JSON.parse(disk.get(KEY) ?? '[]');

async function main() {
  const { saveBuild, removeBuild, getBuildsSnapshot, reloadBuilds, parseBuilds } = await import(
    '../src/lib/build-storage'
  );

  const draft = {
    mode: 'aram' as const,
    championId: 'Garen',
    augmentIds: ['a1'],
    itemIds: ['i1'],
  };

  // 1. 정상 저장 — 캐시와 디스크가 같이 1개.
  const first = await saveBuild(draft);
  assert.equal(getBuildsSnapshot()?.length, 1, '저장 후 캐시 1개');
  assert.equal(onDisk().length, 1, '저장 후 디스크 1개');

  // 2. 쓰기가 실패하는 저장 — 예외가 호출부까지 오고, 캐시는 되돌아온다.
  failWrite = true;
  await assert.rejects(() => saveBuild(draft), '쓰기 실패는 호출부로 전파된다');
  assert.equal(
    getBuildsSnapshot()?.length,
    1,
    '실패한 저장은 캐시에 남지 않는다(유령 빌드 없음)',
  );
  assert.equal(onDisk().length, 1, '디스크도 그대로');
  failWrite = false;

  // 3. 쓰기가 실패하는 삭제 — 화면에서만 사라지지 않는다.
  failWrite = true;
  await assert.rejects(() => removeBuild(first.id), '삭제 실패도 전파된다');
  assert.equal(
    getBuildsSnapshot()?.length,
    1,
    '실패한 삭제는 캐시에서 지워지지 않는다(되살아나는 빌드 없음)',
  );
  assert.equal(onDisk().length, 1, '실패한 삭제 뒤에도 디스크에 그대로 남는다');
  failWrite = false;

  // 4. 정상 삭제 — 캐시와 디스크가 같이 빈다.
  await removeBuild(first.id);
  assert.equal(getBuildsSnapshot()?.length, 0, '삭제 후 캐시 0개');
  assert.equal(onDisk().length, 0, '삭제 후 디스크 0개');

  // 5. 제거된 아레나 모드의 빌드(기존 로컬 데이터·옛 백업 복원)는 로드 시 걸러진다.
  disk.set(
    KEY,
    JSON.stringify([
      { ...draft, id: 'old-arena', mode: 'arena', createdAt: '2026-08-01T00:00:00.000Z' },
      { ...draft, id: 'keep', createdAt: '2026-08-02T00:00:00.000Z' },
    ]),
  );
  await reloadBuilds();
  assert.deepEqual(
    getBuildsSnapshot()?.map((b) => b.id),
    ['keep'],
    '아레나 빌드는 목록에 오지 않는다',
  );

  // 6. 깨진 항목 하나가 전체를 날리지 않는다 — 전체를 버리면 다음 저장이 나머지를 덮어쓴다.
  disk.set(
    KEY,
    JSON.stringify([
      null,
      { ...draft, id: 'no-date' },
      { ...draft, id: 'future', mode: 'swarm', createdAt: '2026-08-03T00:00:00.000Z' },
      { ...draft, id: 'legacy', mode: undefined, createdAt: '2026-08-04T00:00:00.000Z' },
      { ...draft, id: 'keep', createdAt: '2026-08-02T00:00:00.000Z' },
    ]),
  );
  await reloadBuilds();
  assert.deepEqual(
    getBuildsSnapshot()?.map((b) => [b.id, b.mode]),
    [
      ['legacy', 'aram'],
      ['keep', 'aram'],
    ],
    '깨진 항목·모르는 모드만 빠지고, mode 없는 옛 빌드는 칼바람으로 남는다',
  );
  await saveBuild(draft);
  assert.equal(onDisk().length, 3, '다음 저장이 살아남은 빌드를 지우지 않는다');

  // 7. 복원 확인 다이얼로그 개수 — 화면에 실제로 보일 개수와 같아야 한다.
  const oldBackup = JSON.stringify([
    { ...draft, id: 'old-arena', mode: 'arena', createdAt: '2026-08-01T00:00:00.000Z' },
    { ...draft, id: 'keep', createdAt: '2026-08-02T00:00:00.000Z' },
  ]);
  assert.equal(parseBuilds(oldBackup).length, 1, '옛 백업의 아레나 빌드는 개수에서 빠진다');
  assert.equal(parseBuilds(undefined).length, 0, '빌드 키 없는 백업은 0개');
  assert.equal(parseBuilds('{oops').length, 0, '깨진 JSON은 0개');

  console.log('✓ build-storage 쓰기 실패 롤백 · 제거된 모드·깨진 항목 필터 통과');
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e);
  process.exit(1);
});
