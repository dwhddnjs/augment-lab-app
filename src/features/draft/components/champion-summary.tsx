import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Champion } from "@/features/champions/types";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl } from "@/lib/ddragon";
import { CHAMPION_TAG_LABELS, useTranslation } from "@/lib/i18n";

const t = {
  ko: {
    hp: "체력",
    ad: "공격력",
    armor: "방어력",
    mr: "마저",
    ms: "이속",
    ...CHAMPION_TAG_LABELS.ko,
  },
  en: {
    hp: "HP",
    ad: "AD",
    armor: "Armor",
    mr: "MR",
    ms: "MS",
    ...CHAMPION_TAG_LABELS.en,
  },
};

interface Props {
  champion: Champion;
}

/** 챔피언 아이콘/이름/타입 + 핵심 스탯 칩(체력·공격력·방어력·마저·이속). */
export function ChampionSummary({ champion }: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t) as (key: string) => string;

  const stats: { key: string; value: number }[] = [
    { key: "hp", value: Math.round(champion.stats.hp) },
    { key: "ad", value: Math.round(champion.stats.attackdamage) },
    { key: "armor", value: Math.round(champion.stats.armor) },
    { key: "mr", value: Math.round(champion.stats.spellblock) },
    { key: "ms", value: Math.round(champion.stats.movespeed) },
  ];

  return (
    <View style={styles.champBlock}>
      <View style={styles.champHeader}>
        <Image
          source={{ uri: championSquareUrl(champion.imageKey) }}
          style={[styles.champIcon, { borderColor: colors.accent.default }]}
          contentFit="cover"
        />
        <View style={styles.champMeta}>
          <ThemedText type="heading" numberOfLines={1}>
            {champion.name}
          </ThemedText>
          <View style={styles.tagRow}>
            {champion.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tagChip, { backgroundColor: colors.accent.subtle }]}
              >
                <ThemedText type="caption" style={{ color: colors.accent.default }}>
                  {translate(tag)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.statRow}>
        {stats.map((s) => (
          <View
            key={s.key}
            style={[
              styles.statChip,
              {
                backgroundColor: colors.surface.raised,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <ThemedText type="caption" color="tertiary">
              {translate(s.key)}
            </ThemedText>
            <ThemedText type="label">{s.value}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  champBlock: {
    gap: Spacing.three,
  },
  champHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  champIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  champMeta: {
    flex: 1,
    gap: Spacing.one,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
  },
  tagChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  statChip: {
    minWidth: 56,
    alignItems: "center",
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
