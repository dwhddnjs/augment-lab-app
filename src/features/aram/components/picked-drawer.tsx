import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentImage } from "@/components/ui/augment-image";
import { AugmentRarityColors, AugmentRarityGlyphs, Radius, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";
import { ChampionSummary } from "./champion-summary";

const t = {
  ko: {
    title: "내 빌드",
    augments: "증강",
  },
  en: {
    title: "My Build",
    augments: "Augments",
  },
};

// UI shows 5 slots; the pick logic itself still resolves in 4 picks.
const BASE_SLOTS = 5;

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
        <AugmentImage
          key={augment.id}
          iconPath={augment.iconPath}
          size={Math.round(size * 0.66)}
          tint={tint}
          fallbackGlyph={AugmentRarityGlyphs[augment.rarity] ?? "star-four-points"}
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

interface Props {
  picked: Augment[];
  /** Actual drawer container width (from the parent <Drawer>). */
  width: number;
  championId?: string;
}

export function PickedDrawer({ picked, width, championId }: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();

  const champions = useChampions();
  const champion = championId
    ? champions.find((c) => c.id === championId)
    : undefined;

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

        {champion && <ChampionSummary champion={champion} />}

        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("augments")} {picked.length}/{BASE_SLOTS}
          </ThemedText>

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
});
