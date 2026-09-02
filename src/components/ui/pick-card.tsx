/**
 * PickCard — 카드 3장 중 하나를 고르는 화면들의 공용 선택 애니메이션 래퍼.
 * 칼바람·클래식(AramCard)과 아레나(증강/프리즘/재련/모루)가 같은 연출을 쓴다:
 *   - picked   : 선택한 카드 scale 1.05→1 바운스
 *   - unchosen : 나머지 카드 fade-out + scale-down
 *   - reroll   : 리롤 대상 카드 fade-out
 *   - 새 라운드·step 진입은 flip(좌우 회전) 등장, 리롤 교체분은 fade 등장
 *
 * children(카드 프레임)을 Pressable + Animated.View 로 감싼다. 별표·리롤 버튼 등
 * 카드별 부가 UI 는 호출부에서 형제로 둔다.
 *
 * 상태(어느 슬롯이 어떤 모드인지)는 useCardPickAnim 이 들고 있다.
 */
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { CARD_GAP, CARD_ROW_PAD } from "@/components/ui/rarity-card-frame";

export type CardExitMode = "none" | "picked" | "unchosen" | "reroll";
/** 갓 마운트된 카드가 등장하는 방식: 새 라운드는 'flip', 리롤 교체분은 'fade'. */
export type CardEntryMode = "flip" | "fade";

const DEFAULT_EASING = Easing.inOut(Easing.quad);
const FLIP_EASING = Easing.out(Easing.cubic);

// reanimated는 모든 애니메이션 기본값이 ReduceMotion.System이라, iOS '동작 줄이기'가
// 켜진 기기에서는 아래 withTiming/withDelay가 통째로 스킵되고 값이 최종값으로 튄다
// (= 카드가 애니메이션 없이 그냥 보인다). 명시적으로 opt-out하고, 어지럼증을 유발하는
// 회전만 빼서 그 기기에서도 최소한 fade는 재생되게 한다.
const timing = (toValue: number, duration: number, easing = DEFAULT_EASING) =>
  withTiming(toValue, { duration, easing, reduceMotion: ReduceMotion.Never });

interface Props {
  index: number;
  exitMode: CardExitMode;
  entryMode: CardEntryMode;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

export function PickCard({
  index,
  exitMode,
  entryMode,
  disabled,
  onPress,
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const flipIn = entryMode === "flip" && !reduceMotion;

  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(flipIn ? 90 : 0);

  useEffect(() => {
    if (exitMode === "none") {
      if (flipIn) {
        // 새 라운드: 카드가 행을 가로질러 순차적으로 펼쳐지며 등장.
        const delay = index * 90;
        opacity.value = 0;
        scale.value = 1;
        rotateY.value = 90;
        opacity.value = withDelay(delay, timing(1, 160), ReduceMotion.Never);
        rotateY.value = withDelay(
          delay,
          timing(0, 380, FLIP_EASING),
          ReduceMotion.Never,
        );
      } else {
        // 리롤 교체분(그리고 '동작 줄이기' 기기의 모든 카드): 빠른 fade + scale-in.
        rotateY.value = 0;
        opacity.value = 0;
        scale.value = 0.96;
        opacity.value = timing(1, 200);
        scale.value = timing(1, 240);
      }
    } else if (exitMode === "picked") {
      scale.value = withSequence(
        ReduceMotion.Never,
        timing(1.05, 120),
        timing(1, 90),
      );
    } else if (exitMode === "unchosen") {
      opacity.value = timing(0, 280);
      scale.value = timing(0.94, 280);
    } else if (exitMode === "reroll") {
      opacity.value = timing(0, 200);
      scale.value = timing(0.96, 200);
    }
    // Shared value는 안정적인 ref이므로 deps에서 의도적으로 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitMode, index, flipIn]);

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

/**
 * CardRow — 카드 3장을 가운데 정렬로 깐 행. 칼바람·클래식과 아레나가 공유한다.
 * 여백·간격은 카드 너비 계산(cardWidthFor)이 쓰는 값과 같아야 해서 거기서 가져온다.
 */
export function CardRow({ children }: { children: React.ReactNode }) {
  return <View style={rowStyles.row}>{children}</View>;
}

const rowStyles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: CARD_ROW_PAD,
    gap: CARD_GAP,
  },
});
