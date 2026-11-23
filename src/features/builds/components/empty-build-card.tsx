/**
 * EmptyBuildCard — 저장된 빌드가 없을 때 최근 빌드 캐러셀 첫 자리를 채우는 빈 카드.
 * 빌드 카드와 같은 크기·모서리라 첫 빌드가 생기면 그 자리에 그대로 들어선다.
 * 점선 빈 칸은 "여기에 놓인다"는 자리 표시다. 누르면 탭바 + 와 같은 모드 선택을 연다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";
import { BUILD_CARD_ASPECT } from "./build-card";

const t = {
  ko: { hint: "빌드를 완료하면\n여기에 쌓여요", start: "새 빌드 시작" },
  en: { hint: "Finished builds\nshow up here", start: "Start a new build" },
};

const ICON = 28;

export function EmptyBuildCard({ width, onPress }: { width: number; onPress: () => void }) {
  const translate = useTranslation(t);
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={translate("start")}
      accessibilityHint={translate("hint")}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          height: width / BUILD_CARD_ASPECT,
          backgroundColor: colors.surface.raised,
          borderColor: colors.border.strong,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons name="plus" size={ICON} color={colors.text.tertiary} />
      <ThemedText type="caption" color="tertiary" style={styles.hint}>
        {translate("hint")}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    padding: Spacing.three,
  },
  hint: {
    textAlign: "center",
  },
});
