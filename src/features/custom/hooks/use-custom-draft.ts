/**
 * useCustomDraft — 커스텀 화면의 상태/로직.
 *
 * 뽑기가 없는 샌드박스라 라운드·리롤이 없다. 전체 풀을 필터·정렬해 좌측에 펼치고,
 * 사용자가 담은 것만 picked 에 쌓는다. drawer 설정(모드/퀵모드/개수제한/정렬)도
 * 여기 로컬 state — 이 화면 말고 읽는 곳이 없어 전역 스토어를 만들 이유가 없다.
 */
import { useState } from "react";

import { useAugmentPool } from "@/features/augments/hooks/use-augments";
import type { Augment, AugmentRarity } from "@/features/augments/types";
import { useLocale } from "@/hooks/use-locale";
import type { DraftMode } from "@/lib/build-storage";

/** 담을 수 있는 증강 수. null 은 무제한(기본값 — 커스텀의 취지가 자유도다). */
export type PickLimit = 4 | 5 | 6 | null;
export const PICK_LIMITS: PickLimit[] = [4, 5, 6, null];

export type SortKey = "default" | "name" | "rarity";
export const SORT_KEYS: SortKey[] = ["default", "name", "rarity"];

/** 티어순 정렬 기준 — 높은 등급이 위로. */
const RARITY_RANK: Record<AugmentRarity, number> = {
  prismatic: 0,
  gold: 1,
  silver: 2,
};

/** add 의 실패 사유. 화면이 이걸 보고 어떤 햅틱을 울릴지 고른다. */
export type AddResult = "added" | "duplicate" | "limit";

export function useCustomDraft(initialChampionId: string) {
  const { locale } = useLocale();

  // params 는 초기값으로만 쓴다 — drawer 의 "챔피언 변경"이 setState 한 번으로 끝나도록.
  const [championId, setChampionId] = useState(initialChampionId);
  const [mode, setMode] = useState<DraftMode>("aram");
  const [tier, setTier] = useState<AugmentRarity | null>(null);
  const [sort, setSort] = useState<SortKey>("default");
  const [limit, setLimit] = useState<PickLimit>(null);
  const [quickMode, setQuickMode] = useState(false);
  const [picked, setPicked] = useState<Augment[]>([]);

  // modes 태그가 없는 항목(미출시·제거)이 섞이지 않도록 반드시 useAugmentPool.
  const pool = useAugmentPool(mode);

  const filtered = tier ? pool.filter((a) => a.rarity === tier) : pool;
  const list =
    sort === "default"
      ? filtered
      : [...filtered].sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name, locale)
            : RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] ||
              a.name.localeCompare(b.name, locale),
        );

  const pickedIds = new Set(picked.map((a) => a.id));

  const add = (augment: Augment): AddResult => {
    if (pickedIds.has(augment.id)) return "duplicate";
    if (limit !== null && picked.length >= limit) return "limit";
    setPicked((prev) => [...prev, augment]);
    return "added";
  };

  const remove = (id: string) =>
    setPicked((prev) => prev.filter((a) => a.id !== id));

  const clear = () => setPicked([]);

  // ponytail: 모드를 바꿔도 담긴 증강을 거르지 않는다. 공유 증강은 한 레코드에
  // modes:["aram","classic"] 로 담겨 id 가 겹치지 않으므로 배열 자체는 항상 유효하다.
  // 다만 칼바람 전용 증강을 담고 클래식으로 바꾸면 실제로는 불가능한 조합이 남는다 —
  // 저장하지 않는 샌드박스라 감수한다. 다음 턴에 /aram-items 저장을 붙이면 여기에
  // 모드별 유효성 검사를 넣을 것.

  return {
    championId,
    setChampionId,
    mode,
    setMode,
    tier,
    setTier,
    sort,
    setSort,
    limit,
    setLimit,
    quickMode,
    setQuickMode,
    list,
    picked,
    pickedIds,
    add,
    remove,
    clear,
  };
}
