import type { HEADLINER_IDS, STICKER_IDS } from './rules';

export type HeadlinerId = (typeof HEADLINER_IDS)[number];
export type StickerId = (typeof STICKER_IDS)[number];
export type SkillKey = 'q' | 'w' | 'e' | 'r';

/**
 * 드래프트에서 헤드라이너로 얻은 것. 빌드와 함께 저장한다.
 * 저장본은 앱 버전을 넘어 살아남으므로 id·stickers 는 string 이다 — 지금 모르는 값도
 * 지우지 않고(다음 저장이 디스크를 덮어쓴다) 표시할 때만 건너뛴다.
 */
export interface BuildHeadliner {
  id: string;
  /** 펜타킬 — 강화한 순서대로 */
  skills: SkillKey[];
  /** HEARTSTEEL — 고른 스티커, 중복 가능 */
  stickers: string[];
}

export interface HeadlinerTexts {
  headliners: Record<HeadlinerId, { name: string; description: string }>;
  /** full 은 Drawer·결과, short 는 폭이 좁은 카드 툴팁용. */
  stickers: Record<StickerId, { name: string; full: string; short: string }>;
  skills: Record<SkillKey, string>;
  /** {spell} 자리에 스킬 이름이 들어간다. [e]강화 [s]스킬명 [h]회복 [b]보호막 표시는 색으로 그린다. */
  skillTitle: string;
  skillBonus: string;
  skillBonusShort: string;
  /** {n} 자리에 개수가 들어간다. */
  anvils: string;
}
