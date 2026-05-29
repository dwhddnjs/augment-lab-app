import type { Augment } from '@/features/augments/types';

export type DraftPhase = 'picking' | 'animating' | 'done';

export interface DraftState {
  round: number;
  currentCards: Augment[];
  picked: Augment[];
}
