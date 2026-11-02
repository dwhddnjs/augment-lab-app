/**
 * useChampionSelect — 챔피언 선택 화면의 공용 상태/로직.
 *
 * 화면(champion-select-screen.tsx)과 분리해 검색/필터/선택/시작 로직을 여기에 모은다.
 */
import { Image } from "expo-image";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useRef, useState } from "react";
import type { SearchBarCommands } from "react-native-screens";

import { parseLaunchMode, type LaunchMode } from "@/constants/game-modes";
import { useLocale } from "@/hooks/use-locale";
import { championClassIconUrl, championSquareUrl } from "@/lib/ddragon";
import { matchName } from "@/lib/hangul";
import { lockOrientation } from "@/lib/orientation";
import { CHAMPION_TAGS, useTranslation } from "@/lib/i18n";
import { useChampions } from "./use-champions";

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
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: LaunchMode = parseLaunchMode(params.mode);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const searchRef = useRef<SearchBarCommands>(null);
  // 시트가 걷히는 동안 ✓ 가 계속 눌린다.
  // 가드가 없으면 replace 가 두 번 나가 드래프트가 겹쳐 뜬다.
  const startingRef = useRef(false);

  const listData = champions
    .filter((c) => !selectedTag || c.tags.includes(selectedTag))
    .filter((c) => matchName(c.name, query))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  /**
   * 이 화면은 세로다 — 포커스마다 그렇게 잠근다.
   *
   * 가로 화면 넷은 `useLandscapeLock` 으로 매번 가로를 주장하는데, 세로 쪽은
   * "나가는 화면이 나가면서 한 번 돌려준다"가 전부였다. 그래서 여기 도착했을 때의
   * 방향은 직전에 누가 무엇을 걸었느냐에 달려 있었고, 가로 잠금이 남은 채로 들어오면
   * 그리드는 세로로 보이는데 **Alert 만 가로로** 떴다(옛 클래식 라운드 질문에서 실제로).
   * Alert 은 새 presentation 이라 그 순간 지원 방향을 다시 계산하기 때문이다.
   */
  useFocusEffect(
    useCallback(() => {
      void lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, []),
  );

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
    if (!selectedId || startingRef.current) return;
    startingRef.current = true;
    const championId = selectedId;
    // 시트를 페이드로 걷는다. 네이티브는 모달을 닫는 순간의 animation 값을 읽으므로, 값이 반영될
    // 한 프레임을 기다린 뒤에 넘어간다. 회전은 여기서 걸지 않는다 — 시트가 사라진 뒤에 다음 화면이
    // 빈 채로 돈다(useLandscapeLock).
    navigation.setOptions({ animation: "fade" });
    await new Promise(requestAnimationFrame);
    // 드래프트 → 아이템 → saveBuild 까지 mode 파라미터가 저장 모드를 나른다.
    //
    // 삼항이 아니라 Record 인 이유: 삼항으로 두면 새 모드가 조용히 칼바람으로 흡수된다
    // (클래식이 실제로 그랬다 — game-modes.ts 주석 참고). Record 는 빠뜨리면 컴파일 에러다.
    const go: Record<LaunchMode, () => void> = {
      aram: () =>
        router.replace({
          pathname: "/aram",
          params: { championId, mode: "aram" },
        }),
      // 커스텀은 뽑기가 없어 championId 만 나른다.
      custom: () =>
        router.replace({ pathname: "/custom", params: { championId } }),
    };
    go[mode]();
  };

  return {
    translate,
    selectedId,
    selectedTag,
    searchRef,
    listData,
    query,
    setQuery,
    handleSelect,
    handleTagPress,
    handleStart,
  };
}
