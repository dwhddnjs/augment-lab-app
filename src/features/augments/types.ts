export type AugmentRarity = 'silver' | 'gold' | 'prismatic';

export interface Augment {
  id: string;
  name: string;
  description: string;
  rarity: AugmentRarity;
  // CDragon relative path — use cdnAugmentImageUrl() to build full URL
  iconPath: string;
}

// One stacking breakpoint within a synergy (e.g. the bonus unlocked at 2 / 4 augments).
export interface SynergyTier {
  // Number of contributing augments required to reach this tier.
  count: number;
  description: { ko: string; en: string };
}

// Official ARAM: Mayhem "Augment Set" — see data/synergies.json.
export interface Synergy {
  id: string;
  name: { ko: string; en: string };
  // Augment ids that contribute to this synergy.
  augmentIds: string[];
  // Stacking breakpoints, ascending by count. The first entry's count is the
  // minimum needed to activate the synergy at all.
  tiers: SynergyTier[];
  // Highest possible stack count for this set (caps the count/max display).
  maxStacks: number;
  // MaterialCommunityIcons glyph name for the synergy chip icon.
  icon: string;
}
