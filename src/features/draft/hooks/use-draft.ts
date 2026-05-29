import { useCallback, useMemo, useState } from 'react';
import { useAugments } from '@/features/augments/hooks/use-augments';
import type { Augment } from '@/features/augments/types';

const RARITY_WEIGHTS: [number, number, number][] = [
  [0.70, 0.25, 0.05],
  [0.65, 0.27, 0.08],
  [0.60, 0.28, 0.12],
  [0.55, 0.30, 0.15],
];

function pickWeighted(pool: Augment[], round: number, count: number): Augment[] {
  const [wSilver, wGold] = RARITY_WEIGHTS[Math.min(round, 3)];
  const wPrismatic = 1 - wSilver - wGold;

  const silver = pool.filter((a) => a.rarity === 'silver');
  const gold = pool.filter((a) => a.rarity === 'gold');
  const prismatic = pool.filter((a) => a.rarity === 'prismatic');

  const result: Augment[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const silverPool = silver.filter((a) => !used.has(a.id));
    const goldPool = gold.filter((a) => !used.has(a.id));
    const prismaticPool = prismatic.filter((a) => !used.has(a.id));

    const r = Math.random();
    let chooseFrom: Augment[];
    if (r < wPrismatic && prismaticPool.length > 0) {
      chooseFrom = prismaticPool;
    } else if (r < wPrismatic + wGold && goldPool.length > 0) {
      chooseFrom = goldPool;
    } else if (silverPool.length > 0) {
      chooseFrom = silverPool;
    } else {
      chooseFrom = [...goldPool, ...prismaticPool, ...silverPool].filter((a) => !used.has(a.id));
    }

    if (chooseFrom.length === 0) break;
    const chosen = chooseFrom[Math.floor(Math.random() * chooseFrom.length)];
    result.push(chosen);
    used.add(chosen.id);
  }

  return result;
}

export function useDraft() {
  const allAugments = useAugments();

  const initialCards = useMemo(() => pickWeighted(allAugments, 0, 3), [allAugments]);

  const [round, setRound] = useState(0);
  const [currentCards, setCurrentCards] = useState<Augment[]>(initialCards);
  const [picked, setPicked] = useState<Augment[]>([]);

  const drawNext = useCallback(
    (exclude: Augment[], nextRound: number) => {
      const excludeIds = new Set(exclude.map((a) => a.id));
      const pool = allAugments.filter((a) => !excludeIds.has(a.id));
      return pickWeighted(pool, nextRound, 3);
    },
    [allAugments],
  );

  const reroll = useCallback(
    (idx: number) => {
      setCurrentCards((prev) => {
        const excludeIds = new Set([
          ...picked.map((a) => a.id),
          ...prev.filter((_, i) => i !== idx).map((a) => a.id),
        ]);
        const pool = allAugments.filter((a) => !excludeIds.has(a.id));
        if (pool.length === 0) return prev;
        const [replacement] = pickWeighted(pool, round, 1);
        if (!replacement) return prev;
        const next = [...prev];
        next[idx] = replacement;
        return next;
      });
    },
    [allAugments, picked, round],
  );

  // Returns nextPicked; caller should navigate to /draft-result when round === 4
  const pick = useCallback(
    (idx: number): { nextPicked: Augment[]; done: boolean } => {
      const chosen = currentCards[idx];
      const nextPicked = [...picked, chosen];
      const nextRound = round + 1;
      const done = nextRound >= 4;

      setPicked(nextPicked);
      setRound(nextRound);

      if (!done) {
        setCurrentCards(drawNext(nextPicked, nextRound));
      }

      return { nextPicked, done };
    },
    [currentCards, drawNext, picked, round],
  );

  return { round, currentCards, picked, reroll, pick };
}
