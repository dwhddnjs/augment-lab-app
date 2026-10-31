/**
 * 헤드라이너 규칙. React·이미지 의존이 없는 순수 모듈이라 scripts/check-headliners.ts 가 그대로 실행한다.
 * 근거는 게임 문자열(kiwi_goh_*)과 docs/plans/2026-11-01-헤드라이너.md.
 */
import type { AugmentRarity } from '@/features/augments/types';
import type { HeadlinerId, SkillKey, StickerId } from './types';

/** 칼바람 라운드 수. K/DA 는 이 뒤에 보너스 선택이 한 번 더 있다(roundsFor). */
export const ARAM_ROUNDS = 4;

export const HEADLINER_IDS = [
  'kda',
  'pentakill',
  'heartsteel',
  'true-damage',
  'disco',
  'cafe-cuties',
  'bees',
  'command-line',
] as const;

export const STICKER_IDS = ['aphelios', 'ezreal', 'kayn', 'ksante', 'sett', 'yone'] as const;

// ponytail: 게임이 확률을 공개하지 않아 임의로 정한 값(라운드당 평균 1.2장). 실측이 나오면 바꾼다.
export const STICKER_CHANCE = 0.4;

const ANVILS_PER_APHELIOS = 2;

export function isHeadlinerId(id: unknown): id is HeadlinerId {
  return HEADLINER_IDS.includes(id as HeadlinerId);
}

export function rollHeadliner(): HeadlinerId {
  return HEADLINER_IDS[Math.floor(Math.random() * HEADLINER_IDS.length)];
}

export function roundsFor(id: string): number {
  return id === 'kda' ? ARAM_ROUNDS + 1 : ARAM_ROUNDS;
}

/** 해킹 새로고침이 올려 줄 등급. 프리즘은 위가 없어 null 이다. */
export function nextRarity(rarity: AugmentRarity): AugmentRarity | null {
  if (rarity === 'silver') return 'gold';
  if (rarity === 'gold') return 'prismatic';
  return null;
}

/** 펜타킬 스킬 카드 3장 — 처음엔 기본기만, 그다음엔 고른 것을 빼고 궁극기를 더한다. */
export function skillChoices(chosen: SkillKey[]): SkillKey[] {
  if (chosen.length === 0) return ['q', 'w', 'e'];
  return (['q', 'w', 'e', 'r'] as const).filter((key) => !chosen.includes(key));
}

/** 슬롯 하나의 스티커. 빗나가면 null. */
export function rollSticker(): StickerId | null {
  if (Math.random() >= STICKER_CHANCE) return null;
  return STICKER_IDS[Math.floor(Math.random() * STICKER_IDS.length)];
}

export function anvilCount(stickers: string[]): number {
  return stickers.filter((id) => id === 'aphelios').length * ANVILS_PER_APHELIOS;
}
