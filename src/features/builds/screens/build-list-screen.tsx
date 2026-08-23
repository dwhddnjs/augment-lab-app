/**
 * BuildListScreen — 홈 탭. 저장된 드래프트 빌드 목록.
 * 같은 날짜끼리 묶어 날짜 태그 헤더 + 그 날짜 카드들을 SectionList로 렌더한다.
 * 반응형 스토어(useBuilds)를 구독해 드래프트 저장/삭제 직후 자동 갱신된다.
 * 화면 타이틀은 (home) 스택의 native large-title 헤더가 제공한다.
 */
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import { GlassSurface } from "@/components/ui/glass-surface";
import { GAME_MODES, MODE_ICONS, MODE_LABELS } from "@/constants/game-modes";
import { BottomTabInset, Radius, Spacing } from "@/constants/theme";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import {
  removeBuild,
  type GameMode,
  type SavedBuild,
} from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import { BuildCard } from "../components/build-card";
import { useBuilds } from "../hooks/use-builds";
import { formatDate, groupByDate, type BuildSection } from "../utils/date";

const t = {
  ko: {
    emptyTitle: "저장된 빌드가 없어요",
    emptyHint: "빌드를 완료하면 여기에 쌓여요",
    startBuild: "빌드 시작",
    deleteConfirm: "빌드를 삭제할까요?",
    deleteOk: "삭제",
    cancel: "취소",
    ...MODE_LABELS.ko,
  },
  en: {
    emptyTitle: "No saved builds",
    emptyHint: "Finish a build to see it here",
    startBuild: "Start Build",
    deleteConfirm: "Delete this build?",
    deleteOk: "Delete",
    cancel: "Cancel",
    ...MODE_LABELS.en,
  },
};

// 가로 화면에서 돌아오면 (home) 스택이 재생성되며 이 화면도 remount된다((home)/_layout).
// 보고 있던 목록 필터가 칼바람으로 튀지 않도록 모듈 스코프에 담아둔다.
let lastMode: GameMode = "aram";

