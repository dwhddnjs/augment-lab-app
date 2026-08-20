/**
 * useChampionSelect — 챔피언 선택 화면의 공용 상태/로직.
 *
 * 화면(champion-select-screen.tsx)과 분리해 검색/필터/선택/시작 로직을 여기에 모은다.
 */
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
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
    snackTitle: "바론한테 간식 10개를 주셨나요?",
    snackMessage: "줬다면 5라운드, 아니면 4라운드입니다.",
    snackYes: "예",
    snackNo: "아니오",
  },
  en: {
    title: "Select Champion",
    searchPlaceholder: "Search champions",
    start: "Start",
    cancel: "Cancel",
    snackTitle: "Did you feed Baron 10 snacks?",
    snackMessage: "Yes means 5 rounds, no means 4.",
    snackYes: "Yes",
    snackNo: "No",
  },
};

/**
 * 클래식 라운드 수 질문(바론 간식 10개 → 5라운드, 아니면 4라운드).
 *
 * **가로 전환 전에** 물어야 한다. Alert 은 새 presentation 이라 iOS 가 지원 방향을 다시
 * 계산하는데, 드래프트 화면에서 띄우면 expo-screen-orientation 의 landscape 잠금이 풀려
 * 화면이 세로로 되돌아간다.
 */
function askClassicRounds(
  translate: (key: keyof (typeof t)["en"]) => string,
): Promise<number> {
  return new Promise((resolve) => {
    Alert.alert(translate("snackTitle"), translate("snackMessage"), [
      { text: translate("snackYes"), onPress: () => resolve(5) },
      { text: translate("snackNo"), style: "destructive", onPress: () => resolve(4) },
    ]);
  });
}

export function useChampionSelect() {
  const champions = useChampions();
  const translate = useTranslation(t);
  const { locale } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  // 삼항으로 두면 새 모드가 조용히 칼바람으로 흡수된다(클래식이 실제로 그랬다).
  // 아는 모드만 통과시키고 나머지는 명시적으로 칼바람 폴백.
  const mode: GameMode =
    params.mode === "arena" || params.mode === "classic" ? params.mode : "aram";
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
    // 클래식 라운드 수는 세로일 때 먼저 확정한다(가로에서 물으면 잠금이 풀린다).
    const rounds = mode === "classic" ? await askClassicRounds(translate) : 4;
    // lockAsync를 await해서 기기가 landscape로 전환된 후 navigation을 시작한다.
    // await 없이 바로 replace하면 portrait 상태로 화면이 mount될 수 있다.
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    ).catch(() => {});
    // 클래식은 칼바람과 화면이 같아 /aram 라우트를 공유하고 mode 를 실어 보낸다.
    // 드래프트 → 아이템 → saveBuild 까지 이 파라미터가 모드를 나른다.
    router.replace(
      mode === "arena"
        ? { pathname: "/arena", params: { championId } }
        : {
            pathname: "/aram",
            params: { championId, mode, rounds: String(rounds) },
          },
    );
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
