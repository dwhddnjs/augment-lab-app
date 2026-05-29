export interface ItemStats {
  FlatHPPoolMod?: number;
  FlatMPPoolMod?: number;
  FlatArmorMod?: number;
  FlatSpellBlockMod?: number;
  FlatPhysicalDamageMod?: number;
  FlatMagicDamageMod?: number;
  FlatMovementSpeedMod?: number;
  PercentMovementSpeedMod?: number;
  FlatCritChanceMod?: number;
  PercentAttackSpeedMod?: number;
  FlatHPRegenMod?: number;
  FlatMPRegenMod?: number;
  PercentLifeStealMod?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  plaintext: string;
  gold: {
    base: number;
    total: number;
    sell: number;
    purchasable: boolean;
  };
  tags: string[];
  stats: ItemStats;
  imageKey: string; // ddragon image file key (e.g. "1001.png")
}
