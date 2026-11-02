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

/**
 * 라운드의 슬롯 3칸 스티커. 무작위 두 칸에 서로 다른 멤버가 붙고 한 칸은 비운다(플레이 경험 기준).
 * 슬롯에 붙는 것이라 그 칸을 리롤해도 바뀌지 않는다.
 */
export function rollRoundStickers(): (StickerId | null)[] {
  const members: StickerId[] = [...STICKER_IDS];
  const draw = () => members.splice(Math.floor(Math.random() * members.length), 1)[0];
  const empty = Math.floor(Math.random() * 3);
  return [0, 1, 2].map((i) => (i === empty ? null : draw()));
}

export function anvilCount(stickers: string[]): number {
  return stickers.filter((id) => id === 'aphelios').length * ANVILS_PER_APHELIOS;
}
