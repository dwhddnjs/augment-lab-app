import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";

/**
 * SetupScreen — 첫 설치 시 챔피언 아이콘을 받는 동안 보여주는 "리소스 준비" 화면.
 * 로고 바로 아래 진행률로 다운로드 중임을 알린다. 스플래시(다크)에서
 * 자연스럽게 이어지도록 같은 배경색을 쓴다.
 */
const t = {
  ko: {
    preparing: "이미지 준비 중...",
    hint: "처음 한 번만 받아두면 다음부터는 바로 열려요",
  },
  en: {
    preparing: "Preparing images",
    hint: "Just once — next time it opens instantly",
  },
};

const BAR_WIDTH = 240;

export function SetupScreen({ progress }: { progress: number }) {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    // 설치 완료로 언마운트될 때 fade-out → 그 아래 메인이 부드럽게 드러난다.
    <Animated.View
      exiting={FadeOut.duration(450)}
      style={[styles.root, { backgroundColor: colors.surface.base }]}
    >
      <View style={styles.center}>
        <Image
          source={require("@/assets/store/adaptive-foreground.png")}
          style={styles.logo}
          contentFit="contain"
        />

        <View style={styles.progressBlock}>
          <View style={styles.labelRow}>
            <ThemedText type="caption" color="secondary">
              {translate("preparing")}
            </ThemedText>
            <ThemedText type="caption" color="accent" style={styles.pct}>
              {pct}%
            </ThemedText>
          </View>
          <View
            style={[styles.track, { backgroundColor: colors.surface.raised }]}
          >
            <View
              style={[
                styles.fill,
                {
                  width: `${pct}%`,
                  backgroundColor: colors.accent.default,
                  boxShadow: `0 0 10px ${colors.accent.subtle}`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <ThemedText type="caption" color="tertiary" style={styles.hint}>
        {translate("hint")}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 500,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { alignItems: "center" },

  logo: { width: 120, height: 120 },

  progressBlock: { marginTop: Spacing.three, width: BAR_WIDTH },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.two,
  },
  pct: { fontVariant: ["tabular-nums"] },
  track: {
    width: "100%",
    height: 6,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: Radius.full },

  hint: { position: "absolute", bottom: Spacing.six },
});
