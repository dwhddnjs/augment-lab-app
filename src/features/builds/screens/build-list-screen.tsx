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

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { BottomTabInset, Radius, Spacing } from "@/constants/theme";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { listBuilds, removeBuild, type SavedBuild } from "@/lib/build-storage";
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
  },
  en: {
    emptyTitle: "No saved builds",
    emptyHint: "Finish a draft to see it here",
    startDraft: "Start Draft",
    deleteConfirm: "Delete this build?",
    deleteOk: "Delete",
    cancel: "Cancel",
  },
};

export function BuildListScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  // null = 로딩 중 (깜빡임 없이 빈 상태와 구분)
  const [builds, setBuilds] = useState<SavedBuild[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listBuilds()
        .then((b) => {
          if (active) setBuilds(b);
        })
        .catch(() => {
          if (active) setBuilds([]);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const handleDelete = (build: SavedBuild) => {
    Alert.alert(translate("deleteConfirm"), "", [
      { text: translate("cancel"), style: "cancel" },
      {
        text: translate("deleteOk"),
        style: "destructive",
        onPress: () => {
          removeBuild(build.id).catch(() => {});
          setBuilds((prev) => prev?.filter((b) => b.id !== build.id) ?? prev);
        },
      },
    ]);
  };

  const handleStartDraft = () => {
    router.push("/select-champion-modal");
  };

  if (builds != null && builds.length === 0) {
    return (
      <ThemedView style={styles.container}>
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
      </ThemedView>
    );
  }

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
  container: {
    flex: 1,
  },
  listContent: {
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
