/**
 * MoreLink — 섹션 헤더 오른쪽 "전체 보기 >" 링크(accent 라벨 + chevron).
 * 홈의 최근 빌드(builds)와 지금 S티어(tierlist) 두 feature가 쓴다.
 */
import { Image } from "expo-image";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** label 타이포(14pt) 글자 높이에 맞춘 chevron 크기. */
const CHEVRON = 12;

export function MoreLink({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={Spacing.two} style={styles.row}>
      <ThemedText type="label" color="accent">
        {label}
      </ThemedText>
      <Image
        source="sf:chevron.right"
        contentFit="contain"
        tintColor={colors.accent.default}
        style={styles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.half },
  chevron: { width: CHEVRON, height: CHEVRON },
});
