/**
 * useCustomDraft — 커스텀 화면의 상태/로직.
 *
 * 뽑기가 없는 샌드박스라 라운드·리롤이 없다. 전체 풀을 필터·정렬해 좌측에 펼치고,
 * 사용자가 담은 것만 picked(증강) / items(아이템) 에 쌓는다. 증강과 아이템은 헤더
 * 토글(target)로 갈아끼우며 검색어(query)를 공유한다. drawer 설정(모드/퀵모드/정렬)도
 * 여기 로컬 state — 이 화면 말고 읽는 곳이 없어 전역 스토어를 만들 이유가 없다.
 */
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useState } from "react";

import { useAugmentPool } from "@/features/augments/hooks/use-augments";
import type { Augment, AugmentRarity } from "@/features/augments/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useItemPool } from "@/features/items/hooks/use-items";
import { FILTERS, type FilterKey } from "@/features/items/item-filters";
import { MAX_ITEMS, type Item } from "@/features/items/types";
import { useAlive } from "@/hooks/use-alive";
import { useLocale } from "@/hooks/use-locale";
import { saveBuild, type DraftMode } from "@/lib/build-storage";
import { matchName } from "@/lib/hangul";
import { lockOrientation } from "@/lib/orientation";

export type SortKey = "default" | "name" | "rarity";

/** 좌측 리스트가 무엇을 펼치고 있는지 = 담기는 곳. 헤더 토글이 뒤집는다. */
export type PickTarget = "augment" | "item";

/** 티어순 정렬 기준 — 높은 등급이 위로. */
const RARITY_RANK: Record<AugmentRarity, number> = {
  prismatic: 0,
  gold: 1,
  silver: 2,
};

/** 한 빌드에 담을 수 있는 증강 수. 아이템의 MAX_ITEMS 와 같은 역할. */
export const MAX_AUGMENTS = 5;

/** add 의 실패 사유. 화면이 이걸 보고 어떤 햅틱을 울릴지 고른다. */
export type AddResult = "added" | "duplicate" | "full";

/**
 * save 가 실패한 이유. "invalid" 는 애초에 저장할 수 없는 상태(챔피언을 못 찾았거나
 * 담은 게 하나도 없다), "failed" 는 저장 자체가 터진 경우 — 문구가 달라야 한다.
 */
export type SaveError = "invalid" | "failed";

