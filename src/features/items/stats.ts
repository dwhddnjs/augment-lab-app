/**
 * 아이템 스탯 합산 유틸
 *
 * 챔피언 기본 스탯(ChampionStats, 레벨 1 기준)에 선택한 아이템들의 ItemStats를 더해
 * 표시용 수치를 반환한다. 각 항목은 { base, added, total } 로 분리해 표시단에서
 * "총합 (+아이템 추가분)" 형태로 렌더할 수 있게 한다.
 *
 * 단위: ItemStats의 비율 키(attackspeed, crit, lifesteal 등)는 0.4 = 40% 형태로
 * 저장돼 있으므로 % 표시 항목은 ×100 해서 반환한다. attackspeed/movespeed/체젠/마젠은
 * 챔피언 기본값에 비율을 곱한다.
 */
import type { ChampionStats } from '@/features/champions/types';
import type { ItemStats } from './types';

export interface StatValue {
  base: number; // 챔피언 기본값
  added: number; // 아이템으로 추가된 양
  total: number; // 최종 합산
}

/**
 * 표시 항목 정의 (순서 = 표시 순서).
 * 앞쪽 = 코어 스탯(값이 0이어도 항상 표시), 뒤쪽 = 부가 스탯(값이 있을 때만 표시).
 */
export const STAT_DISPLAY_ORDER = [
  // 코어 스탯 — 항상 표시
  'hp',
  'hpregen',
  'mp',
  'mpregen',
  'attackdamage',
  'abilitypower',
  'armor',
  'spellblock',
  'attackspeed',
  'abilityhaste',
  'crit',
  'movespeed',
  'attackrange',
  // 부가 스탯 — 값이 있을 때만 표시
  'critdamage',
  'lethality',
  'armorpen',
  'magicpenFlat',
  'magicpenPercent',
  'lifesteal',
  'omnivamp',
  'tenacity',
  'healshield',
  'adaptive',
] as const;

export type StatKey = (typeof STAT_DISPLAY_ORDER)[number];

export type ComputedStats = Record<StatKey, StatValue>;

interface StatMeta {
  ko: string;
  en: string;
  unit?: string; // '%' 등
  /** 코어 스탯 → 값이 0이어도 항상 표시. false/미지정이면 값이 있을 때만 표시 */
  core?: boolean;
  /** 표시 소수 자릿수 (기본: 0, 단 비율 항목은 소수 허용) */
  decimals?: number;
}

export const STAT_LABELS: Record<StatKey, StatMeta> = {
  hp: { ko: '체력', en: 'Health', core: true },
  hpregen: { ko: '체력 재생', en: 'Health Regen', core: true, decimals: 1 },
  mp: { ko: '마나', en: 'Mana', core: true },
  mpregen: { ko: '마나 재생', en: 'Mana Regen', core: true, decimals: 1 },
  attackdamage: { ko: '공격력', en: 'Attack Damage', core: true },
  abilitypower: { ko: '주문력', en: 'Ability Power', core: true },
  armor: { ko: '방어력', en: 'Armor', core: true },
  spellblock: { ko: '마법 저항력', en: 'Magic Resist', core: true },
  attackspeed: { ko: '공격 속도', en: 'Attack Speed', core: true, decimals: 3 },
  abilityhaste: { ko: '스킬 가속', en: 'Ability Haste', core: true },
  crit: { ko: '치명타 확률', en: 'Crit Chance', unit: '%', core: true, decimals: 1 },
  movespeed: { ko: '이동 속도', en: 'Move Speed', core: true },
  attackrange: { ko: '사거리', en: 'Attack Range', core: true },
  critdamage: { ko: '치명타 피해량', en: 'Crit Damage', unit: '%', decimals: 1 },
  lethality: { ko: '물리 관통력', en: 'Lethality' },
  armorpen: { ko: '방어구 관통력', en: 'Armor Pen', unit: '%', decimals: 1 },
  magicpenFlat: { ko: '마법 관통력', en: 'Magic Pen' },
  magicpenPercent: { ko: '마법 관통력', en: 'Magic Pen', unit: '%', decimals: 1 },
  lifesteal: { ko: '생명력 흡수', en: 'Life Steal', unit: '%', decimals: 1 },
  omnivamp: { ko: '모든 피해 흡혈', en: 'Omnivamp', unit: '%', decimals: 1 },
  tenacity: { ko: '강인함', en: 'Tenacity', unit: '%', decimals: 1 },
  healshield: { ko: '회복 및 보호막', en: 'Heal & Shield', unit: '%', decimals: 1 },
  adaptive: { ko: '적응형 능력치', en: 'Adaptive Force' },
};

function sv(base: number, total: number): StatValue {
  return { base, added: total - base, total };
}

export function computeStats(
  base: ChampionStats,
  itemStatsList: ItemStats[],
): ComputedStats {
  // 아이템 합산 (비율 키는 그대로 비율, flat 키는 절대값)
  const s: Required<{ [K in keyof ItemStats]: number }> = {
    hp: 0, mp: 0, attackdamage: 0, abilitypower: 0, armor: 0, spellblock: 0,
    abilityhaste: 0, lethality: 0, magicpenFlat: 0, movespeedFlat: 0, adaptive: 0,
    attackspeed: 0, movespeedPercent: 0, hpregen: 0, mpregen: 0, crit: 0,
    critdamage: 0, armorpen: 0, magicpenPercent: 0, lifesteal: 0, omnivamp: 0,
    tenacity: 0, healshield: 0,
  };
  for (const it of itemStatsList) {
    for (const k of Object.keys(s) as (keyof ItemStats)[]) {
      s[k] += it[k] ?? 0;
    }
  }

  const attackspeedTotal = base.attackspeed * (1 + s.attackspeed);
  const movespeedTotal = (base.movespeed + s.movespeedFlat) * (1 + s.movespeedPercent);
  const hpregenTotal = base.hpregen * (1 + s.hpregen);
  const mpregenTotal = base.mpregen * (1 + s.mpregen);
  const critTotal = Math.min(100, base.crit + s.crit * 100); // base.crit는 보통 0

  return {
    hp: sv(base.hp, base.hp + s.hp),
    hpregen: sv(base.hpregen, hpregenTotal),
    mp: sv(base.mp, base.mp + s.mp),
    mpregen: sv(base.mpregen, mpregenTotal),
    attackdamage: sv(base.attackdamage, base.attackdamage + s.attackdamage),
    abilitypower: sv(0, s.abilitypower),
    armor: sv(base.armor, base.armor + s.armor),
    spellblock: sv(base.spellblock, base.spellblock + s.spellblock),
    attackspeed: sv(base.attackspeed, attackspeedTotal),
    abilityhaste: sv(0, s.abilityhaste),
    crit: sv(0, critTotal),
    critdamage: sv(0, s.critdamage * 100),
    lethality: sv(0, s.lethality),
    armorpen: sv(0, s.armorpen * 100),
    magicpenFlat: sv(0, s.magicpenFlat),
    magicpenPercent: sv(0, s.magicpenPercent * 100),
    lifesteal: sv(0, s.lifesteal * 100),
    omnivamp: sv(0, s.omnivamp * 100),
    movespeed: sv(base.movespeed, movespeedTotal),
    tenacity: sv(0, s.tenacity * 100),
    healshield: sv(0, s.healshield * 100),
    attackrange: sv(base.attackrange, base.attackrange),
    adaptive: sv(0, s.adaptive),
  };
}
