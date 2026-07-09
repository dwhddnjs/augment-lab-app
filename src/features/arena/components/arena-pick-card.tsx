/**
 * ArenaPickCard — 아레나 선택 카드(증강/프리즘/재련)의 공용 선택 애니메이션 래퍼.
 * 칼바람 AramCard와 동일한 동작으로 통일한다:
 *   - picked   : 선택한 카드 scale 1.05→1 바운스
 *   - unchosen : 나머지 카드 fade-out + scale-down
 *   - reroll   : 리롤 대상 카드 fade-out
 *   - 새 step 진입은 flip(좌우 회전) 등장, 리롤 교체분은 fade 등장
 * children(카드 프레임)을 Pressable + Animated.View로 감싼다. 별표·리롤 버튼 등
 * 카드별 부가 UI는 호출부에서 형제로 둔다.
 */
import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export type ArenaCardExitMode = "none" | "picked" | "unchosen" | "reroll";
export type ArenaCardEntryMode = "flip" | "fade";

interface Props {
  index: number;
  exitMode: ArenaCardExitMode;
  entryMode: ArenaCardEntryMode;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

export function ArenaPickCard({
  index,
  exitMode,
  entryMode,
  disabled,
  onPress,
  children,
}: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(entryMode === "flip" ? 90 : 0);

  useEffect(() => {
    if (exitMode === "none") {
      if (entryMode === "flip") {
        // 새 step: 카드가 행을 가로질러 순차적으로 펼쳐지며 등장.
        const delay = index * 90;
        opacity.value = 0;
        scale.value = 1;
        rotateY.value = 90;
        opacity.value = withDelay(delay, withTiming(1, { duration: 160 }));
        rotateY.value = withDelay(
          delay,
          withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }),
        );
      } else {
        // 리롤 교체분: 빠른 fade + scale-in.
        rotateY.value = 0;
        opacity.value = 0;
        scale.value = 0.96;
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withTiming(1, { duration: 240 });
      }
    } else if (exitMode === "picked") {
      scale.value = withSequence(
        withTiming(1.05, { duration: 120 }),
        withTiming(1, { duration: 90 }),
      );
    } else if (exitMode === "unchosen") {
      opacity.value = withTiming(0, { duration: 280 });
      scale.value = withTiming(0.94, { duration: 280 });
    } else if (exitMode === "reroll") {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.96, { duration: 200 });
    }
    // Shared value는 안정적인 ref이므로 deps에서 의도적으로 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitMode, index, entryMode]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { perspective: 900 },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[{ backfaceVisibility: "hidden" }, animatedStyle]}>
      <Pressable onPress={disabled ? undefined : onPress} disabled={disabled}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
