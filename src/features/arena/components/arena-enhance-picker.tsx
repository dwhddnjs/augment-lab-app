/**
 * ArenaEnhancePicker — 증강 강화(재련) 시 뜨는 보유 증강 선택 오버레이.
 * 보유 증강 중 3장을 깔고, 고른 1장이 제거 대상이 된다(남은 증강에 레벨이 분배된다).
 * 리롤은 아직 안 보여준 보유 증강으로 1회씩 교체한다.
 */
import { useState } from "react";
import { useWindowDimensions } from "react-native";

import { cardWidthFor } from "@/components/ui/rarity-card-frame";
import { Spacing } from "@/constants/theme";
import type { ArenaPickedAugment } from "@/features/arena/types";
import { pickRandom, shuffle } from "@/lib/arrays";
import { useCardPickAnim } from "../hooks/use-card-pick-anim";
import { ArenaAugmentCard } from "./arena-augment-card";
import { ArenaCardOverlay } from "./arena-card-overlay";

/** 모루 오버레이와 동일한 카드 크기. */
const CARD_GAP = Spacing.three;
const CARD_HEIGHT_RATIO = 0.62;

interface Props {
  /** 보유 증강 전체. 이 중 3장을 진열한다. */
  pool: ArenaPickedAugment[];
  /** 제거할 증강 id 확정. */
  onPick: (augmentId: string) => void;
  onClose: () => void;
}

export function ArenaEnhancePicker({ pool, onPick, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const cardWidth = cardWidthFor(
    Math.max(width, height),
    Math.min(width, height),
    CARD_GAP,
    CARD_HEIGHT_RATIO,
  );

  const [cards, setCards] = useState<ArenaPickedAugment[]>(() =>
    shuffle(pool).slice(0, 3),
  );
  const [rerolled, setRerolled] = useState([false, false, false]);
  const anim = useCardPickAnim();

  // 현재 진열에 없는 보유 증강 중 랜덤 1장으로 교체.
  // 후보가 없으면(보유가 3개뿐) 애니메이션도 걸지 않고 그대로 둔다.
  const handleReroll = (idx: number) => {
    const shown = new Set(cards.map((c) => c.augment.id));
    const replacement = pickRandom(pool.filter((p) => !shown.has(p.augment.id)));
    if (!replacement) return;
    anim.reroll(idx, () => {
      setCards((prev) => prev.map((c, i) => (i === idx ? replacement : c)));
      setRerolled((prev) => prev.map((r, i) => (i === idx ? true : r)));
    });
  };

  return (
    <ArenaCardOverlay locked={anim.animating} gap={CARD_GAP} onClose={onClose}>
      {cards.map((card, i) => (
        <ArenaAugmentCard
          key={`${i}-${card.augment.id}`}
          augment={card.augment}
          level={card.level}
          maxLevel={card.augment.maxLevel}
          cardWidth={cardWidth}
          index={i}
          exitMode={anim.exitModes[i]}
          entryMode={anim.entryModes[i]}
          disabled={anim.animating}
          rerolled={rerolled[i]}
          onPick={() => anim.pick(i, () => onPick(card.augment.id))}
          onReroll={() => handleReroll(i)}
        />
      ))}
    </ArenaCardOverlay>
  );
}
