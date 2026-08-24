/**
 * BuildListScreen — 홈 탭. 저장된 드래프트 빌드 목록.
 * 같은 날짜끼리 묶어 날짜 태그 헤더 + 그 날짜 카드들을 SectionList로 렌더한다.
 * 반응형 스토어(useBuilds)를 구독해 드래프트 저장/삭제 직후 자동 갱신된다.
 * 화면 타이틀은 (home) 스택의 native large-title 헤더가 제공한다.
 *
 * 모드 전환 컨트롤(상단 세그먼트 · 헤더 토글)은 components/mode-switch 에 있다.
 */
import Feather from "@expo/vector-icons/Feather";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Easing, runOnJS, useSharedValue, withTiming } from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import { GAME_MODES } from "@/constants/game-modes";
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
import {
  HeaderModeToggle,
  ModeSegmentedControl,
} from "../components/mode-switch";
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
  },
  en: {
    emptyTitle: "No saved builds",
    emptyHint: "Finish a build to see it here",
    startBuild: "Start Build",
    deleteConfirm: "Delete this build?",
    deleteOk: "Delete",
    cancel: "Cancel",
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

  // 선택 위치의 단일 출처. 눌린 즉시 UI 스레드에서 보간되고, pill 위치뿐 아니라
  // 라벨/아이콘 색까지 전부 여기서 파생한다 — 이동에도 강조에도 React 커밋이
  // 끼어들지 않는다.
  //
  // 목록 필터(setMode)는 애니메이션이 **끝난 뒤**에 건다. 모드를 바꾸면
  // SectionList 셀이 통째로 갈리는데(챔피언 스플래시 이미지 포함) 그 커밋이
  // UI 스레드를 잡아 이동 중 프레임을 먹었다 — 이게 "뚝뚝 끊긴다"의 정체다.
  // 커밋을 애니메이션 밖으로 밀어내면 pill 은 끝까지 부드럽고, 목록은 이동이
  // 끝난 자리에서 교체된다.
  const progress = useSharedValue(GAME_MODES.indexOf(lastMode));
  // mode 는 260ms 뒤에 따라오므로, 연타 판정은 이 즉시값으로 한다.
  const selected = useRef(lastMode);
  const changeMode = (next: GameMode) => {
    if (selected.current === next) return;
    selected.current = next;
    progress.value = withTiming(
      GAME_MODES.indexOf(next),
      // 한 칸(트랙의 1/3) 이동이 눈에 읽히는 하한. 200ms 로는 두 칸 이동만 보이고
      // 한 칸 이동은 순간이동처럼 느껴진다.
      { duration: 260, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setMode)(next);
      },
    );
  };

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
              <HeaderModeToggle progress={progress} onChange={changeMode} />
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
        ListHeaderComponent={
          <ModeSegmentedControl
            progress={progress}
            onChange={changeMode}
            onHeightChange={setSwitchHeight}
          />
        }
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

/** 같은 날짜 섹션 안 카드 사이 간격. */
function ItemGap() {
  return <View style={styles.itemGap} />;
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  sectionHeader: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
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
});
