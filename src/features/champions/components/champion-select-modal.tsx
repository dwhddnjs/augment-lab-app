import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
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
  },
  en: {
    title: "Select Champion",
    searchPlaceholder: "Search champions",
    start: "Start",
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

  const handleStart = () => {
    router.navigate("/");
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Grabber */}
        <View style={styles.grabberContainer}>
          <View
            style={[styles.grabber, { backgroundColor: colors.border.default }]}
          />
        </View>

        <ThemedText type="heading">{translate("title")}</ThemedText>

        {/* Search bar */}
        <View
          style={[styles.searchBar, { backgroundColor: colors.surface.raised }]}
        >
          <Image
            source="sf:magnifyingglass"
            style={styles.searchIcon}
            tintColor={colors.text.secondary}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={translate("searchPlaceholder")}
            placeholderTextColor={colors.text.tertiary}
            style={[styles.searchInput, { color: colors.text.primary }]}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>

        {/* Role filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            onPress={() => setSelectedTag(null)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedTag === null
                    ? colors.accent.default
                    : colors.surface.raised,
              },
            ]}
          >
            <Image
              source="sf:square.grid.2x2.fill"
              style={styles.chipIcon}
              tintColor={
                selectedTag === null
                  ? colors.accent.onAccent
                  : colors.text.secondary
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
                      ? colors.accent.default
                      : colors.surface.raised,
                  },
                ]}
              >
                {iconUrl ? (
                  <Image
                    source={{ uri: iconUrl }}
                    style={styles.chipIcon}
                    tintColor={
                      isActive ? colors.accent.onAccent : colors.text.secondary
                    }
                    contentFit="contain"
                  />
                ) : (
                  <ThemedText
                    type="label"
                    color={isActive ? "onAccent" : "secondary"}
                  >
                    {tag}
                  </ThemedText>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Champion grid */}
        <FlatList
          data={filtered}
          numColumns={4}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.grid}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item }) => {
            const isSelected = selectedId === item.id;
            return (
              <Pressable
                onPress={() => handleSelect(item.id)}
                style={styles.cell}
              >
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
            style={{ fontWeight: "600", color: colors.accent.onAccent }}
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
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  grabberContainer: {
    alignItems: "center",
    paddingBottom: Spacing.one,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: Radius.full,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
    height: 44,
  },
  searchIcon: {
    width: 18,
    height: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  filterRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  filterChip: {
    width: 44,
    height: 44,
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
  cell: {
    flex: 1,
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
  startButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.xl,
    alignItems: "center",
  },
});
