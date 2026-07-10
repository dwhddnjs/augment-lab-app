import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import type { Champion } from "@/features/champions/types";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl } from "@/lib/ddragon";
import type { ItemStats } from "../types";
import { AugmentCard } from "./augment-card";
import { ItemStatPanel } from "./item-stat-panel";

const AUG_COLS = 3;

interface Props {
  champion: Champion | null;
  itemStatsList: ItemStats[];
  pickedAugments: Augment[];
  /** 우측 그리드 실측 너비. 0이면 카드 크기 미정 → 증강 미렌더. */
  augmentGridWidth: number;
  statsLabel: string;
  augmentsLabel: string;
  onAugmentGridLayout: (e: LayoutChangeEvent) => void;
}

export function ItemDetailPanel({
  champion,
  itemStatsList,
  pickedAugments,
  augmentGridWidth,
  statsLabel,
  augmentsLabel,
  onAugmentGridLayout,
}: Props) {
  const { colors } = useTheme();
  const championIconUri = champion
    ? championSquareUrl(champion.imageKey)
    : null;
  const augmentCardSize =
    augmentGridWidth > 0
      ? Math.floor((augmentGridWidth - Spacing.two * (AUG_COLS - 1)) / AUG_COLS)
      : 0;

  return (
    <View
      style={[
        styles.rightPanel,
        {
          borderTopColor: colors.border.subtle,
          borderRightColor: colors.border.subtle,
        },
      ]}
    >
      <ScrollView
        style={styles.rightScroll}
        contentContainerStyle={styles.rightContent}
        showsVerticalScrollIndicator={false}
      >
        {champion && (
          <View
            style={[
              styles.championRow,
              { borderBottomColor: colors.border.subtle, borderBottomWidth: 1 },
            ]}
          >
            {championIconUri && (
              <RemoteImage
                uri={championIconUri}
                recyclingKey={champion.id}
                style={[
                  styles.championIcon,
                  { borderColor: colors.border.default, borderWidth: 1 },
                ]}
                contentFit="cover"
              />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText type="body" color="primary" numberOfLines={1}>
                {champion.name}
              </ThemedText>
              <ThemedText type="caption" color="tertiary" numberOfLines={1}>
                {champion.title}
              </ThemedText>
              <ThemedText type="caption" color="disabled" numberOfLines={1}>
                {champion.tags.join(" · ")}
              </ThemedText>
            </View>
          </View>
        )}

        {champion && (
          <View style={{ marginTop: Spacing.two }}>
            <ThemedText
              type="caption"
              color="tertiary"
              style={{ marginBottom: Spacing.two }}
            >
              {statsLabel}
            </ThemedText>
            <ItemStatPanel
              baseStats={champion.stats}
              itemStatsList={itemStatsList}
            />
          </View>
        )}

        {pickedAugments.length > 0 && (
          <View style={{ marginTop: Spacing.three }}>
            <ThemedText
              type="caption"
              color="tertiary"
              style={{ marginBottom: Spacing.two }}
            >
              {augmentsLabel}
            </ThemedText>
            <View style={styles.augmentGrid} onLayout={onAugmentGridLayout}>
              {augmentCardSize > 0 &&
                pickedAugments.map((aug) => (
                  <AugmentCard
                    key={aug.id}
                    augment={aug}
                    size={augmentCardSize}
                  />
                ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rightPanel: { flex: 3, minWidth: 0 },
  rightScroll: { flex: 1 },
  rightContent: {
    paddingLeft: Spacing.double,
    paddingRight: Spacing.two,
    // paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  championRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  championIcon: { width: 52, height: 52, borderRadius: Radius.md },
  augmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
});
