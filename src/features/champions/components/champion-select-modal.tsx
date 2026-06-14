import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import type { SearchBarCommands } from "react-native-screens";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { championClassIconUrl, championSquareUrl } from "@/lib/ddragon";
import { matchChampionName } from "@/lib/hangul";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: {
    title: "챔피언 선택",
    searchPlaceholder: "챔피언 검색 (초성 가능)",
    start: "시작하기",
    cancel: "취소",
  },
  en: {
    title: "Select Champion",
    searchPlaceholder: "Search champions",
    start: "Start",
    cancel: "Cancel",
  },
};

const TAGS = [
  "Fighter",
  "Assassin",
  "Mage",
  "Tank",
  "Marksman",
  "Support",
] as const;

export function ChampionSelectModal() {
  const champions = useChampions();
  const { colors } = useTheme();
  const translate = useTranslation(t);
  const { locale } = useLocale();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const searchRef = useRef<SearchBarCommands>(null);

  const filtered = champions
    .filter((c) => !selectedTag || c.tags.includes(selectedTag))
    .filter((c) => matchChampionName(c.name, query))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  const handleSelect = (id: string) => {
    setSelectedId((curr) => (curr === id ? null : id));
  };

  const handleTagPress = (tag: string) => {
    setSelectedTag((curr) => (curr === tag ? null : tag));
  };

  const handleStart = async () => {
    if (!selectedId) return;
    // lockAsync를 await해서 기기가 landscape로 전환된 후 navigation을 시작한다.
    // await 없이 바로 replace하면 portrait 상태로 draft가 mount될 수 있다.
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    router.replace({ pathname: '/draft', params: { championId: selectedId } });
  };

  // 역할 필터칩 — 리스트 헤더로서 리스트와 함께 스크롤된다.
  const filterChips = (
    <ThemedView style={styles.filterRow}>
      <Pressable
        onPress={() => setSelectedTag(null)}
        style={[
          styles.filterChip,
          {
            backgroundColor:
              selectedTag === null ? colors.accent.subtle : "transparent",
          },
        ]}
      >
        <Image
          source="sf:square.grid.2x2.fill"
          style={styles.chipIcon}
          tintColor={
            selectedTag === null ? colors.accent.default : colors.text.secondary
          }
        />
      </Pressable>

      {TAGS.map((tag) => {
        const isActive = selectedTag === tag;
        const iconUrl = championClassIconUrl(tag);
        return (
          <Pressable
            key={tag}
            onPress={() => handleTagPress(tag)}
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
              />
            ) : (
              <ThemedText type="label" color={isActive ? "accent" : "secondary"}>
                {tag}
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </ThemedView>
  );

  return (
    <>
      {/* native 헤더 — large title + iOS 네이티브 검색바 + 닫기/시작 버튼 */}
      <Stack.Screen
        options={{
          title: translate("title"),
          headerLargeTitle: true,
          headerLargeTitleStyle: { fontSize: 28 },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Image
                source="sf:xmark"
                style={styles.headerBtnIcon}
                tintColor={colors.text.secondary}
              />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleStart}
              disabled={!selectedId}
              hitSlop={12}
              style={{ opacity: selectedId ? 1 : 0.4 }}
            >
              <Image
                source="sf:checkmark"
                style={styles.headerBtnIcon}
                tintColor={
                  selectedId ? colors.accent.default : colors.text.disabled
                }
              />
            </Pressable>
          ),
          headerSearchBarOptions: {
            ref: searchRef,
            placeholder: translate("searchPlaceholder"),
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            hideWhenScrolling: true,
            // focus 시에도 헤더(취소·선택 버튼)를 유지한다
            hideNavigationBar: false,
            textColor: colors.text.primary,
            tintColor: colors.accent.default,
          },
        }}
      />

      {/* Champion grid — 화면 루트 스크롤뷰여야 native large title collapse 가 동작한다.
          flex View 로 감싸면 헤더 inset 연동이 깨지므로 FlatList 를 직접 루트에 둔다.
          필터는 리스트 헤더로 함께 스크롤된다(고정 안 함). */}
      <FlatList
        data={filtered}
        numColumns={4}
        keyExtractor={(c) => c.id}
        style={{ flex: 1, backgroundColor: colors.surface.base }}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={filterChips}
        keyboardShouldPersistTaps="handled"
        // 검색 active(취소버튼) 상태로 스크롤하면 inline 타이틀이 안 뜨므로,
        // 스크롤 시작 시 검색을 종료해 일반 large title 모드로 되돌린다.
        onScrollBeginDrag={() => searchRef.current?.cancelSearch()}
        renderItem={({ item }) => {
          const isSelected = selectedId === item.id;
          return (
            <Pressable onPress={() => handleSelect(item.id)} style={styles.cell}>
              <Image
                source={{ uri: championSquareUrl(item.imageKey) }}
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
                {item.name}
              </ThemedText>
            </Pressable>
          );
        }}
      />
    </>
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
  headerBtnIcon: {
    width: 22,
    height: 22,
  },
});
