/**
 * HeadlinerReveal — 드래프트 첫머리 헤드라이너 등장 연출.
 *
 * 공연 타이틀 카드처럼 화면 전체를 어두운 무대로 덮고, 왼쪽에 로고 오른쪽에 이름을 세운다.
 * 가로 화면은 세로가 짧아 위아래로 쌓으면 로고가 작아진다. 조명은 밴드 고유색 하나만 쓰고,
 * 무대는 라이트 모드에서도 어둡다(앱 화면이 아니라 잠깐 지나가는 장면이다).
 *
 * 끝나는 시점은 reanimated 완료 콜백이 아니라 타이머로 잰다. 콜백은 '동작 줄이기'에서 즉시
 * 불릴 수 있다. 사라지는 동안에도 Pressable 이 남아 연타가 뒤에 뜬 카드를 고르지 못한다.
 */
import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  Keyframe,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import {
  HeadlinerColors,
  HeroOverlay,
  Spacing,
  Typography,
} from "@/constants/theme";
import { HEADLINER_LOGOS } from "@/features/headliners/assets";
import { useHeadlinerTexts } from "@/features/headliners/hooks/use-headliners";
import type { HeadlinerId } from "@/features/headliners/types";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: { title: "이번 무대의 헤드라이너" },
  en: { title: "NOW ON STAGE" },
};

const LOGO_BOX = { width: 260, height: 180 };
// HEARTSTEEL 은 면이 꽉 찬 글자라 같은 크기면 다른 로고보다 훨씬 무겁게 보인다.
const LOGO_SCALE: Partial<Record<HeadlinerId, number>> = { heartsteel: 0.78 };
const AURA_SIZE = 460;
const HOLD_MS = 2600;
const FADE_OUT_MS = 300;

const SETTLE = Easing.out(Easing.cubic);

// 튕기지 않고 살짝 큰 데서 가라앉는다 — 등장에 무게를 주고 어지럽지 않다.
const logoIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 1.08 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: SETTLE },
})
  .delay(120)
  .duration(620)
  .reduceMotion(ReduceMotion.Never);

const ruleIn = new Keyframe({
  0: { opacity: 0, transform: [{ scaleY: 0 }] },
  100: { opacity: 1, transform: [{ scaleY: 1 }], easing: SETTLE },
})
  .delay(460)
  .duration(420)
  .reduceMotion(ReduceMotion.Never);

const copyIn = (delay: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateX: -Spacing.double }] },
    100: { opacity: 1, transform: [{ translateX: 0 }], easing: SETTLE },
  })
    .delay(delay)
    .duration(420)
    .reduceMotion(ReduceMotion.Never);

const washIn = FadeIn.duration(700).reduceMotion(ReduceMotion.Never);

interface Props {
  id: HeadlinerId;
  onDone: () => void;
}

export function HeadlinerReveal({ id, onDone }: Props) {
  const translate = useTranslation(t);
  const { name, description } = useHeadlinerTexts().headliners[id];
  const color = HeadlinerColors[id];

  const stage = useSharedValue(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const closing = useRef(false);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    stage.value = withTiming(0, {
      duration: FADE_OUT_MS,
      easing: Easing.inOut(Easing.quad),
      reduceMotion: ReduceMotion.Never,
    });
    timers.current.push(setTimeout(onDone, FADE_OUT_MS));
  };

  useEffect(() => {
    const pending = timers.current;
    pending.push(setTimeout(close, HOLD_MS));
    return () => pending.forEach(clearTimeout);
    // 마운트 때 한 번만 돈다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageStyle = useAnimatedStyle(() => ({ opacity: stage.value }));

  return (
    <Animated.View style={[styles.stage, stageStyle]}>
      <Pressable
        style={styles.fill}
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel={`${name}. ${description}`}
      >
        {/* 위에서 떨어지는 무대 조명 */}
        <Animated.View
          entering={washIn}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              experimental_backgroundImage: `radial-gradient(ellipse 70% 90% at 28% 0%, ${color}38 0%, ${color}00 100%)`,
            },
          ]}
        />

        <View style={styles.lockup}>
          <Animated.View entering={logoIn} style={styles.logoBox}>
            <View
              pointerEvents="none"
              style={[
                styles.aura,
                {
                  experimental_backgroundImage: `radial-gradient(circle, ${color}47 0%, ${color}14 42%, ${color}00 70%)`,
                },
              ]}
            />
            <Image
              source={HEADLINER_LOGOS[id]}
              style={[styles.logo, { transform: [{ scale: LOGO_SCALE[id] ?? 1 }] }]}
              contentFit="contain"
            />
          </Animated.View>

          <Animated.View
            entering={ruleIn}
            style={[styles.rule, { backgroundColor: `${color}80` }]}
          />

          <View style={styles.copy}>
            <Animated.View entering={copyIn(560)}>
              <ThemedText style={[styles.eyebrow, { color }]}>
                {translate("title")}
              </ThemedText>
            </Animated.View>
            <Animated.View entering={copyIn(620)}>
              <ThemedText
                type="display"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={styles.name}
              >
                {name}
              </ThemedText>
            </Animated.View>
            <Animated.View entering={copyIn(700)}>
              <ThemedText
                numberOfLines={3}
                lineBreakStrategyIOS="hangul-word"
                style={styles.description}
              >
                {description}
              </ThemedText>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFill,
    backgroundColor: HeroOverlay.cardBase,
  },
  fill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.five,
  },
  logoBox: {
    ...LOGO_BOX,
    alignItems: "center",
    justifyContent: "center",
  },
  aura: {
    position: "absolute",
    width: AURA_SIZE,
    height: AURA_SIZE,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  rule: {
    width: StyleSheet.hairlineWidth * 2,
    height: LOGO_BOX.height - Spacing.five,
  },
  copy: {
    width: 340,
    gap: Spacing.one,
  },
  eyebrow: {
    ...Typography.caption,
    fontWeight: "700",
    letterSpacing: 2,
  },
  name: {
    color: HeroOverlay.textPrimary,
    fontWeight: "800",
  },
  description: {
    ...Typography.label,
    fontWeight: "500",
    lineHeight: 22,
    color: HeroOverlay.textSecondary,
    marginTop: Spacing.one,
  },
});
