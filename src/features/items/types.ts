/**
 * 정규화된 아이템 스탯. scripts/parse-item-stats.mjs가 description의 <stats>
 * 블록을 파싱해 생성한다. Flat 키는 절대값, Percent/비율 키는 0.4=40% 형태.
 */
export interface ItemStats {
  // 절대값(flat)
  hp?: number;
  mp?: number;
  attackdamage?: number;
  abilitypower?: number;
  armor?: number;
  spellblock?: number;
  abilityhaste?: number;
  lethality?: number; // 물리 관통력(고정)
  magicpenFlat?: number; // 마법 관통력(고정)
  movespeedFlat?: number;
  adaptive?: number; // 적응형 능력치
  // 비율(0.4 = 40%)
  attackspeed?: number;
  movespeedPercent?: number;
  hpregen?: number;
  mpregen?: number;
  crit?: number;
  critdamage?: number;
  armorpen?: number; // 방어구 관통력(%)
  magicpenPercent?: number;
  lifesteal?: number;
  omnivamp?: number; // 모든 피해 흡혈
  tenacity?: number; // 강인함
  healshield?: number; // 체력 회복 및 보호막 효과
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
