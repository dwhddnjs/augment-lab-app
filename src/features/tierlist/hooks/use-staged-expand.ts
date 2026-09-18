import { useEffect, useState } from 'react';

/** 그룹마다 기본으로 보여주는 개수. 나머지는 펼쳐서 본다. */
export const PREVIEW_COUNT = 6;
/**
 * 펼칠 때 그룹마다 한 번에 더 붙이는 개수와 그 간격. 챔피언당 증강 74~157개를 한 프레임에
 * 마운트하면 끊겨 보여서, 그룹당 12개(희귀도 3그룹이면 최대 36카드)씩 나눠 붙인다.
 * 가장 큰 그룹이 61개라 5~6단계, 0.3초 안팎에 다 펼쳐진다.
 */
const EXPAND_STEP = 12;
const EXPAND_INTERVAL_MS = 50;

/**
 * 접힌 목록을 단계적으로 펼친다. `limit` 은 그룹마다 보여줄 개수 — 호출측이 `slice(0, limit)` 한다.
 *
 * @param largest 가장 큰 그룹의 크기. 펼침을 여기서 멈추고, PREVIEW_COUNT 이하면 펼칠 게 없다.
 */
export function useStagedExpand(largest: number) {
  const [limit, setLimit] = useState(PREVIEW_COUNT);
  const expanded = limit > PREVIEW_COUNT;

  // 펼치기 시작하면 가장 큰 그룹이 다 보일 때까지 EXPAND_STEP 씩 늘린다. 접으면 limit 이
  // PREVIEW_COUNT 로 돌아가 멈추고, 도중에 접어도 예약된 타이머는 cleanup 이 지운다.
  useEffect(() => {
    if (limit <= PREVIEW_COUNT || limit >= largest) return;
    const id = setTimeout(() => setLimit((n) => n + EXPAND_STEP), EXPAND_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [limit, largest]);

  return {
    limit,
    expanded,
    canExpand: largest > PREVIEW_COUNT,
    /** 펼칠 때는 첫 단계만 붙인다 — 나머지는 위 effect 가 나눠 붙인다. */
    toggle: () => setLimit(expanded ? PREVIEW_COUNT : PREVIEW_COUNT + EXPAND_STEP),
  };
}
