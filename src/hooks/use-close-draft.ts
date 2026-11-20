/**
 * useCloseDraft — 드래프트(가로 전체 화면 모달 묶음)를 닫는다. 칼바람·커스텀·아이템 선택이 같이 쓴다.
 *
 * 루트 스택을 한 번에 바꾼다 — 나가기는 [(tabs)], 저장은 [(tabs), 빌드 상세]. (tabs) 는 원래 route 를
 * 그대로 넘겨 탭·홈 스택 상태를 지킨다. dismissTo + push 를 잇달아 부르지 말 것: expo-router 는 두 액션을
 * 한 배치로 보내 두 번째가 낡은 state 를 읽고, 화면 제거와 추가가 한 프레임에 겹쳐 빌드 상세가 죽은 프레임으로 떴다.
 *
 * 묶음([챔피언 시트, 드래프트, 아이템])은 맨 아래 모달인 시트가 애니메이션을 원하느냐에 따라 한꺼번에 닫히고,
 * 애니메이션이 있으면 맨 위 모달의 전환(페이드)으로 닫힌다. 회전은 닫힘이 끝난 뒤에 시작된다.
 * - 저장: 시트를 애니메이션 없이(close=cut) 닫는다. 빌드 상세가 모달 아래에 먼저 깔려 있다가 곧바로 세로로
 *   돌며 드러난다. 페이드로 닫으면 페이드가 끝날 때까지 빌드 상세가 가로로 멈춰 보였다.
 * - 나가기: 페이드로 닫는다. 애니메이션 없이 닫으면 탭 화면이 다시 붙는 0.35s 동안 빈 화면(#1C1C1E)이 보였다.
 *   페이드 뒤로 홈이 비친 뒤 세로로 돈다.
 */
import { useNavigation } from "expo-router";
import { CommonActions } from "expo-router/react-navigation";

const SHEET = "select-champion-modal";

/** 시트 옵션 변경이 네이티브에 반영될 때까지 — 같은 프레임에 닫으면 바뀌기 전 값으로 닫힌다. */
const nextFrames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export function useCloseDraft() {
  const navigation = useNavigation();

  const resetTo = (build?: string) =>
    navigation.dispatch((state) =>
      CommonActions.reset({
        ...state,
        index: build ? 1 : 0,
        routes: [
          ...state.routes.filter((r) => r.name === "(tabs)"),
          // saved: 모달 아래에서 애니메이션 없이 push 한다(src/app/_layout.tsx).
          ...(build ? [{ name: "build/[id]", params: { id: build, saved: "1" } }] : []),
        ],
      }),
    );

  return {
    exit: () => resetTo(),
    openBuild: async (id: string) => {
      const sheet = navigation.getState()?.routes.find((r) => r.name === SHEET);
      if (sheet) {
        navigation.dispatch({ ...CommonActions.setParams({ close: "cut" }), source: sheet.key });
        await nextFrames();
      }
      resetTo(id);
    },
  };
}
