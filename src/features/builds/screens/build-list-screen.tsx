/**
 * BuildListScreen — 홈 탭. 저장된 드래프트 빌드 목록.
 * 같은 날짜끼리 묶어 날짜 태그 헤더 + 그 날짜 카드들을 SectionList로 렌더한다.
 * 탭 포커스마다 재조회해 드래프트 저장/삭제 직후 자동 갱신된다.
 * 화면 타이틀은 (home) 스택의 native large-title 헤더가 제공한다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, SectionList, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import { BottomTabInset, Elevation, Radius, Spacing } from "@/constants/theme";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import {
  listBuilds,
  removeBuild,
  type GameMode,
  type SavedBuild,
} from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import { BuildCard } from "../components/build-card";
import { formatDate, groupByDate, type BuildSection } from "../utils/date";

const t = {
  ko: {
    emptyTitle: "저장된 빌드가 없어요",
    emptyHint: "드래프트를 완료하면 여기에 쌓여요",
    startDraft: "드래프트 시작",
    deleteConfirm: "빌드를 삭제할까요?",
    deleteOk: "삭제",
    cancel: "취소",
    aram: "칼바람",
    arena: "아레나",
  },
  en: {
    emptyTitle: "No saved builds",
    emptyHint: "Finish a draft to see it here",
    startDraft: "Start Draft",
    deleteConfirm: "Delete this build?",
    deleteOk: "Delete",
    cancel: "Cancel",
    aram: "ARAM",
    arena: "Arena",
  },
};

const MODES: GameMode[] = ["aram", "arena"];

export function BuildListScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<GameMode>("aram");
  // null = 로딩 중 (깜빡임 없이 빈 상태와 구분). 두 모드 전체를 한 번에 받아
  // 탭 전환은 재조회 없이 클라이언트 필터로 처리한다.
  const [allBuilds, setAllBuilds] = useState<SavedBuild[] | null>(null);
  const builds =
    allBuilds == null ? null : allBuilds.filter((b) => b.mode === mode);

  // 세그먼트 스위치의 슬라이딩 thumb — 측정한 트랙 너비를 절반으로 나눠
  // 선택 인덱스로 translateX 한다(spring).
  const trackWidth = useSharedValue(0);
  const activeIndex = MODES.indexOf(mode);
  const thumbStyle = useAnimatedStyle(() => {
    const seg = trackWidth.value / MODES.length;
    return {
      width: seg,
      transform: [
        {
          translateX: withTiming(activeIndex * seg, {
            duration: 200,
            easing: Easing.out(Easing.cubic),
          }),
        },
      ],
    };
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listBuilds()
        .then((b) => {
          if (active) setAllBuilds(b);
        })
        .catch(() => {
          if (active) setAllBuilds([]);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const modeTabs = (
    <View style={styles.switchWrap}>
      <View
        style={[
          styles.switchTrack,
          {
            backgroundColor: colors.surface.sunken,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <View
          style={styles.switchInner}
          onLayout={(e) => {
            trackWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              { backgroundColor: colors.surface.raised },
              thumbStyle,
            ]}
          />
          {MODES.map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => {
                  if (m !== mode) setMode(m);
                }}
                style={styles.switchSegment}
              >
                <ThemedText
                  type="label"
                  style={{
                    color: active ? colors.text.primary : colors.text.secondary,
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {translate(m)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  const handleDelete = (build: SavedBuild) => {
    Alert.alert(translate("deleteConfirm"), "", [
      { text: translate("cancel"), style: "cancel" },
      {
        text: translate("deleteOk"),
        style: "destructive",
        onPress: () => {
          removeBuild(build.id).catch(() => {});
          setAllBuilds((prev) => prev?.filter((b) => b.id !== build.id) ?? prev);
        },
      },
    ]);
  };

  const handleStartDraft = () => {
    router.push({
      pathname: "/select-champion-modal",
      params: { mode },
    });
  };

  // 빈 상태도 SectionList 안(헤더 탭 아래)에 렌더해 탭을 상시 노출하고
  // native large-title 아래에 위치하도록 한다. 로딩 중(null)에는 깜빡임 방지로 숨김.
  const emptyState = (
    <View style={styles.empty}>
      <MaterialCommunityIcons
        name="cards-outline"
        size={56}
        color={colors.text.disabled}
      />
      <ThemedText type="body" color="secondary">
        {translate("emptyTitle")}
      </ThemedText>
      <ThemedText type="caption" color="tertiary">
        {translate("emptyHint")}
      </ThemedText>
      <Pressable
        onPress={handleStartDraft}
        style={({ pressed }) => [
          styles.startButton,
          {
            backgroundColor: pressed
              ? colors.accent.pressed
              : colors.accent.default,
          },
        ]}
      >
        <ThemedText type="label" style={{ color: colors.accent.onAccent }}>
          {translate("startDraft")}
        </ThemedText>
      </Pressable>
    </View>
  );

  const sections = groupByDate(builds ?? [], locale);

  return (
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
    padding: Spacing.half,
    borderRadius: Radius.full,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  switchInner: {
    flexDirection: "row",
    position: "relative",
  },
  // 슬라이딩 thumb — switchInner 안에서 절대배치, 높이 꽉 채움.
  // iOS 세그먼트 컨트롤처럼 흰(raised) pill + 부드러운 그림자.
  thumb: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: Radius.full,
    borderCurve: "continuous",
    ...Elevation.level2,
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
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingBottom: BottomTabInset,
  },
  startButton: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.double,
    borderRadius: Radius.full,
  },
});
