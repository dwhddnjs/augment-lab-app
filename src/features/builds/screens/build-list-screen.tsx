/**
 * BuildListScreen — 내 빌드(홈 "전체 보기"). 저장된 빌드 2열 그리드 + 네이티브 세그먼트 필터.
 * 반응형 스토어(useBuilds)를 구독해 드래프트 저장/삭제 직후 자동 갱신된다.
 * 화면 타이틀은 (home) 스택의 native large-title 헤더가 제공한다.
 */
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, useWindowDimensions } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useAugments } from "@/features/augments/hooks/use-augments";
import { useTheme } from "@/hooks/use-theme";
import type { SavedBuild } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import { BuildCard } from "../components/build-card";
import { BuildFilterBar, type BuildFilter } from "../components/build-filter-bar";
import { useBuilds } from "../hooks/use-builds";
import { useConfirmDelete } from "../hooks/use-confirm-delete";
import { isWithinWeek } from "../utils/date";

const t = {
  ko: {
    emptyHint: "빌드를 완료하면 여기에 쌓여요",
    noMatch: "조건에 맞는 빌드가 없어요",
  },
  en: {
    emptyHint: "Finish a build to see it here",
    noMatch: "No builds match this filter",
  },
};

const GRID_GAP = Spacing.double;

export function BuildListScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const confirmDelete = useConfirmDelete();
  // null = 로딩 중 (깜빡임 없이 빈 상태와 구분).
  const builds = useBuilds();
  const augments = useAugments();
  const [filter, setFilter] = useState<BuildFilter>("all");

  const cardWidth = (width - Spacing.three * 2 - GRID_GAP) / 2;

  const prismaticIds = new Set(
    augments.filter((a) => a.rarity === "prismatic").map((a) => a.id),
  );
  const matches: Record<BuildFilter, (b: SavedBuild) => boolean> = {
    all: () => true,
    week: (b) => isWithinWeek(b.createdAt),
    prismatic: (b) => b.augmentIds.some((id) => prismaticIds.has(id)),
    custom: (b) => b.custom === true,
  };
  const all = builds ?? [];
  const shown = all.filter(matches[filter]);

  return (
    <FlatList
      data={shown}
      keyExtractor={(item) => item.id}
      numColumns={2}
      // 헤더 바로 아래 루트 스크롤뷰여야 native large-title 이
      // 스크롤에 맞춰 inline 타이틀로 collapse 된다 (래퍼 View로 감싸지 않음).
      style={{ flex: 1, backgroundColor: colors.surface.base }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        all.length > 0 ? <BuildFilterBar value={filter} onChange={setFilter} /> : null
      }
      // 로딩 중(null)에는 깜빡임 방지로 숨김.
      ListEmptyComponent={
        builds == null ? null : (
          <ThemedText type="caption" color="tertiary" style={styles.emptyHint}>
            {translate(all.length === 0 ? "emptyHint" : "noMatch")}
          </ThemedText>
        )
      }
      renderItem={({ item }) => (
        <BuildCard
          build={item}
          width={cardWidth}
          onPress={() =>
            router.push({ pathname: "/build/[id]", params: { id: item.id } })
          }
          onLongPress={() => confirmDelete(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    gap: GRID_GAP,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  row: {
    gap: GRID_GAP,
  },
  emptyHint: {
    textAlign: "center",
    paddingTop: Spacing.four,
  },
});
