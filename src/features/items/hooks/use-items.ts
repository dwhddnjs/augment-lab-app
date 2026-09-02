import { useMemo } from 'react';

import type { Item } from '@/features/items/types';
import type { Locale } from '@/hooks/use-locale';
import type { DraftMode } from '@/lib/build-storage';
import { useLocalizedData } from '@/lib/i18n';

// 협곡(칼바람·아레나)과 클래식은 완전히 다른 아이템 세트다. 클래식은 시즌 초기
// 레트로 아이템(77xxxx)을 쓰고 협곡 아이템은 하나도 등장하지 않는다. id 가 겹치지
// 않으므로 조회용 목록은 한 벌로 이어 붙여 둔다.
const data: Record<Locale, Item[]> = {
  ko: [
    ...require('@/features/items/data/items.ko.json'),
    ...require('@/features/items/data/classic-items.ko.json'),
  ],
  en: [
    ...require('@/features/items/data/items.en.json'),
    ...require('@/features/items/data/classic-items.en.json'),
  ],
};

// 모드별 진열 목록(완성 아이템). 칼바람 111 / 클래식 81.
const POOL_IDS: Record<DraftMode, Set<string>> = {
  aram: new Set(require('@/features/items/data/aram-item-ids.json')),
  classic: new Set(require('@/features/items/data/classic-item-ids.json')),
};

/**
 * 전체 아이템 목록. 저장된 빌드의 itemId 를 이름·아이콘으로 되돌릴 때처럼 **조회**에 쓴다.
 * 모드가 섞여 있으므로 여기서 고를 수 있는 아이템을 고르면 안 된다.
 */
export function useItems(): Item[] {
  return useLocalizedData(data);
}

/**
 * 해당 모드에서 실제로 고를 수 있는 아이템만. 상점·그리드는 반드시 이걸 쓴다.
 * 전체 목록에 태그(신발 등)로만 필터를 걸면 다른 모드 아이템이 조용히 섞인다 —
 * 레트로 신발 8종이 아레나 상점에 새던 게 그 경우다.
 */
export function useItemPool(mode: DraftMode): Item[] {
  const all = useItems();
  return useMemo(() => all.filter((it) => POOL_IDS[mode].has(it.id)), [all, mode]);
}
