/**
 * InsetView — 안전 영역만큼 안쪽 여백을 더하는 View. 드래프트(가로 화면)에서 SafeAreaView 대신 쓴다.
 *
 * 드래프트는 회전과 함께 뜨는 전체 화면 모달이다(src/app/_layout.tsx DRAFT_OPTIONS). 그 사이에 마운트된
 * 네이티브 SafeAreaView 는 안전 영역을 0 으로 잡은 채 갱신하지 않아, 나가기 버튼이 Dynamic Island 쪽으로
 * 붙고 타이틀에 덮여 눌리지 않았다. 루트에서 재는 useSafeAreaInsets 는 정확하다.
 * SafeAreaView(padding 모드)처럼 style 의 padding 위에 inset 을 더한다.
 */
import { StyleSheet, View, type ViewProps, type ViewStyle } from "react-native";
import { useSafeAreaInsets, type Edge } from "react-native-safe-area-context";

const SIDES = { top: "Top", right: "Right", bottom: "Bottom", left: "Left" } as const;

export function InsetView({
  edges,
  style,
  ...rest
}: ViewProps & { edges: readonly Edge[] }) {
  const insets = useSafeAreaInsets();
  const own: ViewStyle = StyleSheet.flatten(style) ?? {};

  const padding: ViewStyle = {};
  for (const edge of edges) {
    const side = SIDES[edge];
    const axis = edge === "top" || edge === "bottom" ? own.paddingVertical : own.paddingHorizontal;
    const base = own[`padding${side}`] ?? axis ?? own.padding ?? 0;
    padding[`padding${side}`] = (typeof base === "number" ? base : 0) + insets[edge];
  }

  // collapsable={false}: 레이아웃 값만 가진 View 는 네이티브 계층에서 평탄화되는데, 그러면 칼바람 헤더의
  // 로고·라운드·픽 현황이 접근성 트리에는 있는데 화면에 그려지지 않았다.
  return <View collapsable={false} style={[style, padding]} {...rest} />;
}
