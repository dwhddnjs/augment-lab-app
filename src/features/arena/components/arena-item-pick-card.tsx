/**
 * ArenaItemPickCard — 전설 모루(클래스 전설 아이템) 카드 3장용.
 * ArenaPrismaticCard를 본떠 일반 Item을 골드 등급 프레임으로 표시한다.
 * 칼바람/아레나 공용 PickCard 선택 애니메이션 + 카드당 1회 무료 리롤 버튼.
 */
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { CARD_ASPECT, RARITY } from "@/components/ui/rarity-card-frame";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import { itemDescriptionText } from "@/features/items/text";
import type { Item } from "@/features/items/types";
import { itemImageUrl } from "@/lib/ddragon";
import {
  PickCard,
  type CardEntryMode,
  type CardExitMode,
} from "@/components/ui/pick-card";
import { RerollButton } from "@/components/ui/reroll-button";

const GOLD = RARITY.gold;

interface Props {
  item: Item;
  cardWidth: number;
  index: number;
  exitMode: CardExitMode;
  entryMode: CardEntryMode;
  disabled: boolean;
  rerolled: boolean;
  onPick: () => void;
  onReroll: () => void;
}

export function ArenaItemPickCard({
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
  const cardHeight = Math.round(cardWidth * CARD_ASPECT);
  const framePad = Math.max(3, Math.round(cardWidth * 0.056));
  const summary = itemDescriptionText(item.description);

  const frame = (
    <View
      style={[
        styles.frame,
        {
          width: cardWidth,
          height: cardHeight,
          padding: framePad,
          experimental_backgroundImage: GOLD.frameImage,
          boxShadow: GOLD.outerGlow,
        },
      ]}
    >
      <View style={[styles.body, { backgroundColor: GOLD.bodyColor }]}>
        <RemoteImage
          uri={itemImageUrl(item.imageKey)}
          recyclingKey={item.id}
          style={styles.icon}
          contentFit="contain"
        />
        <ThemedText
          numberOfLines={2}
          style={[styles.name, { color: GOLD.title }]}
        >
          {item.name}
        </ThemedText>
        <ThemedText numberOfLines={5} style={[styles.desc, { color: GOLD.desc }]}>
          {summary}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <PickCard
        index={index}
        exitMode={exitMode}
        entryMode={entryMode}
        disabled={disabled}
        onPress={onPick}
      >
        {frame}
      </PickCard>

      <RerollButton
        used={rerolled}
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
  },
  name: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 14,
    marginTop: Spacing.one,
  },
  desc: {
    textAlign: "center",
    fontSize: 8,
    lineHeight: 12,
    paddingHorizontal: Spacing.one,
    flexShrink: 1,
  },
});
