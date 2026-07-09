/**
 * ModeSelectOverlay — `+` 버튼을 누르면 뜨는 투명 모달.
 * 화면을 딤 처리하고 하단(+ 버튼 근처)에 아레나/칼바람 원형 버튼을 띄운다.
 * 모드를 고르면 챔피언 선택 모달로 교체(replace)한다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { BottomTabInset, Radius, Spacing, Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { GameMode } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: { arena: "아레나", aram: "칼바람" },
  en: { arena: "Arena", aram: "ARAM" },
};

const MODES: {
  mode: GameMode;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { mode: "arena", icon: "sword-cross" },
  { mode: "aram", icon: "snowflake" },
];

// backdrop이 라이트/다크 모두 어두운 scrim이므로, 모드와 무관하게
// 다크 테마의 밝은 민트를 써야 대비가 충분하다(라이트 민트는 어두워 안 보임).
const ON_SCRIM_ACCENT = Theme.dark.accent.default;

export function ModeSelectOverlay() {
  const router = useRouter();
  const { colors } = useTheme();
  const translate = useTranslation(t);
  // SafeAreaView(컴포넌트)는 첫 마운트 때 프레임을 비동기 측정해 inset이 0→실제로
  // 튀면서 버튼이 + 버튼을 가린다. 루트 provider에서 즉시 읽는 hook으로 고정한다.
  const insets = useSafeAreaInsets();

  const close = () => router.back();

  const choose = (mode: GameMode) => {
    router.replace({ pathname: "/select-champion-modal", params: { mode } });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      style={[styles.backdrop, { backgroundColor: colors.surface.overlay }]}
    >
      {/* 배경 탭 → 닫기 */}
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />

      <View
        pointerEvents="box-none"
        style={[
          styles.buttons,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.three },
        ]}
      >
        {MODES.map((m, i) => (
          <Animated.View
            key={m.mode}
            // + 버튼에서 가까운 아래쪽(칼바람)부터 위로 한 장씩 올라온다.
            // spring은 오버슈트로 낭창거려 timing + ease-out으로 딱 떨어지게 한다.
            entering={FadeInDown.delay((MODES.length - 1 - i) * STAGGER)
              .duration(220)
              .easing(Easing.out(Easing.cubic))
              .withInitialValues({ transform: [{ translateY: RISE }] })}
          >
            <Pressable
              onPress={() => choose(m.mode)}
              style={[styles.circle, { borderColor: ON_SCRIM_ACCENT }]}
            >
              <View style={styles.circleFill}>
                <MaterialCommunityIcons
                  name={m.icon}
                  size={24}
                  color={ON_SCRIM_ACCENT}
                />
                <ThemedText type="caption" style={{ color: ON_SCRIM_ACCENT }}>
                  {translate(m.mode)}
                </ThemedText>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const CIRCLE = 60;
// 등장 간격/거리 — 짧은 stagger + 짧은 이동거리라야 "순서대로 톡톡" 튀어나온다.
const STAGGER = 70;
const RISE = 20;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  buttons: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    gap: Spacing.three,
    paddingRight: 22,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: Radius.full,
    borderCurve: "continuous",
    borderWidth: 1.5,
    overflow: "hidden",
  },
  circleFill: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
  },
});
