export type AugmentRarity = 'silver' | 'gold' | 'prismatic';

export interface Augment {
  id: string;
  name: string;
  description: string;
  rarity: AugmentRarity;
  // CDragon relative path — use cdnAugmentImageUrl() to build full URL
  iconPath: string;
}


