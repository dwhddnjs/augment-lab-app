/**
 * 헤드라이너 규칙. React·이미지 의존이 없는 순수 모듈이라 scripts/check-headliners.ts 가 그대로 실행한다.
 * 근거는 게임 문자열(kiwi_goh_*)과 docs/plans/2026-11-01-헤드라이너.md.
 */
import type { AugmentRarity } from '@/features/augments/types';
import type { HeadlinerId, SkillKey, StickerId } from './types';

/** 칼바람 라운드 수. K/DA·열혈 팬은 이 뒤에 보너스 선택이 한 번 더 있다(roundsFor). */
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
  // 열혈 팬(kiwi_goh_worlds_*, 26.22) — 레벨 제한 21, 21레벨에 추가 증강.
  'worlds',
  // 26.23 — 아케이드(부활 토큰)·연미복(증강 골드)·망자의 환영(양초 보호막)은 설명만, 마에스트로는 카드 4장.
  'arcade',
  'debonair',
  'la-ilusion',
  'maestro',
] as const;

/**
 * 드래프트 흐름을 바꾸는 헤드라이너 — K/DA·열혈 팬(보너스 라운드)·펜타킬(스킬 카드)·HEARTSTEEL(스티커)·
 * 커맨드 라인(리롤 강화·확률)·마에스트로(카드 4장). 나머지는 설명만 있다. 홈 시작 카드가 이들을 앞에 세운다.
 * 드래프트에 새 이벤트를 붙이는 헤드라이너를 추가하면 여기에도 넣는다.
 */
export const DRAFT_EVENT_IDS: readonly HeadlinerId[] = [
  'kda',
  'pentakill',
  'heartsteel',
  'command-line',
  'worlds',
  'maestro',
];

/** 4라운드를 마친 뒤 보너스 증강을 한 번 더 고르는 헤드라이너. K/DA 는 포토카드, 열혈 팬은 21레벨 보상이다. */
const BONUS_ROUND_IDS: readonly string[] = ['kda', 'worlds'];

export const STICKER_IDS = ['aphelios', 'ezreal', 'kayn', 'ksante', 'sett', 'yone'] as const;

const ANVILS_PER_APHELIOS = 2;

export function isHeadlinerId(id: unknown): id is HeadlinerId {
  return HEADLINER_IDS.includes(id as HeadlinerId);
}

export function rollHeadliner(): HeadlinerId {
  return HEADLINER_IDS[Math.floor(Math.random() * HEADLINER_IDS.length)];
}

/** 라운드마다 펼치는 증강 카드 수. 마에스트로만 4장이다(위키: "four offerings, rather than three"). */
export function cardsFor(id: string): number {
  return id === 'maestro' ? 4 : 3;
}

export function roundsFor(id: string): number {
  return BONUS_ROUND_IDS.includes(id) ? ARAM_ROUNDS + 1 : ARAM_ROUNDS;
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
 * 붙은 멤버는 그 칸을 리롤해도 그대로다. 빈 칸의 리롤은 rerollSlotSticker.
 */
export function rollRoundStickers(): (StickerId | null)[] {
  const members: StickerId[] = [...STICKER_IDS];
  const draw = () => members.splice(Math.floor(Math.random() * members.length), 1)[0];
  const empty = Math.floor(Math.random() * 3);
  return [0, 1, 2].map((i) => (i === empty ? null : draw()));
}

/** 리롤한 빈 칸에 멤버가 붙을 확률. ponytail: 공개값이 없다 — 플레이 경험("가끔 붙는다")으로 정했다. 실측이 생기면 바꾼다. */
const REROLL_STICKER_CHANCE = 0.5;

/**
 * idx 칸을 리롤한 뒤의 스티커. 멤버가 붙어 있던 칸은 그대로고, 빈 칸은 REROLL_STICKER_CHANCE 로
 * 다른 칸에 없는 멤버가 붙는다(26.23 플레이 경험 — 빈 3번 칸을 리롤하자 아펠리오스가 붙었다).
 */
export function rerollSlotSticker(stickers: (StickerId | null)[], idx: number): (StickerId | null)[] {
  if (stickers[idx] || Math.random() >= REROLL_STICKER_CHANCE) return stickers;
  const free = STICKER_IDS.filter((id) => !stickers.includes(id));
  const next = [...stickers];
  next[idx] = free[Math.floor(Math.random() * free.length)];
  return next;
}

export function anvilCount(stickers: string[]): number {
  return stickers.filter((id) => id === 'aphelios').length * ANVILS_PER_APHELIOS;
}
