/**
 * ArenaEnhancePicker — 증강 강화(재련) 시 뜨는 보유 증강 선택 오버레이.
 * 보유 증강 3장을 깔고 그중 1장을 고르면 그 증강을 제거하는 데 쓴다.
 * arena-anvil-picker와 동일한 카드 선택 애니메이션(380ms pick / 220ms reroll)을 복제한다.
 *   - 카드를 누르면 pick 애니메이션 후 onPick(idx) → 부모가 강화 확정 + 오버레이 닫기.
 *   - 카드당 1회 리롤(아직 안 보여준 보유 증강으로 교체). 빈 영역 탭 → onClose.
 */
import { useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { MAX_AUGMENT_LEVEL, type ArenaPickedAugment } from "@/features/arena/types";
import { useTheme } from "@/hooks/use-theme";
import { ArenaAugmentCard } from "./arena-augment-card";
import {
  type ArenaCardEntryMode,
  type ArenaCardExitMode,
} from "./arena-pick-card";

interface Props {
  cards: ArenaPickedAugment[];
  rerolled: boolean[];
  onPick: (idx: number) => void;
  onReroll: (idx: number) => void;
  onClose: () => void;
}

export function ArenaEnhancePicker({
  cards,
  rerolled,
  onPick,
  onReroll,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const screenW = Math.max(width, height);
  const screenH = Math.min(width, height);

  const hPad = Spacing.four;
  const cardGap = Spacing.three;
  const cardWidthByW = Math.floor((screenW - hPad * 2 - cardGap * 2) / 3);
  const cardWidthByH = Math.floor(screenH * 0.62 * (9 / 14));
  const cardWidth = Math.min(cardWidthByW, cardWidthByH);

  const [exitModes, setExitModes] = useState<ArenaCardExitMode[]>([
    "none",
    "none",
    "none",
  ]);
  const [entryModes, setEntryModes] = useState<ArenaCardEntryMode[]>([
    "flip",
    "flip",
    "flip",
  ]);
  const [animating, setAnimating] = useState(false);

  // 선택: 고른 카드 바운스 + 나머지 fade-out → 380ms 후 확정(onPick).
  const handlePick = (idx: number) => {
    if (animating) return;
    setAnimating(true);
    const modes: ArenaCardExitMode[] = ["unchosen", "unchosen", "unchosen"];
    modes[idx] = "picked";
    setExitModes(modes);
    setTimeout(() => {
      onPick(idx);
    }, 380);
  };

  // 리롤: 대상 카드 fade-out → 220ms 후 교체(해당 슬롯 fade 재등장).
  const handleReroll = (idx: number) => {
    if (animating || rerolled[idx]) return;
    setAnimating(true);
    const modes: ArenaCardExitMode[] = ["none", "none", "none"];
    modes[idx] = "reroll";
    setExitModes(modes);
    setTimeout(() => {
      setEntryModes((prev) => {
        const next = [...prev];
        next[idx] = "fade";
        return next;
      });
      onReroll(idx);
      setExitModes(["none", "none", "none"]);
      setAnimating(false);
    }, 220);
  };

  return (
    <View style={[styles.overlay, { backgroundColor: colors.surface.overlay }]}>
      {/* 빈 영역 탭 → 닫기 */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={animating ? undefined : onClose}
      />

      <View style={[styles.cardsRow, { paddingHorizontal: hPad, gap: cardGap }]}>
        {cards.map((card, i) => (
          <ArenaAugmentCard
            key={`${i}-${card.augment.id}`}
            augment={card.augment}
            level={card.level}
            maxLevel={MAX_AUGMENT_LEVEL[card.augment.rarity]}
            cardWidth={cardWidth}
            index={i}
            exitMode={exitModes[i]}
            entryMode={entryModes[i]}
            disabled={animating}
            rerolled={rerolled[i]}
            onPick={() => handlePick(i)}
            onReroll={() => handleReroll(i)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
