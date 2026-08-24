/**
 * 탭 스택(홈·커뮤니티·마이페이지) 공용 네이티브 헤더 옵션.
 *
 * 세 레이아웃이 같은 값을 각자 들고 있어 accent나 타이틀 색을 바꿀 때
 * 한쪽만 바뀌곤 했다. 화면별 옵션(headerLargeTitle 등)은 각 Stack.Screen 에서.
 */
import type { useTheme } from "@/hooks/use-theme";

export function stackScreenOptions(
  colors: ReturnType<typeof useTheme>["colors"],
) {
  return {
    headerShadowVisible: false,
    headerTintColor: colors.accent.default,
    headerTitleStyle: { color: colors.text.primary },
    headerLargeTitleStyle: { color: colors.text.primary },
  };
}
