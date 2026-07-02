/**
 * ArenaReforgeCard — 재련(R8) 옵션 카드. 특수 증강(증강 강화·증강 슬롯 획득·
 * 프리즘 능력치 모루 등)을 골드 등급 프레임으로 렌더한다.
 */
import { View, StyleSheet } from "react-native";

import { RarityCardFrame } from "@/components/ui/rarity-card-frame";
import { Spacing } from "@/constants/theme";
import type { ArenaSpecialAugment } from "@/features/arena/types";
import {
  ArenaPickCard,
  type ArenaCardEntryMode,
  type ArenaCardExitMode,
} from "./arena-pick-card";

interface Props {
  special: ArenaSpecialAugment;
  cardWidth: number;
  index: number;
  exitMode: ArenaCardExitMode;
  entryMode: ArenaCardEntryMode;
  disabled?: boolean;
  onPick: () => void;
}

export function ArenaReforgeCard({
  special,
  cardWidth,
  index,
  exitMode,
  entryMode,
  disabled,
  onPick,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <ArenaPickCard
        index={index}
        exitMode={exitMode}
        entryMode={entryMode}
        disabled={!!disabled}
        onPress={onPick}
      >
        {/* 특수 증강은 등급이 없어 골드 프레임으로 통일해 렌더한다. */}
        <RarityCardFrame
          augment={{ ...special, rarity: "gold" }}
          cardWidth={cardWidth}
        />
      </ArenaPickCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: Spacing.double,
  },
});
