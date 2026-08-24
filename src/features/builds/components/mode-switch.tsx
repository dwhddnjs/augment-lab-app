/**
 * 홈 목록의 모드 전환 컨트롤 두 벌 — 상단 세그먼트와 헤더 우측 컴팩트 토글.
 *
 * 둘은 `progress`(모드 인덱스 단위 SharedValue) 하나를 공유한다. 소유자는 화면이고,
 * 여기서는 그 값을 읽어 pill/원을 옮기고 라벨·아이콘 색을 보간할 뿐이다. 목록 필터
 * (setMode)는 화면이 애니메이션 완료 콜백에서 건다 — 이동 중 React 커밋이 끼어들면
 * 프레임을 먹기 때문이다(자세한 사연은 화면 쪽 주석 참고).
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { GlassSurface } from "@/components/ui/glass-surface";
import { GAME_MODES, MODE_ICONS, MODE_LABELS } from "@/constants/game-modes";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { GameMode } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";

// 슬라이딩 원형 글래스 인디케이터 지름과 그걸 감싸는 세그먼트 너비.
const HEADER_CIRCLE = 34;
const HEADER_SEG = HEADER_CIRCLE + Spacing.two;

interface Props {
  /** 선택 위치의 단일 출처(모드 인덱스 단위). 화면이 소유한다. */
  progress: SharedValue<number>;
  onChange: (m: GameMode) => void;
}

/**
 * 상단 세그먼트 스위치 — 글래스 트랙 위를 accent pill 이 슬라이드하고
 * 라벨 색이 위치에 따라 보간된다.
 */
