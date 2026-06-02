export type AugmentRarity = 'silver' | 'gold' | 'prismatic';

export interface Augment {
  id: string;
  name: string;
  description: string;
  rarity: AugmentRarity;
  // CDragon relative path — use cdnAugmentImageUrl() to build full URL
  iconPath: string;
}

// Curated augment synergy (no official LoL system) — see data/synergies.json.
export interface Synergy {
  id: string;
  name: { ko: string; en: string };
  description: { ko: string; en: string };
  // Augment ids that contribute to this synergy.
  augmentIds: string[];
  // Minimum number of contributing augments needed to activate.
  minCount: number;
  // SF Symbol name for the synergy chip icon.
  icon: string;
}
