/**
 * useCloseDraft — 드래프트(가로 전체 화면 모달 묶음)를 닫는다. 칼바람·커스텀·아이템 선택이 같이 쓴다.
 *
 * 루트 스택을 한 번에 바꾼다 — 나가기는 [(tabs)], 저장은 [(tabs), 빌드 상세]. (tabs) 는 원래 route 를
 * 그대로 넘겨 탭·홈 스택 상태를 지킨다. dismissTo + push 를 잇달아 부르지 말 것: expo-router 는 두 액션을
 * 한 배치로 보내 두 번째가 낡은 state 를 읽고, 화면 제거와 추가가 한 프레임에 겹쳐 빌드 상세가 죽은 프레임으로 떴다.
 *
 * 묶음([챔피언 시트, 드래프트, 아이템])은 맨 아래 모달인 시트의 애니메이션대로 한꺼번에 닫힌다. 시트는 드래프트를
 * 띄울 때 close=cut(애니메이션 없이)이 되고(use-champion-select), 나가기 확인창이 떠 있는 동안만 fade 다.
 * 누르는 순간에 바꾸면 그 값이 네이티브에 닿기 전에 닫힘이 들어가는 경합이 생긴다.
 *
 * - 저장: 애니메이션 없이 닫고, 빌드 상세를 같은 순간 모달 아래에 'none' 전환으로 push 한다(src/app/_layout.tsx).
 *   시트(pageSheet)는 애니메이션 없이 닫으면 iOS 가 0.25초를 기다리며 화면을 비운다. 루트 스택에 진행 중인
 *   push 전환이 있으면 기다리지 않고 바로 닫힌다 — 그래서 빌드 상세를 '전환으로' 깐다.
 *   대신 그 전환이 끝나기 전에 회전이 시작돼 먼저 끝나면, iOS 가 전환이 시작된 방향(가로)으로 되돌렸다가 다시
 *   세로로 돌린다(세로 → 가로 → 세로). 그래서 전환이 끝날 때까지 가로를 붙잡고, 빌드 상세가 나타나면 푼다
 *   (lib/orientation). 아이템 화면이 사라지면 가로로 놓인 빌드 상세가 보이고 곧 세로로 한 번 돈다.
 * - 나가기: 페이드로 닫는다. 페이드 뒤로 홈이 비친 뒤 세로로 돈다.
 */
import { useNavigation } from "expo-router";
import { CommonActions } from "expo-router/react-navigation";
import { Alert } from "react-native";

import { holdLandscape } from "@/lib/orientation";

const SHEET = "select-champion-modal";

type ExitLabels = { title: string; message?: string; cancel: string; ok: string };

export function useCloseDraft() {
  const navigation = useNavigation();

  const setSheetClose = (close: "cut" | "fade") => {
    const sheet = navigation.getState()?.routes.find((r) => r.name === SHEET);
    if (sheet) navigation.dispatch({ ...CommonActions.setParams({ close }), source: sheet.key });
  };

  const resetTo = (build?: string) =>
    navigation.dispatch((state) =>
      CommonActions.reset({
        ...state,
        index: build ? 1 : 0,
        routes: [
          ...state.routes.filter((r) => r.name === "(tabs)"),
          // saved: 모달 아래에서 'none' 전환으로 push 한다(src/app/_layout.tsx).
          ...(build ? [{ name: "build/[id]", params: { id: build, saved: "1" } }] : []),
        ],
      }),
    );

  return {
    openBuild: async (id: string) => {
      await holdLandscape();
      resetTo(id);
    },
    /** 나가기 확인창. 떠 있는 동안 시트를 fade 로 바꿔 두고, 취소하면 되돌린다. */
    confirmExit: ({ title, message = "", cancel, ok }: ExitLabels) => {
      setSheetClose("fade");
      Alert.alert(title, message, [
        { text: cancel, style: "cancel", onPress: () => setSheetClose("cut") },
        // 닫으면 iOS 가 세로로 돌린다.
        { text: ok, style: "destructive", onPress: () => resetTo() },
      ]);
    },
  };
}
