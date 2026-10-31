/**
 * AramCard — 칼바람 드래프트 카드 한 장.
 * 공용 PickCard 애니메이션 위에 증강 프레임과 카드당 1회 리롤 버튼을 얹는다.
 * badge·footer 는 헤드라이너 표식으로, 카드와 함께 움직이도록 PickCard 안에 둔다.
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
import { COMMAND_LINE_REROLL } from "@/features/headliners/assets";

interface Props {
  augment: Augment;
  index: number;
  cardWidth: number;
  exitMode: CardExitMode;
  entryMode: CardEntryMode;
  disabled: boolean;
  rerolled: boolean;
  hacked: boolean;
  variant?: "kda";
  /** 카드에 겹치는 표식(HEARTSTEEL 스티커, K/DA 마크). */
  badge?: React.ReactNode;
  /** 카드 밑 표식(HEARTSTEEL 툴팁). */
  footer?: React.ReactNode;
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
  hacked,
  variant,
  badge,
  footer,
  onPick,
  onReroll,
}: Props) {
  return (
    // footer 자리만큼 줄인다. 낮은 가로 화면(높이 375pt)에서 카드는 더 줄일 여유가 없다.
    <View style={[styles.wrapper, footer != null && styles.tight]}>
      <PickCard
        index={index}
        exitMode={exitMode}
        entryMode={entryMode}
        disabled={disabled}
        onPress={onPick}
      >
        <View>
          <RarityCardFrame
            augment={augment}
            cardWidth={cardWidth}
            variant={variant}
          />
          {badge}
        </View>
        {footer}
      </PickCard>

      <RerollButton
        used={rerolled}
        hackedArt={hacked ? COMMAND_LINE_REROLL : undefined}
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
  tight: {
    gap: Spacing.one,
  },
});
