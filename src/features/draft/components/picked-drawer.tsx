import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentRarityColors, Radius, Spacing } from "@/constants/theme";
import { useSynergies } from "@/features/augments/hooks/use-synergies";
import type { Augment } from "@/features/augments/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import type { Champion } from "@/features/champions/types";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { AugmentIcon } from "./augment-icon";
import { SynergyIcon } from "./synergy-icon";

const t = {
  ko: {
    title: "내 빌드",
    augments: "증강",
    synergy: "시너지",
    hp: "체력",
    ad: "공격력",
    armor: "방어력",
    mr: "마저",
    ms: "이속",
    Fighter: "전사",
    Mage: "마법사",
    Assassin: "암살자",
    Tank: "탱커",
    Marksman: "원거리",
    Support: "서포터",
  },
  en: {
    title: "My Build",
    augments: "Augments",
    synergy: "Synergies",
    hp: "HP",
    ad: "AD",
    armor: "Armor",
    mr: "MR",
    ms: "MS",
    Fighter: "Fighter",
    Mage: "Mage",
    Assassin: "Assassin",
    Tank: "Tank",
    Marksman: "Marksman",
    Support: "Support",
  },
};

// MaterialCommunityIcons glyphs for the augment rarity fallback (cross-platform).
const RARITY_SF: Record<string, string> = {
  silver: "shield",
  gold: "star",
  prismatic: "shimmer",
};

// UI shows 5 slots; the draft logic itself still resolves in 4 picks.
const BASE_SLOTS = 5;

type Translate = (key: string) => string;

interface AugmentCellProps {
  augment: Augment | null;
  size: number;
}

function AugmentCell({ augment, size }: AugmentCellProps) {
  const { colors } = useTheme();

  if (!augment) {
    return (
      <View
        style={[
          styles.emptyCell,
          {
            width: size,
            height: size,
            borderColor: colors.border.subtle,
            backgroundColor: colors.surface.sunken,
          },
        ]}
      />
    );
  }

  const tint = AugmentRarityColors[augment.rarity].border;

  return (
    <View style={[styles.cell, { width: size }]}>
      <View
        style={[
          styles.iconWrapper,
          {
            width: size,
            height: size,
            backgroundColor: colors.surface.sunken,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <AugmentIcon
          key={augment.id}
          iconPath={augment.iconPath}
          size={Math.round(size * 0.66)}
          tint={tint}
          fallbackSymbol={RARITY_SF[augment.rarity] ?? "star-four-points"}
          recyclingKey={augment.id}
        />
      </View>
      <ThemedText
        numberOfLines={2}
        ellipsizeMode="tail"
        color="secondary"
        style={[styles.cellName, { width: size }]}
      >
        {augment.name}
      </ThemedText>
    </View>
  );
}

interface ChampionSummaryProps {
  champion: Champion;
  translate: Translate;
}

function ChampionSummary({ champion, translate }: ChampionSummaryProps) {
  const { colors } = useTheme();

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
                style={[
                  styles.tagChip,
                  { backgroundColor: colors.accent.subtle },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{ color: colors.accent.default }}
                >
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

interface Props {
  picked: Augment[];
  /** Actual drawer container width (from the parent <Drawer>). */
  width: number;
  championId?: string;
}

export function PickedDrawer({ picked, width, championId }: Props) {
  const translate = useTranslation(t) as Translate;
  const { locale } = useLocale();
  const { colors } = useTheme();

  const champions = useChampions();
  const champion = championId
    ? champions.find((c) => c.id === championId)
    : undefined;

  const synergies = useSynergies(picked.map((a) => a.id));
  const activeSynergies = synergies.filter((s) => s.active);

  // Symmetric content padding — no safe-area inset on the right so the grid
  // fills the drawer edge-to-edge instead of leaving a phantom gap.
  const padLeft = Spacing.three;
  const padRight = Spacing.three;
  // Three-column grid (5 slots → 3 on top, 2 below); fills the width with 2 gaps.
  const COLUMNS = 3;
  const cellSize =
    (width - padLeft - padRight - Spacing.two * (COLUMNS - 1)) / COLUMNS;

  // Grid grows past the 5 base slots if Transmute: Chaos adds bonus augments.
  const total = Math.max(BASE_SLOTS, picked.length);
  const slots: (Augment | null)[] = Array.from(
    { length: total },
    (_, i) => picked[i] ?? null,
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface.base }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingLeft: padLeft,
          paddingRight: padRight,
          paddingVertical: Spacing.three,
          gap: Spacing.four,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="heading">{translate("title")}</ThemedText>

        {champion && (
          <ChampionSummary champion={champion} translate={translate} />
        )}

        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("augments")} {picked.length}/{BASE_SLOTS}
          </ThemedText>

          {activeSynergies.length > 0 && (
            <View style={styles.synergyList}>
              {activeSynergies.map(({ synergy, count }) => (
                <View
                  key={synergy.id}
                  style={[
                    styles.synergyCard,
                    {
                      backgroundColor: "transparent",
                      borderColor: colors.border.default,
                    },
                  ]}
                >
                  <View style={styles.synergyHeader}>
                    <SynergyIcon
                      name={synergy.icon}
                      size={18}
                      color={colors.accent.default}
                    />
                    <ThemedText
                      type="label"
                      style={[
                        styles.synergyName,
                        { color: colors.accent.default },
                      ]}
                    >
                      {synergy.name[locale] ?? synergy.name.en}
                    </ThemedText>
                  </View>

                  {synergy.tiers.map((tier) => {
                    const reached = count >= tier.count;
                    return (
                      <View key={tier.count} style={styles.tierRow}>
                        <View
                          style={[
                            styles.tierBadge,
                            {
                              backgroundColor: reached
                                ? colors.accent.default
                                : colors.surface.sunken,
                            },
                          ]}
                        >
                          <ThemedText
                            type="caption"
                            style={{
                              color: reached
                                ? colors.accent.onAccent
                                : colors.text.disabled,
                            }}
                          >
                            {tier.count}
                          </ThemedText>
                        </View>
                        <ThemedText
                          type="caption"
                          color={reached ? "secondary" : "disabled"}
                          style={styles.tierText}
                        >
                          {tier.description[locale] ?? tier.description.en}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          <View style={styles.grid}>
            {slots.map((item, i) => (
              <AugmentCell key={i} augment={item} size={cellSize} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  emptyCell: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  cell: {
    alignItems: "center",
    gap: Spacing.one,
  },
  cellName: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
  iconWrapper: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
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
  synergyList: {
    gap: Spacing.two,
  },
  synergyCard: {
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  synergyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  synergyName: {
    flex: 1,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  tierBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tierText: {
    flex: 1,
  },
});
