import type { Augment } from '@/features/augments/types';

export type AramPhase = 'picking' | 'animating' | 'done';

export interface AramState {
  round: number;
  currentCards: Augment[];
  picked: Augment[];
}
