/**
 * 아이템 스탯 합산 유틸
 *
 * 챔피언 기본 스탯(ChampionStats, 레벨 1 기준)에 선택한 아이템들의 ItemStats를 더해
 * 표시용 합산 수치를 반환한다.
 *
 * 주의: ItemStats의 Flat*는 절대값, Percent*는 비율(0.4 = 40%)이므로 단위를 구분해 처리.
 */
import type { ChampionStats } from '@/features/champions/types';
import type { ItemStats } from './types';

export interface ComputedStats {
  // 챔피언 기본 + 아이템 합산
  hp: number;
  mp: number;
  armor: number;
  spellblock: number;
  attackdamage: number;
  attackspeed: number; // 최종 공격속도 (base * (1 + Σ%))
  movespeed: number;   // Flat 합산 후 % 적용
  crit: number;        // 치명타 확률 (0-100%)
  // 아이템에서만 오는 파생 스탯 (챔피언 기본값 없음)
  abilitypower: number;
  lifesteal: number;   // 생명력 흡수 % (0-100)
}

export function computeStats(
  base: ChampionStats,
  itemStatsList: ItemStats[],
): ComputedStats {
  let flatAP = 0;
  let flatHP = 0;
  let flatMP = 0;
  let flatArmor = 0;
  let flatMR = 0;
  let flatAD = 0;
  let flatMS = 0;
  let percentMS = 0;
  let flatCrit = 0;
  let percentAS = 0;
  let percentLS = 0;

  for (const s of itemStatsList) {
    flatHP += s.FlatHPPoolMod ?? 0;
    flatMP += s.FlatMPPoolMod ?? 0;
    flatArmor += s.FlatArmorMod ?? 0;
    flatMR += s.FlatSpellBlockMod ?? 0;
    flatAD += s.FlatPhysicalDamageMod ?? 0;
    flatAP += s.FlatMagicDamageMod ?? 0;
    flatMS += s.FlatMovementSpeedMod ?? 0;
    percentMS += s.PercentMovementSpeedMod ?? 0;
    flatCrit += s.FlatCritChanceMod ?? 0;
    percentAS += s.PercentAttackSpeedMod ?? 0;
    percentLS += s.PercentLifeStealMod ?? 0;
  }

  return {
    hp: Math.round(base.hp + flatHP),
    mp: Math.round(base.mp + flatMP),
    armor: Math.round(base.armor + flatArmor),
    spellblock: Math.round(base.spellblock + flatMR),
    attackdamage: Math.round(base.attackdamage + flatAD),
    // 공격속도: 기본값에 % 비율 합산 (0.651 * (1 + 0.4) = 0.911 등)
    attackspeed: Math.round((base.attackspeed * (1 + percentAS)) * 1000) / 1000,
    // 이동속도: Flat 더하고 % 비율 곱
    movespeed: Math.round((base.movespeed + flatMS) * (1 + percentMS)),
    crit: Math.min(100, Math.round((base.crit + flatCrit * 100))),
    abilitypower: Math.round(flatAP),
    lifesteal: Math.round(percentLS * 100),
  };
}

/** 표시 항목 정의 */
export const STAT_DISPLAY_ORDER = [
  'hp', 'mp', 'attackdamage', 'abilitypower', 'armor', 'spellblock',
  'attackspeed', 'movespeed', 'crit', 'lifesteal',
] as const satisfies (keyof ComputedStats)[];

export type StatKey = typeof STAT_DISPLAY_ORDER[number];

export const STAT_LABELS: Record<StatKey, { ko: string; en: string; unit?: string }> = {
  hp:          { ko: '체력',          en: 'Health' },
  mp:          { ko: '마나',          en: 'Mana' },
  attackdamage:{ ko: '공격력',        en: 'Attack Damage' },
  abilitypower:{ ko: '주문력',        en: 'Ability Power' },
  armor:       { ko: '방어력',        en: 'Armor' },
  spellblock:  { ko: '마법 저항력',   en: 'Magic Resist' },
  attackspeed: { ko: '공격 속도',     en: 'Attack Speed' },
  movespeed:   { ko: '이동 속도',     en: 'Move Speed' },
  crit:        { ko: '치명타 확률',   en: 'Crit Chance',  unit: '%' },
  lifesteal:   { ko: '생명력 흡수',   en: 'Life Steal',   unit: '%' },
};
