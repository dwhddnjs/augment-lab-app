/**
 * ArenaAnvilPicker — 모루(전설/프리즘) 구매 시 뜨는 카드 3장 선택 오버레이.
 * 진열할 카드와 카드당 1회 리롤을 스스로 관리한다(부모는 풀과 확정 처리만 넘긴다).
 *   - 카드를 누르면 pick 애니메이션 후 onPick(card) → 부모가 구매를 확정하고 닫는다.
 *   - 빈 영역 탭 → onClose(구매 취소).
 */
import { useState } from "react";
import { useWindowDimensions } from "react-native";

import { cardWidthFor } from "@/components/ui/rarity-card-frame";
import { Spacing } from "@/constants/theme";
import type { PrismaticItem } from "@/features/arena/types";
import type { Item } from "@/features/items/types";
import { sampleDistinct } from "@/lib/arrays";
import { useCardPickAnim } from "../hooks/use-card-pick-anim";
import { ArenaCardOverlay } from "./arena-card-overlay";
import { ArenaItemPickCard } from "./arena-item-pick-card";
import { ArenaPrismaticCard } from "./arena-prismatic-card";

/** 오버레이 카드는 게임 화면보다 조금 크고 촘촘하게 깐다. */
const CARD_GAP = Spacing.three;
const CARD_HEIGHT_RATIO = 0.62;

type AnvilCard = Item | PrismaticItem;

interface Props {
  kind: "legendary" | "prismatic";
  /** 뽑기 풀. 이미 보유한 항목은 excludeIds 로 걸러진다. */
  pool: AnvilCard[];
  excludeIds: string[];
  onPick: (card: AnvilCard) => void;
  onClose: () => void;
}

export function ArenaAnvilPicker({
  kind,
  pool,
  excludeIds,
  onPick,
  onClose,
}: Props) {
  const { width, height } = useWindowDimensions();
  const cardWidth = cardWidthFor(
    Math.max(width, height),
    Math.min(width, height),
    CARD_GAP,
    CARD_HEIGHT_RATIO,
  );

  const [cards, setCards] = useState<AnvilCard[]>(() =>
    sampleDistinct(pool, 3, new Set(excludeIds)),
  );
  const [rerolled, setRerolled] = useState([false, false, false]);
  const anim = useCardPickAnim();

  // 카드당 1회 무료 리롤 — 현재 진열분 + 보유분을 뺀 나머지에서 1장 교체.
  const swapCard = (idx: number) => {
    const exclude = new Set([
      ...excludeIds,
      ...cards.filter((_, i) => i !== idx).map((c) => c.id),
    ]);
    const [replacement] = sampleDistinct(pool, 1, exclude);
    if (!replacement) return;
    setCards((prev) => prev.map((c, i) => (i === idx ? replacement : c)));
    setRerolled((prev) => prev.map((r, i) => (i === idx ? true : r)));
  };

  return (
    <ArenaCardOverlay
      modal
      locked={anim.animating}
      gap={CARD_GAP}
      onClose={onClose}
    >
      {cards.map((card, i) => {
        const shared = {
          cardWidth,
          index: i,
          exitMode: anim.exitModes[i],
          entryMode: anim.entryModes[i],
          disabled: anim.animating,
          rerolled: rerolled[i],
          onPick: () => anim.pick(i, () => onPick(card)),
          onReroll: () => anim.reroll(i, () => swapCard(i)),
        };
        return kind === "prismatic" ? (
          <ArenaPrismaticCard
            key={`${i}-${card.id}`}
            item={card as PrismaticItem}
            {...shared}
          />
        ) : (
          <ArenaItemPickCard
            key={`${i}-${card.id}`}
            item={card as Item}
            {...shared}
          />
        );
      })}
    </ArenaCardOverlay>
  );
}
