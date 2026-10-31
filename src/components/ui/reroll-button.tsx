/**
 * RerollButton — 카드 아래 원형 리롤 버튼.
 *
 * 카드당 1회만 쓸 수 있고, 소진되면(used) 가라앉은 표면 + 흐린 아이콘으로 잠긴 상태를
 * 보여준다. 픽 연출이 도는 동안(disabled)에는 아직 안 쓴 버튼도 흐려진다 — 눌러도
 * 소용없는 순간임을 알려야 해서다. 소진된 버튼은 이미 가라앉아 있으므로 더 흐리지 않는다.
 *
 * hackedArt(커맨드 라인 해킹 리롤)를 주면 원형 버튼 대신 그 이미지가 버튼이 되고, 주기적으로 번쩍이며
 * 살짝 커졌다 돌아온다. 이미지 자체가 금색이라 '동작 줄이기'로 번쩍임이 빠져도 구분된다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const SIZE = 36;
// 버튼 자리(SIZE)보다 크게 그려도 자리는 그대로라 카드 줄 레이아웃이 바뀌지 않는다.
const HACKED_ART_SIZE = 50;
// 번쩍임은 빠르게 오르고 천천히 식어야 형광등 깜빡임이 아니라 빛나는 것처럼 보인다.
const FLASH_IN_MS = 140;
const FLASH_OUT_MS = 460;
const FLASH_REST_MS = 700;
const FLASH_SCALE = 0.14;

interface Props {
  /** 이번 라운드에 이미 리롤했다 — 영구 잠금. */
  used: boolean;
  /** 다음 리롤이 등급을 올릴 때의 버튼 이미지. */
  hackedArt?: { icon: number; iconLight: number; flash: number };
  /** 픽·리롤 연출 중이라 지금은 못 누른다. */
  disabled?: boolean;
  onPress: () => void;
}

export function RerollButton({ used, hackedArt, disabled, onPress }: Props) {
  const { colors, mode } = useTheme();
  const locked = used || disabled;
  const glowing = hackedArt != null && !locked;

  const flash = useSharedValue(0);
  useEffect(() => {
    flash.value = glowing
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: FLASH_IN_MS, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: FLASH_OUT_MS, easing: Easing.out(Easing.cubic) }),
            withDelay(FLASH_REST_MS, withTiming(0, { duration: 0 })),
          ),
          -1,
        )
      : 0;
    // Shared value는 안정적인 ref이므로 deps에서 의도적으로 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glowing]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const artStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + flash.value * FLASH_SCALE }],
  }));

  if (hackedArt && !used) {
    return (
      <View style={styles.slot}>
        <Animated.View style={[styles.hackedArt, artStyle]}>
          <Pressable
            onPress={locked ? undefined : onPress}
            disabled={locked}
            hitSlop={Spacing.one}
            style={({ pressed }) => [
              styles.fill,
              { opacity: disabled ? 0.35 : pressed ? 0.65 : 1 },
            ]}
          >
            <Image
              source={mode === "light" ? hackedArt.iconLight : hackedArt.icon}
              style={styles.fill}
              contentFit="contain"
            />
            <Animated.View style={[StyleSheet.absoluteFill, flashStyle]}>
              <Image source={hackedArt.flash} style={styles.fill} contentFit="contain" />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      style={({ pressed }) => [
        styles.button,
        used
          ? {
              backgroundColor: colors.surface.sunken,
              borderColor: colors.border.subtle,
            }
          : {
              backgroundColor: colors.surface.raised,
              borderColor: colors.border.strong,
            },
        { opacity: disabled && !used ? 0.35 : pressed ? 0.65 : 1 },
      ]}
    >
      <MaterialCommunityIcons
        name="refresh"
        size={18}
        color={used ? colors.text.disabled : colors.text.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  hackedArt: {
    position: "absolute",
    width: HACKED_ART_SIZE,
    height: HACKED_ART_SIZE,
  },
  fill: {
    flex: 1,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
