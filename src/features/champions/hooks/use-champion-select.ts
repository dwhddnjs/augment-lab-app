/**
 * useChampionSelect — 챔피언 선택 화면의 공용 상태/로직.
 *
 * 화면은 champion-select-screen.{ios,android}.tsx 로 플랫폼별 분리되어 있고,
 * 검색/필터/선택/시작 로직은 전부 여기에 모은다.
 */
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useRef, useState } from "react";
import type { SearchBarCommands } from "react-native-screens";

import { useLocale } from "@/hooks/use-locale";
import type { GameMode } from "@/lib/build-storage";
import { championClassIconUrl, championSquareUrl } from "@/lib/ddragon";
import { matchChampionName } from "@/lib/hangul";
import { CHAMPION_TAGS, useTranslation } from "@/lib/i18n";
import type { Champion } from "../types";
import { useChampions } from "./use-champions";

// 아레나 "용기" — 그리드 맨 앞에 끼우는 무작위 챔피언 선택 항목.
export const BRAVERY_ID = "__bravery__";
export type GridItem = Champion | { id: typeof BRAVERY_ID };

const t = {
  ko: {
    title: "챔피언 선택",
    searchPlaceholder: "챔피언 검색 (초성 가능)",
    start: "시작하기",
    cancel: "취소",
  },
  en: {
    title: "Select Champion",
    searchPlaceholder: "Search champions",
    start: "Start",
    cancel: "Cancel",
  },
};

export function useChampionSelect() {
  const champions = useChampions();
  const translate = useTranslation(t);
  const { locale } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: GameMode = params.mode === "arena" ? "arena" : "aram";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const searchRef = useRef<SearchBarCommands>(null);

  const filtered = champions
    .filter((c) => !selectedTag || c.tags.includes(selectedTag))
    .filter((c) => matchChampionName(c.name, query))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  // 아레나는 첫 칸에 물음표(용기) 박스를 둔다 — 검색/필터 중에는 숨긴다.
  const showBravery = mode === "arena" && !query && !selectedTag;
  const listData: GridItem[] = showBravery
    ? [{ id: BRAVERY_ID }, ...filtered]
    : filtered;

  // 첫 진입 시 챔피언 아이콘·역할 칩을 미리 디스크 캐시에 받아둔다.
  // (캐시가 비어 검은 박스가 깜빡이던 첫 설치 케이스 대응)
  useFocusEffect(
    useCallback(() => {
      const urls = [
        ...champions.map((c) => championSquareUrl(c.imageKey)),
        ...CHAMPION_TAGS.map((tag) => championClassIconUrl(tag)).filter(
          (u): u is string => u !== null,
        ),
      ];
      if (urls.length) Image.prefetch(urls, { cachePolicy: "memory-disk" });
    }, [champions]),
  );

  const handleSelect = (id: string) => {
    setSelectedId((curr) => (curr === id ? null : id));
  };

  // tag === null 이면 필터 해제(전체 칩), 같은 태그 재탭도 해제.
  const handleTagPress = (tag: string | null) => {
    setSelectedTag((curr) => (tag === null || curr === tag ? null : tag));
  };

  const handleStart = async () => {
    if (!selectedId) return;
    // 물음표(용기) 선택 시 전체 챔피언 중 한 명을 무작위 확정한다.
    const championId =
      selectedId === BRAVERY_ID
        ? champions[Math.floor(Math.random() * champions.length)]?.id
        : selectedId;
    if (!championId) return;
    // lockAsync를 await해서 기기가 landscape로 전환된 후 navigation을 시작한다.
    // await 없이 바로 replace하면 portrait 상태로 화면이 mount될 수 있다.
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    ).catch(() => {});
    router.replace({
      pathname: mode === "arena" ? "/arena" : "/draft",
      params: { championId },
    });
  };

  return {
    translate,
    selectedId,
    selectedTag,
    searchRef,
    listData,
    setQuery,
    handleSelect,
    handleTagPress,
    handleStart,
  };
}
