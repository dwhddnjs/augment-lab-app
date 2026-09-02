/**
 * AramCard — 칼바람·클래식 드래프트 카드 한 장.
 * 공용 PickCard 애니메이션 위에 증강 프레임과 카드당 1회 리롤 버튼을 얹는다
 * (아레나의 ArenaAugmentCard 와 같은 구성 — 연출 코드는 PickCard 한 곳에만 있다).
 */
import { StyleSheet, View } from "react-native";

import {
  PickCard,
  type CardEntryMode,
  type CardExitMode,
} from "@/components/ui/pick-card";
import { RarityCardFrame } from "@/components/ui/rarity-card-frame";
import { RerollButton } from "@/components/ui/reroll-button";
import { Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";

interface Props {
  augment: Augment;
  index: number;
  cardWidth: number;
  exitMode: CardExitMode;
  entryMode: CardEntryMode;
  disabled: boolean;
  rerolled: boolean;
  onPick: () => void;
  onReroll: () => void;
}

export function AramCard({
  augment,
  index,
  cardWidth,
  exitMode,
  entryMode,
  disabled,
  rerolled,
  onPick,
  onReroll,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <PickCard
        index={index}
        exitMode={exitMode}
        entryMode={entryMode}
        disabled={disabled}
        onPress={onPick}
      >
        <RarityCardFrame augment={augment} cardWidth={cardWidth} />
      </PickCard>

      <RerollButton
        used={rerolled}
        disabled={disabled || exitMode !== "none"}
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
});
