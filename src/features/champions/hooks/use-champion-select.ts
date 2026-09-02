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

import { parseLaunchMode, type LaunchMode } from "@/constants/game-modes";
import { useAlive } from "@/hooks/use-alive";
import { useLocale } from "@/hooks/use-locale";
import { championClassIconUrl, championSquareUrl } from "@/lib/ddragon";
import { matchName } from "@/lib/hangul";
import { lockOrientation } from "@/lib/orientation";
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

/** Alert dismiss 애니메이션이 끝나기를 기다리는 시간 — 아래 주석 참고. */
const ALERT_DISMISS_MS = 300;

/**
 * 클래식 라운드 수 질문(바론 간식 10개 → 5라운드, 아니면 4라운드).
 *
 * **가로 전환 전에** 물어야 한다. Alert 은 새 presentation 이라 iOS 가 지원 방향을 다시
 * 계산하는데, 드래프트 화면에서 띄우면 expo-screen-orientation 의 landscape 잠금이 풀려
 * 화면이 세로로 되돌아간다.
 *
 * 그리고 **dismiss 가 끝난 뒤에 resolve 해야 한다.** onPress 는 알럿이 아직 내려가는
 * 중에 불리는데, 그 전환 중에 lockAsync 를 호출하면 회전은 걸리지만 완료 콜백이 유실돼
 * Promise 가 영영 pending 이 된다 — 챔피언 선택 모달이 가로로 누운 채 멈췄다.
 * 한 박자 늦춰 알럿을 완전히 보낸 뒤 잠그면 lockAsync 가 정상 resolve 한다.
 * (그래도 못 받는 경우는 lockOrientation 의 타임아웃이 받아낸다.)
 */
function askClassicRounds(
  translate: (key: keyof (typeof t)["en"]) => string,
): Promise<number> {
  return new Promise((resolve) => {
    const answer = (rounds: number) =>
      setTimeout(() => resolve(rounds), ALERT_DISMISS_MS);
    Alert.alert(translate("snackTitle"), translate("snackMessage"), [
      { text: translate("snackYes"), onPress: () => answer(5) },
      {
        text: translate("snackNo"),
        style: "destructive",
        onPress: () => answer(4),
      },
    ]);
  });
}

export function useChampionSelect() {
  const champions = useChampions();
  const translate = useTranslation(t);
  const { locale } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: LaunchMode = parseLaunchMode(params.mode);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const searchRef = useRef<SearchBarCommands>(null);
  // 클래식은 알럿 응답 후 회전까지 몇백 ms가 뜨는데 그동안 ✓ 가 계속 눌린다.
  // 가드가 없으면 replace 가 두 번 나가 드래프트가 겹쳐 뜬다.
  const startingRef = useRef(false);
  // 이 화면은 모달이라 라운드를 묻는 동안 스와이프로 닫힐 수 있다. 그 뒤에도
  // handleStart 의 await 체인은 계속 흘러 회전과 navigation 을 마저 하려 든다 —
  // 닫힌 모달이 가로로 돌린 채 드래프트를 띄우는 셈이다. 살아 있을 때만 진행한다.
  const alive = useAlive();

  const filtered = champions
    .filter((c) => !selectedTag || c.tags.includes(selectedTag))
    .filter((c) => matchName(c.name, query))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  // 아레나는 첫 칸에 물음표(용기) 박스를 둔다 — 검색/필터 중에는 숨긴다.
  const showBravery = mode === "arena" && !query && !selectedTag;
  const listData: GridItem[] = showBravery
    ? [{ id: BRAVERY_ID }, ...filtered]
    : filtered;

  /**
   * 이 화면은 세로다 — 포커스마다 그렇게 잠근다.
   *
   * 가로 화면 넷은 `useLandscapeLock` 으로 매번 가로를 주장하는데, 세로 쪽은
   * "나가는 화면이 나가면서 한 번 돌려준다"가 전부였다. 그래서 여기 도착했을 때의
   * 방향은 직전에 누가 무엇을 걸었느냐에 달려 있었고, 가로 잠금이 남은 채로 들어오면
   * 그리드는 세로로 보이는데 **Alert 만 가로로** 떴다(클래식 라운드 질문에서 실제로).
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
    // 물음표(용기) 선택 시 전체 챔피언 중 한 명을 무작위 확정한다.
    const championId =
      selectedId === BRAVERY_ID
        ? champions[Math.floor(Math.random() * champions.length)]?.id
        : selectedId;
    if (!championId) {
      startingRef.current = false;
      return;
    }
    // 클래식 라운드 수는 세로일 때 먼저 확정한다(가로에서 물으면 잠금이 풀린다).
    const rounds = mode === "classic" ? await askClassicRounds(translate) : 4;
    // 묻는 사이 모달이 닫혔으면 회전조차 걸지 않는다.
    if (!alive.current) return;
    // 잠금을 await해서 기기가 landscape로 전환된 후 navigation을 시작한다.
    // await 없이 바로 replace하면 portrait 상태로 화면이 mount될 수 있다.
    await lockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);
    // 회전을 기다리는 동안 닫혔다면 가로로 눕힌 것부터 되돌리고 물러난다.
    if (!alive.current) {
      void lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      return;
    }
    // 클래식은 칼바람과 화면이 같아 /aram 라우트를 공유하고 mode 를 실어 보낸다.
    // 드래프트 → 아이템 → saveBuild 까지 이 파라미터가 모드를 나른다.
    //
    // 삼항이 아니라 Record 인 이유: 삼항으로 두면 새 모드가 조용히 칼바람으로 흡수된다
    // (클래식이 실제로 그랬다 — game-modes.ts 주석 참고). Record 는 빠뜨리면 컴파일 에러다.
    const go: Record<LaunchMode, () => void> = {
      aram: () =>
        router.replace({
          pathname: "/aram",
          params: { championId, mode: "aram", rounds: String(rounds) },
        }),
      classic: () =>
        router.replace({
          pathname: "/aram",
          params: { championId, mode: "classic", rounds: String(rounds) },
        }),
      arena: () =>
        router.replace({ pathname: "/arena", params: { championId } }),
      // 커스텀은 라운드·뽑기가 없어 championId 만 나른다(모드는 화면 안 drawer 에서 고른다).
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
    setQuery,
    handleSelect,
    handleTagPress,
    handleStart,
  };
}
