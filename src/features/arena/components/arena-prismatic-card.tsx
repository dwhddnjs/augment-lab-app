/**
 * ArenaPrismaticCard — 프리즘 아이템 카드. 프리즘 등급 프레임에 아이템 아이콘
 * (CDragon)·이름·스탯 요약·효과를 표시한다. 프리즘 라운드와 상점 프리즘 모루에서 공용.
 */
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { CARD_ASPECT, RARITY } from "@/components/ui/rarity-card-frame";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import type { PrismaticItem } from "@/features/arena/types";
import {
  prismaticEffectSummary,
  prismaticStatSummary,
} from "@/features/items/text";
import { useTheme } from "@/hooks/use-theme";
import { cdragonItemIconUrl } from "@/lib/ddragon";
import {
  ArenaPickCard,
  type ArenaCardEntryMode,
  type ArenaCardExitMode,
} from "./arena-pick-card";
import { ArenaRerollButton } from "./arena-reroll-button";

const PRISM = RARITY.prismatic;

interface Props {
  item: PrismaticItem;
  cardWidth: number;
  index: number;
  exitMode: ArenaCardExitMode;
  entryMode: ArenaCardEntryMode;
  disabled: boolean;
  rerolled: boolean;
  onPick: () => void;
  onReroll: () => void;
}

export function ArenaPrismaticCard({
  item,
  cardWidth,
  index,
  exitMode,
  entryMode,
  disabled,
  rerolled,
  onPick,
  onReroll,
}: Props) {
  const { colors } = useTheme();
  const cardHeight = Math.round(cardWidth * CARD_ASPECT);
  const framePad = Math.max(3, Math.round(cardWidth * 0.056));
  const stats = prismaticStatSummary(item.description).replace(/\n/g, " · ");
  const summary = prismaticEffectSummary(item.description);

  return (
    <View style={styles.wrapper}>
      <ArenaPickCard
        index={index}
        exitMode={exitMode}
        entryMode={entryMode}
        disabled={disabled}
        onPress={onPick}
      >
        <View
          style={[
            styles.frame,
            {
              width: cardWidth,
              height: cardHeight,
              padding: framePad,
              experimental_backgroundImage: PRISM.frameImage,
              boxShadow: PRISM.outerGlow,
            },
          ]}
        >
          <View style={[styles.body, { backgroundColor: PRISM.bodyColor }]}>
            <RemoteImage
              uri={cdragonItemIconUrl(item.iconPath)}
              recyclingKey={item.id}
              style={[styles.icon, { borderColor: colors.border.default }]}
              contentFit="contain"
            />
            <ThemedText
              numberOfLines={2}
              style={[styles.name, { color: PRISM.title }]}
            >
              {item.name}
            </ThemedText>
            {!!stats && (
              <ThemedText
                numberOfLines={2}
                style={[styles.stats, { color: PRISM.title }]}
              >
                {stats}
              </ThemedText>
            )}
            <ThemedText
              numberOfLines={7}
              style={[styles.desc, { color: PRISM.desc }]}
            >
              {summary}
            </ThemedText>
          </View>
        </View>
      </ArenaPickCard>

      <ArenaRerollButton
        rerolled={rerolled}
        disabled={disabled}
        onPress={onReroll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: Spacing.double,
  },
  frame: {
    overflow: "hidden",
    borderRadius: Radius.lg + 3,
    borderCurve: "continuous",
  },
  body: {
    flex: 1,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    alignItems: "center",
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
    gap: Spacing.two,
  },
  // 아이템 아이콘 소스가 64px라 표시를 작게 둘수록 업스케일이 줄어 선명하다.
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  name: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 14,
    marginTop: Spacing.one,
  },
  stats: {
    textAlign: "center",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "600",
    paddingHorizontal: Spacing.one,
    opacity: 0.85,
  },
  desc: {
    textAlign: "center",
    fontSize: 8,
    lineHeight: 12,
    paddingHorizontal: Spacing.one,
    flexShrink: 1,
  },
});
