/**
 * ArenaAugmentCard — 아레나 증강 카드. 칼바람 카드 프레임(RarityCardFrame)을
 * 재사용하되, 선택 시 도달할 강화 레벨을 카드 상단 별로 표시하고 하단에 리롤 버튼을 둔다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";

import { RARITY, RarityCardFrame } from "@/components/ui/rarity-card-frame";
import { Radius, Spacing } from "@/constants/theme";
import type { ArenaAugment } from "@/features/arena/types";
import { useTheme } from "@/hooks/use-theme";
import {
  ArenaPickCard,
  type ArenaCardEntryMode,
  type ArenaCardExitMode,
} from "./arena-pick-card";

interface Props {
  augment: ArenaAugment;
  /** 선택 시 도달할 강화 레벨(신규=1, 보유 중이면 현재+1). */
  level: number;
  maxLevel: number;
  cardWidth: number;
  index: number;
  exitMode: ArenaCardExitMode;
  entryMode: ArenaCardEntryMode;
  disabled: boolean;
  rerolled: boolean;
  onPick: () => void;
  onReroll: () => void;
}

function LevelStars({
  level,
  maxLevel,
  color,
}: {
  level: number;
  maxLevel: number;
  color: string;
}) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: maxLevel }).map((_, i) => (
        <MaterialCommunityIcons
          key={i}
          name={i < level ? "star" : "star-outline"}
          size={13}
          color={i < level ? color : "rgba(255,255,255,0.28)"}
        />
      ))}
    </View>
  );
}

export function ArenaAugmentCard({
  augment,
  level,
  maxLevel,
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
  const starColor = RARITY[augment.rarity].highlight;

  return (
    <View style={styles.wrapper}>
      <ArenaPickCard
        index={index}
        exitMode={exitMode}
        entryMode={entryMode}
        disabled={disabled}
        onPress={onPick}
      >
        <View style={styles.cardArea}>
          <RarityCardFrame augment={augment} cardWidth={cardWidth} />
          <View style={styles.starsOverlay} pointerEvents="none">
            <LevelStars level={level} maxLevel={maxLevel} color={starColor} />
          </View>
        </View>
      </ArenaPickCard>

      <Pressable
        onPress={rerolled || disabled ? undefined : onReroll}
        disabled={rerolled || disabled}
        style={[
          styles.reroll,
          {
            backgroundColor: rerolled
              ? colors.surface.sunken
              : colors.surface.raised,
            borderColor: rerolled ? colors.border.subtle : colors.border.strong,
            opacity: disabled && !rerolled ? 0.35 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="refresh"
          size={18}
          color={rerolled ? colors.text.disabled : colors.text.primary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: Spacing.double,
  },
  cardArea: {
    position: "relative",
  },
  starsOverlay: {
    position: "absolute",
    top: Spacing.one,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  stars: {
    flexDirection: "row",
    gap: 1,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  reroll: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
