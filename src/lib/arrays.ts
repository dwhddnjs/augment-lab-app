/**
 * 배열 순수 유틸 — 뽑기(랜덤)와 id 해석. React 훅 아님.
 * 드래프트 엔진(칼바람·아레나)과 빌드 표시가 함께 쓴다.
 */

/**
 * pool 에서 서로 다른 count 개를 뽑는다. `used` 에 담긴 id 는 건너뛰고,
 * 뽑은 id 는 `used` 에 채워 넣어(호출부가 이어서 뽑을 수 있게) 중복을 막는다.
 * 풀이 부족하면 뽑히는 만큼만 돌려준다.
 */
export function sampleDistinct<T extends { id: string }>(
  pool: T[],
  count: number,
  used: Set<string>,
): T[] {
  const available = pool.filter((a) => !used.has(a.id));
  const result: T[] = [];
  while (result.length < count && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    const [chosen] = available.splice(idx, 1);
    result.push(chosen);
    used.add(chosen.id);
  }
  return result;
}

/** 원본을 건드리지 않고 섞는다. 카드 진열 순서용이라 완전 균등일 필요는 없다. */
export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** 균등 랜덤 1개. 빈 배열이면 undefined. */
export function pickRandom<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * id 목록을 풀에서 실제 객체로 해석한다.
 * 데이터 갱신으로 사라진 id 는 조용히 버린다 — 저장된 빌드가 crash 나면 안 된다.
 */
export function resolveIds<T extends { id: string }>(
  ids: string[] | undefined,
  pool: T[],
): T[] {
  return (ids ?? [])
    .map((id) => pool.find((x) => x.id === id))
    .filter((x): x is T => x != null);
}
