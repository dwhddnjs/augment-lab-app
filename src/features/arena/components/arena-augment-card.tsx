/**
 * ArenaAugmentCard — 아레나 증강 카드. 칼바람 카드 프레임(RarityCardFrame)을
 * 재사용하되, 선택 시 도달할 강화 레벨을 카드 상단 별로 표시하고 하단에 리롤 버튼을 둔다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";

import { RARITY, RarityCardFrame } from "@/components/ui/rarity-card-frame";
import { Radius, Spacing } from "@/constants/theme";
import type { ArenaAugment } from "@/features/arena/types";
import {
  ArenaPickCard,
  type ArenaCardEntryMode,
  type ArenaCardExitMode,
} from "./arena-pick-card";
import { ArenaRerollButton } from "./arena-reroll-button";

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
  bg,
}: {
  level: number;
  maxLevel: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.stars, { backgroundColor: bg }]}>
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
  const starColor = RARITY[augment.rarity].highlight;
  const cardBg = RARITY[augment.rarity].bodyColor;

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
          <RarityCardFrame
            augment={augment}
            cardWidth={cardWidth}
            topInset={Spacing.double}
          />
          {maxLevel > 1 && (
            <View style={styles.starsOverlay} pointerEvents="none">
              <LevelStars
                level={level}
                maxLevel={maxLevel}
                color={starColor}
                bg={cardBg}
              />
            </View>
          )}
        </View>
      </ArenaPickCard>

      {/* 픽 애니메이션 중에는 리롤을 눌러도 소용없으니 흐리게 눌러 죽인다. */}
      <ArenaRerollButton
        rerolled={rerolled}
        disabled={disabled}
        onPress={onReroll}
        style={{ opacity: disabled && !rerolled ? 0.35 : 1 }}
      />
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
    // 배경색은 카드 내부 bg(RARITY.bodyColor)와 동일하게 inline 주입 — 라인 비침 제거.
  },
});
