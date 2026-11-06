import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentImage } from "@/components/ui/augment-image";
import {
  AugmentRarityColors,
  AugmentRarityGlyphs,
  HeroOverlay,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useAugmentName } from "@/features/augments/hooks/use-augments";
import type { Augment } from "@/features/augments/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { HeadlinerSummary } from "@/features/headliners/components/headliner-summary";
import type { BuildHeadliner } from "@/features/headliners/types";
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

// 6칸 — 칼바람 4픽에 보너스(K/DA·열혈 팬)·전환 증강으로 늘어나는 몫까지 3열 두 줄로 담는다.
// (전환: 혼돈처럼 증강을 더 주면 그 이상으로 늘어난다.)
const SLOTS = 6;

interface AugmentCellProps {
  augment: Augment | null;
  size: number;
}

function AugmentCell({ augment, size }: AugmentCellProps) {
  const { mode, colors } = useTheme();
  const augmentName = useAugmentName();

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

  // 증강 아이콘은 어두운 배경 자산이라 모드와 무관하게 앱의 어두운 타일(AugmentTile 과 같은 톤)에 담는다.
  // 판이 어두우니 테두리·글리프도 다크 팔레트다. 라이트 모드 이름은 아래에서 보조색으로 따로 칠한다.
  const tint = AugmentRarityColors[augment.rarity].border;

  return (
    <View style={[styles.cell, { width: size }]}>
      <View
        style={[
          styles.iconWrapper,
          {
            width: size,
            height: size,
            backgroundColor: HeroOverlay.cardBase,
            borderColor: tint,
          },
        ]}
      >
        <AugmentImage
          key={augment.id}
          iconPath={augment.iconPath}
          size={Math.round(size * 0.78)}
          tint={tint}
          fallbackGlyph={AugmentRarityGlyphs[augment.rarity] ?? "star-four-points"}
          recyclingKey={augment.id}
        />
      </View>
      <ThemedText
        numberOfLines={2}
        ellipsizeMode="tail"
        color="secondary"
        // 라이트 모드 등급색은 11pt 글자 대비(4.5:1)에 못 미쳐 이름은 기본 보조색으로 둔다(AugmentRarityColorsLight 주석).
        style={[styles.cellName, { width: size }, mode === "dark" && { color: tint }]}
      >
        {augmentName(augment)}
      </ThemedText>
    </View>
  );
}

interface Props {
  picked: Augment[];
  /** Actual drawer container width (from the parent <Drawer>). */
  width: number;
  championId?: string;
  headliner?: BuildHeadliner;
}

export function PickedDrawer({ picked, width, championId, headliner }: Props) {
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
  // Three-column grid (5칸 → 3+2, 6칸 → 3+3); fills the width with 2 gaps.
  const COLUMNS = 3;
  const cellSize =
    (width - padLeft - padRight - Spacing.two * (COLUMNS - 1)) / COLUMNS;

  // 전환 증강이 증강을 더 주면 기본 칸 너머로 늘어난다.
  const total = Math.max(SLOTS, picked.length);
  const cells: (Augment | null)[] = Array.from(
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

        <HeadlinerSummary headliner={headliner} championId={championId} compact />

        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("augments")} {picked.length}/{SLOTS}
          </ThemedText>

          <View style={styles.grid}>
            {cells.map((item, i) => (
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
