import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  // 역할 필터칩 — large title + native 검색바 아래, 그리드와 함께 스크롤된다.
  const filterChips = (
    <View style={styles.filterRow}>
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
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* native 모달 헤더 — large title + iOS 네이티브 검색바 + 취소 버튼 */}
      <Stack.Screen
        options={{
          title: translate("title"),
          headerLargeTitle: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <ThemedText type="body" style={{ color: colors.accent.default }}>
                {translate("cancel")}
              </ThemedText>
            </Pressable>
          ),
          headerSearchBarOptions: {
            placeholder: translate("searchPlaceholder"),
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            hideWhenScrolling: false,
            textColor: colors.text.primary,
            tintColor: colors.accent.default,
          },
        }}
      />

      {/* Champion grid */}
      <FlatList
        data={filtered}
        numColumns={4}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={filterChips}
        keyboardDismissMode="on-drag"
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

      {/* Start button */}
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Pressable
          onPress={handleStart}
          disabled={!selectedId}
          style={[
            styles.startButton,
            {
              backgroundColor: colors.accent.default,
              opacity: selectedId ? 1 : 0.4,
            },
          ]}
        >
          <ThemedText
            type="body"
            style={{ fontWeight: "800", color: colors.accent.onAccent }}
          >
            {translate("start")}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  filterChip: {
    // width: 44,
    // height: 44,
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
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingBottom: Spacing.three,
  },
  gridRow: {
    justifyContent: "flex-start",
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
  footer: {
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.two,
  },
  startButton: {
    paddingVertical: Spacing.double,
    borderRadius: Radius.xl,
    alignItems: "center",
  },
});