export function useCustomDraft(initialChampionId: string) {
  const { locale } = useLocale();
  const router = useRouter();
  const alive = useAlive();
  const champions = useChampions();

  // params 는 초기값으로만 쓴다 — 패널의 "챔피언 변경"이 setState 한 번으로 끝나도록.
  const [championId, setChampionId] = useState(initialChampionId);
  const [mode, setModeState] = useState<DraftMode>("aram");
  const [target, setTargetState] = useState<PickTarget>("augment");
  const [tier, setTier] = useState<AugmentRarity | null>(null);
  const [itemFilter, setItemFilter] = useState<FilterKey>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [quickMode, setQuickMode] = useState(false);
  const [picked, setPicked] = useState<Augment[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);

  // 데이터에 없는 id 로 진입할 수 있으므로(딥링크·복원) null 이 정상 상태다.
  // 저장 가능 여부를 여기서 판단하려면 훅이 챔피언을 알아야 한다.
  const champion = champions.find((c) => c.id === championId) ?? null;

  // modes 태그가 없는 항목(미출시·제거)이 섞이지 않도록 증강은 반드시 useAugmentPool,
  // 아이템은 useItemPool — 전체 목록에 필터를 걸면 다른 모드 것이 조용히 섞인다.
  const pool = useAugmentPool(mode);
  const itemPool = useItemPool(mode);

  const filtered = pool.filter(
    (a) => (!tier || a.rarity === tier) && matchName(a.name, query),
  );
  const list =
    sort === "default"
      ? filtered
      : [...filtered].sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name, locale)
            : RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] ||
              a.name.localeCompare(b.name, locale),
        );

  // 아이템은 진열 순서가 곧 상점 순서라 정렬(sort)을 태우지 않는다 — 그 설정은 증강용.
  const itemPredicate = FILTERS.find((f) => f.key === itemFilter)?.predicate;
  const itemList = itemPool.filter(
    (it) => (!itemPredicate || itemPredicate(it)) && matchName(it.name, query),
  );

  const pickedIds = new Set(picked.map((a) => a.id));
  const itemIds = new Set(items.map((it) => it.id));

  /**
   * 헤더 토글이 부르는 유일한 진입점. 다음 값을 밖에서 계산해 넘기면 리렌더 전에
   * 두 번 눌린 연타가 같은 방향으로 두 번 가므로, 뒤집기는 prev 로만 한다.
   * 검색어도 함께 비운다 — 증강 검색어가 아이템 목록을 비워 "결과 없음"이 된다.
   */
  const toggleTarget = () => {
    setTargetState((prev) => (prev === "augment" ? "item" : "augment"));
    setQuery("");
  };

  const add = (augment: Augment): AddResult => {
    if (pickedIds.has(augment.id)) return "duplicate";
    if (picked.length >= MAX_AUGMENTS) return "full";
    // pickedIds 는 렌더 스냅샷이라 연타로 두 번 들어오면 stale 하다.
    // 반환값(햅틱용)은 스냅샷으로 족하지만, 실제 중복/정원 방지는 prev 로 한다.
    setPicked((prev) =>
      prev.some((a) => a.id === augment.id) || prev.length >= MAX_AUGMENTS
        ? prev
        : [...prev, augment],
    );
    return "added";
  };

  const addItem = (item: Item): AddResult => {
    if (itemIds.has(item.id)) return "duplicate";
    if (items.length >= MAX_ITEMS) return "full";
    setItems((prev) =>
      prev.some((it) => it.id === item.id) || prev.length >= MAX_ITEMS
        ? prev
        : [...prev, item],
    );
    return "added";
  };

  const remove = (id: string) =>
    setPicked((prev) => prev.filter((a) => a.id !== id));

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  /** 휴지통은 "선택 초기화" — 증강·아이템을 함께 비운다. */
  const clear = () => {
    setPicked([]);
    setItems([]);
  };

  /**
   * 모드를 바꾸면 담아 둔 증강·아이템을 전부 비운다. 같은 모드를 다시 고르면 아무 일도
   * 없다. 두 모드에 다 실리는 공유 증강도 남기지 않는다 — 모드 전환은 "이 모드 빌드를
   * 새로 짠다"는 조작이라, 앞 모드에서 고른 조합이 일부만 남아 있으면 무엇이 사라지고
   * 무엇이 남았는지 화면만 보고는 알 수 없다.
   */
  const setMode = (next: DraftMode) => {
    if (next === mode) return;
    setModeState(next);
    clear();
  };

  /**
   * 담은 것을 빌드로 저장하고 상세로 보낸다. mode 가 그대로 저장 모드라
   * 칼바람 빌드는 칼바람 목록에, 클래식은 클래식 목록에 쌓인다.
   */
  const save = async (onError: (reason: SaveError) => void) => {
    if (saving) return;
    // 챔피언을 못 찾았거나 아무것도 담지 않았다 — 저장하면 되살릴 수 없는 빈 레코드가
    // 빌드 목록 최상단에 쌓인다. 저장 버튼에 비활성 상태가 없으므로 여기서 막는다.
    if (!champion || (picked.length === 0 && items.length === 0)) {
      onError("invalid");
      return;
    }
    setSaving(true);
    let build;
    try {
      build = await saveBuild({
        mode,
        championId,
        augmentIds: picked.map((a) => a.id),
        itemIds: items.map((it) => it.id),
      });
    } catch {
      onError("failed");
      setSaving(false);
      return;
    }
    // 저장을 기다리는 동안 헤더의 나가기가 계속 살아 있다. 이미 나갔으면 회전도
    // navigation 도 하지 않는다 — 방향은 나가기 경로가 되돌려 놨다.
    if (!alive.current) return;
    // 회전이 끝난 뒤 navigation 을 시작한다. 바로 이동하면 landscape 상태로
    // 빌드 상세가 mount 돼 회전 잔상이 보인다(아이템 선택 화면과 같은 이유).
    await lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    if (!alive.current) return;
    // dismissTo + push 를 잇달아 부르지 말 것. expo-router 는 라우팅 액션을 큐에 모아
    // 한 배치에서 dispatch 하고, 두 번째 액션은 첫 번째가 반영되기 전의 state 를 읽는다.
    // 릴리즈 빌드에서는 둘이 확실히 같은 배치에 들어가 화면 제거와 추가가 한 프레임에
    // 겹치고, 세로 복귀 회전까지 동시에 일어나 빌드 상세가 죽은 프레임으로 떴다
    // (뒤로가기를 눌러야 되살아났다). 진입이 replace 체인이라 스택은
    // [(tabs), 드래프트화면] — replace 한 번이면 결과가 같고 전환도 1회다.
    router.replace({ pathname: "/build/[id]", params: { id: build.id } });
  };

  return {
    championId,
    setChampionId,
    champion,
    mode,
    setMode,
    target,
    toggleTarget,
    tier,
    setTier,
    itemFilter,
    setItemFilter,
    query,
    setQuery,
    sort,
    setSort,
    quickMode,
    setQuickMode,
    list,
    itemList,
    picked,
    pickedIds,
    items,
    itemIds,
    add,
    addItem,
    remove,
    removeItem,
    clear,
    save,
  };
}
