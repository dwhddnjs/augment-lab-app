/**
 * ChampionSelectGrid — 챔피언 선택 화면의 공용 본문.
 * 역할 필터칩(리스트 헤더) + 챔피언 그리드 + 아레나 "용기" 셀.
 * 아이콘은 champion-select-icons.{ios,android}.tsx 로 플랫폼 자동 분기.
 */
import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { GlassSurface } from "@/components/ui/glass-surface";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { championClassIconUrl, championSquareUrl } from "@/lib/ddragon";
import { CHAMPION_TAGS, useTranslation } from "@/lib/i18n";
import { BRAVERY_ID, type GridItem } from "../hooks/use-champion-select";
import type { Champion } from "../types";
import { BraveryMark, FilterAllIcon } from "./champion-select-icons";

const t = {
  ko: { bravery: "용기" },
  en: { bravery: "Bravery" },
};

type Props = {
  listData: GridItem[];
  selectedId: string | null;
  selectedTag: string | null;
  onSelect: (id: string) => void;
  /** null이면 필터 해제(전체 칩) */
  onTagPress: (tag: string | null) => void;
  onScrollBeginDrag?: () => void;
};

export function ChampionSelectGrid({
  listData,
  selectedId,
  selectedTag,
  onSelect,
  onTagPress,
  onScrollBeginDrag,
}: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t);

  // 역할 필터칩 — 리스트 헤더로서 리스트와 함께 스크롤된다.
  const filterChips = (
    <ThemedView style={styles.filterRow}>
      <Pressable
        onPress={() => onTagPress(null)}
        style={[
          styles.filterChip,
          {
            backgroundColor:
              selectedTag === null ? colors.accent.subtle : "transparent",
          },
        ]}
      >
        <FilterAllIcon
          color={
            selectedTag === null ? colors.accent.default : colors.text.secondary
          }
        />
      </Pressable>

      {CHAMPION_TAGS.map((tag) => {
        const isActive = selectedTag === tag;
        const iconUrl = championClassIconUrl(tag);
        return (
          <Pressable
            key={tag}
            onPress={() => onTagPress(tag)}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive
                  ? colors.accent.subtle
                  : "transparent",
              },
            ]}
          >
            {iconUrl ? (
              <Image
                source={{ uri: iconUrl }}
                style={styles.chipIcon}
                tintColor={
                  isActive ? colors.accent.default : colors.text.secondary
                }
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            ) : (
              <ThemedText
                type="label"
                color={isActive ? "accent" : "secondary"}
              >
                {tag}
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </ThemedView>
  );

  return (
    /* 화면 루트 스크롤뷰여야 native large title collapse 가 동작한다.
       flex View 로 감싸면 헤더 inset 연동이 깨지므로 FlatList 를 직접 루트에 둔다.
       필터는 리스트 헤더로 함께 스크롤된다(고정 안 함). */
    <FlatList
      data={listData}
      numColumns={4}
      keyExtractor={(c) => c.id}
      style={{ flex: 1, backgroundColor: colors.surface.base }}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.gridRow}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      ListHeaderComponent={filterChips}
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={onScrollBeginDrag}
      renderItem={({ item }) => {
        const isSelected = selectedId === item.id;
        // 아레나 "용기" 박스 — 검정 정사각 위에 원형 글래스 + 민트 발광 물음표.
        if (item.id === BRAVERY_ID) {
          return (
            <Pressable
              onPress={() => onSelect(BRAVERY_ID)}
              style={styles.cell}
            >
              <View
                style={[
                  styles.image,
                  styles.braveryBox,
                  {
                    borderWidth: isSelected ? 2.5 : 1.5,
                    borderColor: isSelected
                      ? colors.accent.default
                      : colors.border.default,
                    backgroundColor: colors.surface.sunken,
                  },
                ]}
              >
                <GlassSurface glassStyle="regular" style={styles.braveryOrb} />
                <BraveryMark color={colors.accent.pressed} />
              </View>
              <ThemedText
                type="label"
                numberOfLines={1}
                color={isSelected ? "accent" : "secondary"}
              >
                {translate("bravery")}
              </ThemedText>
            </Pressable>
          );
        }
        const champion = item as Champion;
        return (
          <Pressable
            onPress={() => onSelect(champion.id)}
            style={styles.cell}
          >
            <RemoteImage
              uri={championSquareUrl(champion.imageKey)}
              recyclingKey={champion.id}
              style={[
                styles.image,
                {
                  borderWidth: isSelected ? 2.5 : 1.5,
                  borderColor: isSelected
                    ? colors.accent.default
                    : colors.border.default,
                },
              ]}
              contentFit="cover"
            />
            <ThemedText
              type="label"
              numberOfLines={1}
              color={isSelected ? "accent" : "secondary"}
            >
              {champion.name}
            </ThemedText>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingVertical: Spacing.two,
  },
  filterChip: {
    padding: 6,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  chipIcon: {
    width: 24,
    height: 24,
  },
  grid: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  gridRow: {
    justifyContent: "flex-start",
    paddingHorizontal: Spacing.three + Spacing.one,
  },
  cell: {
    width: "25%",
    alignItems: "center",
    gap: Spacing.one,
    padding: Spacing.one,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  braveryBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  // 검정 박스에 꽉 차는 글래스 원 — 배경으로 깔고, 물음표는 박스 flex center로 그 위 중앙.
  braveryOrb: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.full,
  },
});