export function ModeSegmentedControl({
  progress,
  onChange,
  onHeightChange,
}: Props & {
  /** 스크롤로 완전히 사라지는 지점 판정을 위해 화면이 높이를 알아야 한다. */
  onHeightChange: (height: number) => void;
}) {
  const { colors } = useTheme();
  const translate = useTranslation(MODE_LABELS);
  // 측정한 트랙 너비를 모드 수로 나눠 선택 인덱스로 translateX 한다.
  const trackWidth = useSharedValue(0);

  // width는 정적 퍼센트(styles.thumb)로 고정하고 여기선 슬라이드만.
  // 헤더 remount로 trackWidth가 0→측정값으로 튀어도 pill 너비는 항상 1/MODES라
  // width 제약이 사라져 트랙 전체로 늘어나는 현상이 없다.
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * (trackWidth.value / GAME_MODES.length) },
    ],
  }));

  return (
    <View
      style={styles.switchWrap}
      onLayout={(e) => onHeightChange(e.nativeEvent.layout.height)}
    >
      <GlassSurface
        glassStyle="regular"
        style={[styles.switchTrack, { borderColor: colors.border.default }]}
      >
        <View
          style={styles.switchInner}
          onLayout={(e) => {
            trackWidth.value = e.nativeEvent.layout.width;
          }}
        >
          {/* 움직이는 pill 은 네이티브 글래스가 아니라 단색이다. GlassView 를
              translate 하면 매 프레임 배경에 대해 굴절을 다시 계산해 눈에 띄게
              끊긴다(트랙 자체는 정지해 있으므로 글래스 유지). 어차피 위에
              accent.subtle 을 덮고 있어 글래스가 보이지도 않았다. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              { backgroundColor: colors.accent.subtle },
              thumbStyle,
            ]}
          />
          {GAME_MODES.map((m, i) => (
            <Pressable
              key={m}
              onPress={() => onChange(m)}
              style={styles.switchSegment}
            >
              <ModeLabel
                progress={progress}
                index={i}
                activeColor={colors.accent.default}
                idleColor={colors.text.secondary}
              >
                {translate(m)}
              </ModeLabel>
            </Pressable>
          ))}
        </View>
      </GlassSurface>
    </View>
  );
}

/**
 * 헤더 우측 컴팩트 모드 토글 — 상단 세그먼트 스위치가 스크롤로 사라졌을 때만
 * 렌더된다. 라벨 없이 아이콘만 두고, 원형 글래스가 활성 아이콘 뒤로 슬라이드하며
 * 그 아이콘 색을 민트로 하이라이트한다.
 */
export function HeaderModeToggle({ progress, onChange }: Props) {
  const { colors } = useTheme();
  // 세그먼트 너비가 상수라 측정하지 않는다. onLayout 으로 재던 시절엔
  // 스크롤로 토글이 등장할 때 trackWidth 가 0인 첫 프레임에 원이 왼쪽으로
  // 튀었다가 제자리를 찾아, 그 점프가 전환 끊김처럼 보였다.
  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          progress.value * HEADER_SEG + (HEADER_SEG - HEADER_CIRCLE) / 2,
      },
    ],
  }));

  return (
    <Animated.View style={styles.headerToggle}>
      {/* 상단 세그먼트와 같은 이유로 단색. 여기는 네이티브 헤더(그 자체가 글래스)
          위라 글래스를 겹쳐 움직이면 더 심하게 끊겼다. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.headerCircle,
          {
            borderColor: colors.border.strong,
            backgroundColor: colors.glass.fill,
          },
          circleStyle,
        ]}
      />
      {GAME_MODES.map((m, i) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          style={styles.headerSegment}
          hitSlop={Spacing.two}
        >
          <ModeIcon
            progress={progress}
            index={i}
            name={MODE_ICONS[m]}
            activeColor={colors.accent.default}
            idleColor={colors.text.tertiary}
          />
        </Pressable>
      ))}
    </Animated.View>
  );
}

/**
 * 활성 강조 색 — progress 와의 거리로 보간한다. mode state 를 안 거치므로
 * 목록 커밋을 기다리지 않고 손가락을 떼는 즉시 물든다.
 */
function useSegmentColor(
  progress: SharedValue<number>,
  index: number,
  activeColor: string,
  idleColor: string,
) {
  return useAnimatedStyle(() => ({
    color: interpolateColor(
      Math.min(Math.abs(progress.value - index), 1),
      [0, 1],
      [activeColor, idleColor],
    ),
  }));
}

interface SegmentProps {
  progress: SharedValue<number>;
  index: number;
  activeColor: string;
  idleColor: string;
}

/** 굵기는 600(Typography.label) 고정 — 500↔700 을 오가면 전환마다 글자 폭이 바뀐다. */
function ModeLabel({
  progress,
  index,
  activeColor,
  idleColor,
  children,
}: SegmentProps & { children: React.ReactNode }) {
  const style = useSegmentColor(progress, index, activeColor, idleColor);
  return (
    <Animated.Text style={[styles.switchLabel, style]}>
      {children}
    </Animated.Text>
  );
}

const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

function ModeIcon({
  progress,
  index,
  name,
  activeColor,
  idleColor,
}: SegmentProps & { name: (typeof MODE_ICONS)[GameMode] }) {
  const style = useSegmentColor(progress, index, activeColor, idleColor);
  return <AnimatedIcon name={name} size={18} style={style} />;
}

const styles = StyleSheet.create({
  switchWrap: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  switchTrack: {
    width: "100%",
    padding: Spacing.one,
    borderRadius: Radius.full,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  switchInner: {
    flexDirection: "row",
    position: "relative",
  },
  // 슬라이딩 thumb — switchInner 안에서 절대배치, 높이 꽉 채움.
  // clear 글래스 pill이 활성 세그먼트 뒤로 슬라이드(텍스트만 민트로 강조).
  thumb: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    // 너비는 측정값(shared value) 대신 정적 퍼센트로 고정 — 헤더 remount 시
    // width 미확정 프레임이 없어 트랙 전체로 늘어나는 버그를 방지한다.
    width: `${100 / GAME_MODES.length}%`,
    borderRadius: Radius.full,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  switchSegment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.two,
  },
  switchLabel: Typography.label,
  // 헤더 우측 컴팩트 아이콘 토글 — 배경 컨테이너 없이 아이콘 + 슬라이드 원형 글래스.
  headerToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSegment: {
    width: HEADER_SEG,
    height: HEADER_CIRCLE,
    alignItems: "center",
    justifyContent: "center",
  },
  // 활성 아이콘 뒤로 슬라이드하는 원형 글래스.
  headerCircle: {
    position: "absolute",
    top: 0,
    left: 0,
    width: HEADER_CIRCLE,
    height: HEADER_CIRCLE,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
