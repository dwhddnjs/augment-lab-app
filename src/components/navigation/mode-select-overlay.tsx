/**
 * ModeSelectOverlay — `+` 버튼을 누르면 뜨는 투명 모달.
 * 화면을 딤 처리하고 하단(+ 버튼 근처)에 아레나/칼바람 원형 버튼을 띄운다.
 * 모드를 고르면 챔피언 선택 모달로 교체(replace)한다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { BottomTabInset, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { GameMode } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: { arena: "아레나", aram: "칼바람" },
  en: { arena: "Arena", aram: "ARAM" },
};

const MODES: { mode: GameMode; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] =
  [
    { mode: "arena", icon: "sword-cross" },
    { mode: "aram", icon: "snowflake" },
  ];

export function ModeSelectOverlay() {
  const router = useRouter();
  const { colors } = useTheme();
  const translate = useTranslation(t);

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

      <SafeAreaView style={styles.safe} edges={["bottom"]} pointerEvents="box-none">
        <View style={styles.buttons}>
          {MODES.map((m, i) => (
            <Animated.View
              key={m.mode}
              entering={FadeInDown.delay(i * 60).springify().damping(14)}
            >
              <Pressable style={styles.row} onPress={() => choose(m.mode)}>
                <ThemedText
                  type="label"
                  style={[styles.label, { color: colors.text.primary }]}
                >
                  {translate(m.mode)}
                </ThemedText>
                <View
                  style={[styles.circle, { backgroundColor: colors.accent.default }]}
                >
                  <MaterialCommunityIcons
                    name={m.icon}
                    size={26}
                    color={colors.accent.onAccent}
                  />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const CIRCLE = 56;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  buttons: {
    gap: Spacing.three,
    paddingRight: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  label: {
    fontWeight: "700",
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
