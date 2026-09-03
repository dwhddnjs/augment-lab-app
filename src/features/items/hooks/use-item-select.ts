/**
 * useItemSelect — 아이템 선택 화면의 상태/로직 (칼바람·클래식 공용).
 *
 * 화면(item-select-screen.tsx)은 레이아웃만 그리고, 필터·선택·그리드 계산·저장은
 * 여기에 모은다. 챔피언 선택(use-champion-select)과 같은 분리 방식이다.
 */
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useMemo, useState } from "react";
import { Alert, type LayoutChangeEvent } from "react-native";

import type { Augment } from "@/features/augments/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useAlive } from "@/hooks/use-alive";
import { resolveIds } from "@/lib/arrays";
import { saveBuild, type DraftMode } from "@/lib/build-storage";
import { itemImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { lockOrientation, lockPortraitAfterExit } from "@/lib/orientation";
import { CELL_GAP } from "../components/item-grid";
import type { SlotItem } from "../components/item-slot-grid";
import { FILTERS, type FilterKey } from "../item-filters";
import { useItemPool } from "./use-items";
import { MAX_ITEMS, type Item } from "../types";

const NUM_COLS = 8;

const t = {
  ko: {
    title: "아이템 선택",
    stats: "스탯",
    augments: "증강",
    saveError: "빌드 저장에 실패했어요",
    exitConfirm: "저장하지 않고 나갈까요?",
    exitOk: "나가기",
    exitCancel: "계속",
  },
  en: {
    title: "Item Select",
    stats: "Stats",
    augments: "Augments",
    saveError: "Failed to save the build",
    exitConfirm: "Leave without saving?",
    exitOk: "Leave",
    exitCancel: "Continue",
  },
};

export function useItemSelect({
  championId,
  mode,
  pickedAugments,
}: {
  championId: string;
  mode: DraftMode;
  pickedAugments: Augment[];
}) {
  const translate = useTranslation(t);
  const router = useRouter();
  const alive = useAlive();
  const modeItems = useItemPool(mode);
  const champions = useChampions();
  const champion = useMemo(
    () => champions.find((c) => c.id === championId) ?? null,
    [champions, championId],
  );

  const [activeFilter, setActiveFilter] = useState<FilterKey>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // 그리드 영역 실측 너비 → NUM_COLS 정확히 채우도록 셀 크기 계산
  const [gridWidth, setGridWidth] = useState(0);
  // 증강 카드 그리드(우측) 실측 너비 → 카드 크기 산출(패널 내부에서 사용)
  const [augmentGridWidth, setAugmentGridWidth] = useState(0);

  // 진입 시 이 모드의 아이템 아이콘을 미리 디스크 캐시에 받아둔다.
  // (캐시가 비어 검은 박스가 깜빡이던 첫 설치 케이스 대응)
  useFocusEffect(
    useCallback(() => {
      const urls = modeItems.map((it) => itemImageUrl(it.imageKey));
      if (urls.length) Image.prefetch(urls, { cachePolicy: "memory-disk" });
    }, [modeItems]),
  );

  const displayItems = useMemo(() => {
    if (!activeFilter) return modeItems;
    const def = FILTERS.find((f) => f.key === activeFilter);
    return def ? modeItems.filter(def.predicate) : modeItems;
  }, [modeItems, activeFilter]);

  // 마지막 행 균등 크기를 위해 null로 패딩한 뒤 NUM_COLS씩 row로 묶는다.
  const rows = useMemo((): (Item | null)[][] => {
    const rem = displayItems.length % NUM_COLS;
    const padded: (Item | null)[] =
      rem === 0
        ? displayItems
        : [...displayItems, ...Array<null>(NUM_COLS - rem).fill(null)];
    const result: (Item | null)[][] = [];
    for (let i = 0; i < padded.length; i += NUM_COLS) {
      result.push(padded.slice(i, i + NUM_COLS));
    }
    return result;
  }, [displayItems]);

  // 그리드 영역 실측 너비를 NUM_COLS로 나눠 셀 크기 산출 (gap 제외)
  const cellSize =
    gridWidth > 0
      ? Math.max(
          36,
          Math.floor((gridWidth - (NUM_COLS - 1) * CELL_GAP) / NUM_COLS),
        )
      : 48;

  const selectedItems = useMemo(
    () => resolveIds(selectedIds, modeItems),
    [selectedIds, modeItems],
  );
  const itemStatsList = useMemo(
    () => selectedItems.map((it) => it.stats),
    [selectedItems],
  );

  const handleItemPress = (item: Item) => {
    setSelectedIds((prev) => {
      if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, item.id];
    });
  };

  const handleSlotPress = (_index: number, slot: SlotItem | null) => {
    if (slot) setSelectedIds((prev) => prev.filter((id) => id !== slot.id));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    let build;
    try {
      build = await saveBuild({
        mode,
        championId,
        augmentIds: pickedAugments.map((a) => a.id),
        itemIds: selectedIds,
      });
    } catch {
      Alert.alert(translate("saveError"));
      setSaving(false);
      return;
    }
    // 저장을 기다리는 동안 헤더의 나가기가 계속 살아 있다. 이미 나갔으면 회전도
    // navigation 도 하지 않는다 — 방향은 나가기 경로가 되돌려 놨다.
    if (!alive.current) return;
    // lockAsync를 await해서 기기가 portrait로 전환된 후 navigation을 시작한다.
    // await 없이 바로 이동하면 landscape 상태로 build 상세가 mount돼 회전 잔상이 보인다.
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

  // 저장 외의 유일한 출구. 그냥 pop하면 landscape가 잠긴 채 홈으로 튕기므로
  // 홈으로 보낸 뒤 portrait로 되돌린다(빌드는 저장하지 않는다).
  const handleExit = () => {
    Alert.alert(translate("exitConfirm"), "", [
      { text: translate("exitCancel"), style: "cancel" },
      {
        text: translate("exitOk"),
        style: "destructive",
        onPress: () => {
          router.dismissTo("/");
          lockPortraitAfterExit();
        },
      },
    ]);
  };

  return {
    translate,
    champion,
    rows,
    cellSize,
    activeFilter,
    setActiveFilter,
    selectedIds,
    selectedItems,
    itemStatsList,
    augmentGridWidth,
    handleItemPress,
    handleSlotPress,
    handleSave,
    handleExit,
    onGridLayout: (e: LayoutChangeEvent) =>
      setGridWidth(e.nativeEvent.layout.width),
    onAugmentGridLayout: (e: LayoutChangeEvent) =>
      setAugmentGridWidth(e.nativeEvent.layout.width),
  };
}
