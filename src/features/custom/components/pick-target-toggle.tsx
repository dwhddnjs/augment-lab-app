/**
 * PickTargetToggle — 헤더의 증강↔아이템 전환. 검색 필드 오른쪽에 붙는다.
 *
 * 트랙 전체가 하나의 버튼이다 — 누를 때마다 반대편으로 넘어간다(세그먼트별 탭 아님).
 * 노브도 글라스다(요청). accent 는 유리 위에 반투명 층으로 얹어 iOS 26 미만
 * BlurView 폴백에서도 활성 쪽 색이 남게 한다. 움직이는 GlassView 는 매 프레임
 * 굴절을 다시 계산하므로, 저사양에서 끊기면 노브만 단색으로 되돌리면 된다.
 *
 * 노브 위치는 target 에서 곧바로 파생시킨다. 자체 shared value 에 담아 onPress 에서
 * 직접 옮기면, 리렌더 전에 두 번 눌린 순간 노브와 실제 target 이 갈라선다.
 */
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import { GlassSurface } from "@/components/ui/glass-surface";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";
import type { PickTarget } from "../hooks/use-custom-draft";

const t = {
  ko: { augment: "증강", item: "아이템", toggleLabel: "증강 · 아이템 전환" },
  en: { augment: "Augment", item: "Item", toggleLabel: "Augment / Item" },
};

/**
 * 노브 폭 = 세그먼트 폭이어야 좌우 끝 여백이 둘 다 PAD 로 같아진다.
 * (노브가 세그먼트보다 좁으면 오른쪽 끝에서만 그 차이만큼 더 떠 보인다.)
 *
 * 트랙에 padding 을 주지 않고 폭·높이를 직접 잡는다 — 절대배치 노브의 left/top 은
 * padding 이 아니라 테두리를 기준으로 잡히므로, padding 으로 여백을 만들면 왼쪽만
 * 붙고 오른쪽은 PAD 두 배로 뜬다. 여백은 노브의 left/top 하나로만 만든다.
 */
const PAD = Spacing.one;
const TRACK_H = 32; // 검색 필드와 같은 높이
const KNOB_H = TRACK_H - PAD * 2;
/** 가장 긴 라벨("Augment") 기준. 두 칸이 같은 폭이라 이동거리도 이 값 하나다. */
const SEG = 58;

const ORDER: PickTarget[] = ["augment", "item"];

interface Props {
  target: PickTarget;
  /** 뒤집기는 부르는 쪽이 prev 로 한다 — 여기서 다음 값을 계산해 넘기지 않는다. */
  onToggle: () => void;
}

export function PickTargetToggle({ target, onToggle }: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t) as (key: string) => string;

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(target === "item" ? SEG : 0, { duration: 180 }) },
    ],
  }));

  const toggle = () => {
    Haptics.selectionAsync().catch(() => {});
    onToggle();
  };

  return (
    <Pressable
      onPress={toggle}
      hitSlop={6}
      accessibilityRole="switch"
      // 트랙 안의 두 라벨은 그림일 뿐이라 상태로는 읽히지 않는다 — 무엇을 바꾸는
      // 스위치인지와 지금 어느 쪽인지를 따로 알린다.
      accessibilityLabel={translate("toggleLabel")}
      accessibilityValue={{ text: translate(target) }}
      accessibilityState={{ checked: target === "item" }}
    >
      <GlassSurface
        glassStyle="regular"
        style={[styles.track, { borderColor: colors.border.subtle }]}
      >
        <Animated.View pointerEvents="none" style={[styles.knob, knobStyle]}>
          <GlassSurface glassStyle="regular" style={styles.knobGlass}>
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.accent.subtle },
              ]}
            />
          </GlassSurface>
        </Animated.View>
        {ORDER.map((key) => (
          <View key={key} style={styles.segment}>
            <ThemedText
              type="caption"
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color:
                    target === key
                      ? colors.accent.default
                      : colors.text.tertiary,
                },
              ]}
            >
              {translate(key)}
            </ThemedText>
          </View>
        ))}
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: TRACK_H,
    width: SEG * 2 + PAD * 2,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  knob: {
    position: "absolute",
    left: PAD,
    top: PAD,
    width: SEG,
    height: KNOB_H,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  knobGlass: { flex: 1, borderRadius: Radius.full },
  segment: { width: SEG, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "700" },
});
