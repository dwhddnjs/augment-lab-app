/**
 * useChampionSelect — 챔피언 선택 화면의 공용 상태/로직.
 *
 * 화면(champion-select-screen.tsx)과 분리해 검색/필터/선택/시작 로직을 여기에 모은다.
 */
import { Image } from "expo-image";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useRef, useState } from "react";
import type { SearchBarCommands } from "react-native-screens";

import { parseLaunchMode, type LaunchMode } from "@/constants/game-modes";
import { useLocale } from "@/hooks/use-locale";
import { championClassIconUrl, championSquareUrl } from "@/lib/ddragon";
import { matchName } from "@/lib/hangul";
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
  // headliner — 홈 시작 카드에서 고른 헤드라이너. 여기선 해석하지 않고 드래프트로 그대로 넘긴다.
  const params = useLocalSearchParams<{ mode?: string; headliner?: string }>();
  const mode: LaunchMode = parseLaunchMode(params.mode);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const searchRef = useRef<SearchBarCommands>(null);
  // 드래프트가 뜨는 동안 ✓ 가 계속 눌린다.
  // 가드가 없으면 push 가 두 번 나가 드래프트가 겹쳐 뜬다.
  const startingRef = useRef(false);

  const listData = champions
    .filter((c) => !selectedTag || c.tags.includes(selectedTag))
    .filter((c) => matchName(c.name, query))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

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

  const handleStart = () => {
    if (!selectedId || startingRef.current) return;
    startingRef.current = true;
    const championId = selectedId;
    // 시트 위에 드래프트(가로 전체 화면 모달)를 쌓는다. 시트를 먼저 닫으면(replace) 시트가 걷힌 뒤
    // 홈이 비쳤다가 드래프트가 뜬다. 나갈 때·저장할 때 시트까지 한꺼번에 닫힌다(useCloseDraft).
    // 묶음은 시트의 애니메이션 설정대로 닫히므로, 저장 경로(애니메이션 없이 닫기)를 지금 정해 둔다.
    // 저장 순간에 바꾸면 그 값이 네이티브에 닿기 전에 닫힘이 들어가는 경합이 생긴다 — 그러면 페이드로 닫혀
    // 빌드 상세가 가로로 멈춰 보였다가 돌았다. 나가기는 확인창이 떠 있는 동안 fade 로 바꾼다(useCloseDraft).
    // 드래프트가 덮고 있는 동안 시트의 애니메이션은 쓰이지 않는다.
    router.setParams({ close: "cut" });
    // 드래프트 → 아이템 → saveBuild 까지 mode 파라미터가 저장 모드를 나른다.
    //
    // 삼항이 아니라 Record 인 이유: 삼항으로 두면 새 모드가 조용히 칼바람으로 흡수된다
    // (클래식이 실제로 그랬다 — game-modes.ts 주석 참고). Record 는 빠뜨리면 컴파일 에러다.
    const go: Record<LaunchMode, () => void> = {
      aram: () =>
        router.push({
          pathname: "/aram",
          params: { championId, mode: "aram", ...(params.headliner && { headliner: params.headliner }) },
        }),
      // 커스텀은 뽑기가 없어 championId 만 나른다.
      custom: () =>
        router.push({ pathname: "/custom", params: { championId } }),
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
