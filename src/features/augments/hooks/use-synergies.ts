import { useMemo } from 'react';

import synergiesData from '@/features/augments/data/synergies.json';
import type { Synergy } from '@/features/augments/types';

const SYNERGIES = synergiesData as Synergy[];

export interface SynergyStatus {
  synergy: Synergy;
  // How many of the picked augments contribute to this synergy.
  count: number;
  // True once `count` reaches the synergy's `minCount`.
  active: boolean;
}

// Which synergies a single augment contributes to (for per-card badges).
export function getAugmentSynergies(augmentId: string): Synergy[] {
  return SYNERGIES.filter((s) => s.augmentIds.includes(augmentId));
}

// Evaluate every synergy against the currently picked augment ids.
export function useSynergies(pickedIds: string[]): SynergyStatus[] {
  return useMemo(() => {
    const ids = new Set(pickedIds);
    return SYNERGIES.map((synergy) => {
      const count = synergy.augmentIds.reduce(
        (n, id) => (ids.has(id) ? n + 1 : n),
        0,
      );
      return { synergy, count, active: count >= synergy.minCount };
    });
  }, [pickedIds]);
}
