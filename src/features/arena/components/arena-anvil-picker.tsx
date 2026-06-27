/**
 * ArenaAnvilPicker — 모루(전설/프리즘) 구매 시 뜨는 카드 3장 선택 오버레이.
 * 상점 위에 absolute full-cover로 깔리며, arena-screen의 카드 선택 애니메이션
 * (380ms pick / 220ms reroll, exit·entry 모드)을 자체적으로 복제해 관리한다.
 *   - 카드를 누르면 pick 애니메이션 후 onPick(idx) → 부모가 구매 확정 + 오버레이 닫기.
 *   - 카드당 1회 무료 리롤(onReroll). 빈 영역 탭 → onClose(부모가 모루 골드 환불).
 *   - 헤더(제목·닫기 X) 없이 카드 3장만 깔끔하게 노출, 닫기는 카드 바깥 탭으로 처리.
 */
import { useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { Spacing } from "@/constants/theme";
import type { PrismaticItem } from "@/features/arena/types";
import type { Item } from "@/features/items/types";
import { useTheme } from "@/hooks/use-theme";
import {
  type ArenaCardEntryMode,
  type ArenaCardExitMode,
} from "./arena-pick-card";
import { ArenaItemPickCard } from "./arena-item-pick-card";
import { ArenaPrismaticCard } from "./arena-prismatic-card";

interface Props {
  kind: "legendary" | "prismatic";
  cards: (Item | PrismaticItem)[];
  rerolled: boolean[];
  onPick: (idx: number) => void;
  onReroll: (idx: number) => void;
  onClose: () => void;
}

export function ArenaAnvilPicker({
  kind,
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
      {/* 빈 영역 탭 → 닫기(환불) */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={animating ? undefined : onClose}
      />

      <View style={[styles.cardsRow, { paddingHorizontal: hPad, gap: cardGap }]}>
        {cards.map((card, i) =>
          kind === "prismatic" ? (
            <ArenaPrismaticCard
              key={`${i}-${card.id}`}
              item={card as PrismaticItem}
              cardWidth={cardWidth}
              index={i}
              exitMode={exitModes[i]}
              entryMode={entryModes[i]}
              disabled={animating}
              rerolled={rerolled[i]}
              onPick={() => handlePick(i)}
              onReroll={() => handleReroll(i)}
            />
          ) : (
            <ArenaItemPickCard
              key={`${i}-${card.id}`}
              item={card as Item}
              cardWidth={cardWidth}
              index={i}
              exitMode={exitModes[i]}
              entryMode={entryModes[i]}
              disabled={animating}
              rerolled={rerolled[i]}
              onPick={() => handlePick(i)}
              onReroll={() => handleReroll(i)}
            />
          ),
        )}
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