export function BuildListScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<GameMode>(lastMode);
  useEffect(() => {
    lastMode = mode;
  }, [mode]);
  // null = 로딩 중 (깜빡임 없이 빈 상태와 구분). 반응형 스토어를 구독하므로
  // 다른 화면의 저장/삭제가 즉시 반영된다. 탭 전환은 클라이언트 필터로 처리.
  const allBuilds = useBuilds();
  const builds =
    allBuilds == null ? null : allBuilds.filter((b) => b.mode === mode);

  // 상단 세그먼트 스위치가 스크롤로 완전히 사라지면(y >= 스위치 높이) 헤더
  // 오른쪽에 컴팩트 모드 토글을 노출한다. 높이는 스위치 onLayout으로 측정.
  const [switchHeight, setSwitchHeight] = useState(0);
  const [showHeaderToggle, setShowHeaderToggle] = useState(false);
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShow = switchHeight > 0 && y >= switchHeight;
    setShowHeaderToggle((prev) => (prev === shouldShow ? prev : shouldShow));
  };

  // 세그먼트 스위치의 슬라이딩 thumb — 측정한 트랙 너비를 모드 수로 나눠
  // 선택 인덱스로 translateX 한다.
  const trackWidth = useSharedValue(0);
  const activeIndex = GAME_MODES.indexOf(mode);
  // 애니메이션은 shared value에 담고 useAnimatedStyle은 읽기만 한다.
  // withTiming을 useAnimatedStyle 안에서 부르면 Reanimated 4 + React Compiler
  // 조합에서 worklet이 새 값으로 다시 돌긴 해도(=위치는 바뀐다) 전환이 보간되지
  // 않고 그냥 순간이동한다. 시작점을 명시적으로 잡아 줘야 한다.
  //
  // 시작 시점은 press 가 아니라 **커밋 이후(useEffect)** 여야 한다.
  // 모드를 바꾸면 목록이 갈리는데 그 커밋이 실측 약 110ms 다(탭→첫 페인트).
  // press 에서 시작하면 그 110ms 가 애니메이션 시간에서 그냥 깎여, 목록이 비는
  // 아레나로 갈 때(커밋이 싸다)만 온전히 보이고 카드가 있는 모드로 갈 때는
  // 앞부분이 잘려 "한 칸 이동은 애니메이션이 없다"로 보인다.
  // 커밋 뒤에 걸면 어느 방향이든 280ms 가 통째로 보인다.
  const progress = useSharedValue(activeIndex);
  useEffect(() => {
    progress.value = withTiming(activeIndex, {
      // 한 칸(트랙의 1/3) 이동이 눈에 읽히는 하한. 200ms 로는 두 칸 이동만 보이고
      // 한 칸 이동은 순간이동처럼 느껴진다.
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeIndex, progress]);
  const changeMode = (next: GameMode) => {
    if (next !== mode) setMode(next);
  };
  // width는 정적 퍼센트(styles.thumb)로 고정하고 여기선 슬라이드만.
  // 헤더 remount로 trackWidth가 0→측정값으로 튀어도 pill 너비는 항상 1/MODES라
  // width 제약이 사라져 트랙 전체로 늘어나는 현상이 없다.
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * (trackWidth.value / GAME_MODES.length) },
    ],
  }));

  const modeTabs = (
    <View
      style={styles.switchWrap}
      onLayout={(e) => setSwitchHeight(e.nativeEvent.layout.height)}
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
          {GAME_MODES.map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => changeMode(m)}
                style={styles.switchSegment}
              >
                <ThemedText
                  type="label"
                  style={{
                    color: active
                      ? colors.accent.default
                      : colors.text.secondary,
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {translate(m)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );

  const handleDelete = (build: SavedBuild) => {
    Alert.alert(translate("deleteConfirm"), "", [
      { text: translate("cancel"), style: "cancel" },
      {
        text: translate("deleteOk"),
        style: "destructive",
        // 스토어가 즉시 emit → 구독 중인 목록이 바로 갱신된다(수동 상태 갱신 불필요).
        onPress: () => {
          removeBuild(build.id).catch(() => {});
        },
      },
    ]);
  };

  const handleStartBuild = () => {
    router.push({
      pathname: "/select-champion-modal",
      params: { mode },
    });
  };

  // 빈 상태도 SectionList 안(헤더 탭 아래)에 렌더해 탭을 상시 노출하고
  // native large-title 아래에 위치하도록 한다. 로딩 중(null)에는 깜빡임 방지로 숨김.
  const emptyState = (
    <View style={styles.empty}>
      <Pressable
        onPress={handleStartBuild}
        style={({ pressed }) => [
          styles.emptyCard,
          {
            borderColor: colors.border.default,
            backgroundColor: pressed ? colors.surface.sunken : "transparent",
          },
        ]}
      >
        <Feather name="plus-circle" size={32} color={colors.text.tertiary} />
        <ThemedText type="label" color="tertiary">
          {translate("startBuild")}
        </ThemedText>
      </Pressable>
      <ThemedText type="caption" color="tertiary" style={styles.emptyHint}>
        {translate("emptyHint")}
      </ThemedText>
    </View>
  );

  const sections = groupByDate(builds ?? [], locale);

  return (
    // Fragment로 감싸 large-title collapse를 유지한다(Stack.Screen은 렌더 없음).
    <>
      <Stack.Screen
        options={{
          // 스크롤로 상단 스위치가 사라졌을 때만 렌더. 네이티브 글래스 뷰는
          // 부모 opacity를 무시하므로 페이드 대신 조건부 렌더로 껐다 켠다
          // (layout 애니메이션은 exiting 잔상이 겹쳐 쓰지 않음).
          headerRight: () =>
            showHeaderToggle ? (
              <HeaderModeToggle
                mode={mode}
                colors={colors}
                progress={progress}
                onChange={changeMode}
              />
            ) : null,
        }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        // 헤더 바로 아래 루트 스크롤뷰여야 native large-title이
        // 스크롤에 맞춰 inline 타이틀로 collapse 된다 (래퍼 View로 감싸지 않음).
        style={{ flex: 1, backgroundColor: colors.surface.base }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={modeTabs}
        ListEmptyComponent={builds == null ? null : emptyState}
        ItemSeparatorComponent={ItemGap}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.dateTag,
                {
                  backgroundColor: colors.surface.raised,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <ThemedText type="label" color="secondary">
                {formatDate((section as BuildSection).title)}
              </ThemedText>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <BuildCard
            build={item}
            onPress={() =>
              router.push({ pathname: "/build/[id]", params: { id: item.id } })
            }
            onLongPress={() => handleDelete(item)}
          />
        )}
      />
    </>
  );
}

// 슬라이딩 원형 글래스 인디케이터 지름.
const HEADER_CIRCLE = 34;

/**
 * 헤더 우측 컴팩트 모드 토글 — 상단 세그먼트 스위치가 스크롤로 사라졌을 때만
 * 렌더된다. 왼쪽=칼바람(눈송이), 오른쪽=아레나(교차검). 라벨 없이 아이콘만 두고,
 * 원형 글래스가 활성 아이콘 뒤로 슬라이드하며 그 아이콘 색을 민트로 하이라이트한다.
 */
function HeaderModeToggle({
  mode,
  colors,
  progress,
  onChange,
}: {
  mode: GameMode;
  colors: ReturnType<typeof useTheme>["colors"];
  /** 상단 세그먼트와 공유하는 위치(모드 인덱스 단위). 화면이 소유한다. */
  progress: SharedValue<number>;
  onChange: (m: GameMode) => void;
}) {
  const trackWidth = useSharedValue(0);
  const circleStyle = useAnimatedStyle(() => {
    const seg = trackWidth.value / GAME_MODES.length;
    return {
      transform: [
        { translateX: progress.value * seg + (seg - HEADER_CIRCLE) / 2 },
      ],
    };
  });

  return (
    <Animated.View
      style={styles.headerToggle}
      onLayout={(e) => {
        trackWidth.value = e.nativeEvent.layout.width;
      }}
    >
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
      {GAME_MODES.map((m) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={styles.headerSegment}
            hitSlop={Spacing.two}
          >
            <MaterialCommunityIcons
              name={MODE_ICONS[m]}
              size={18}
              color={active ? colors.accent.default : colors.text.tertiary}
            />
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

/** 같은 날짜 섹션 안 카드 사이 간격. */
function ItemGap() {
  return <View style={styles.itemGap} />;
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
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  sectionHeader: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    // borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  dateTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.double,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemGap: {
    height: Spacing.three,
  },
  // 상단 세그먼트 아래에 자연스럽게 붙도록 flex 중앙정렬 대신 상단 여백만.
  empty: {
    alignItems: "center",
    gap: Spacing.three,
    paddingTop: Spacing.four,
  },
  // 점선 플레이스홀더 카드 — 전체가 눌리는 CTA.
  emptyCard: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  emptyHint: {
    textAlign: "center",
  },
  // 헤더 우측 컴팩트 아이콘 토글 — 배경 컨테이너 없이 아이콘 + 슬라이드 원형 글래스.
  headerToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSegment: {
    width: HEADER_CIRCLE + Spacing.two,
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
