import type { Augment, AugmentRarity } from '@/features/augments/types';
import type { TIERS } from '@/features/tierlist/tiers';

/** 표시 등급. 챔피언은 S~D, 증강은 S~C(소스 티어가 4단계라 D가 없다). */
export type Tier = (typeof TIERS)[number];

/**
 * 증강 한 줄 — `[augSlugs 인덱스, 승률×10000, 소스 티어(1~4)]`.
 * 챔피언마다 120개 넘게 실어서 객체로 두면 파일이 1.3MB가 된다(fetch 스크립트 주석 참고).
 */
export type AugEntry = [number, number, number];

/** tierlist.json 의 챔피언 한 행. */
export interface TierRow {
  /** 앱 champions.json 의 `key`(숫자 문자열). */
  key: string;
  /** 승률. */
  score: number;
  /** 픽률. */
  sub: number;
  /** 소스 티어에서 굽힌 표시 등급. fetch 스크립트가 박는다. */
  tier: Tier;
  augments: AugEntry[];
  /** 완성템 구매 순서(아이템 id). */
  build: string[];
  /** 상황템(아이템 id) — 판수 내림차순, build 와 겹치지 않는다. */
  situational: string[];
  /** 최다 스펠 조합(스펠 id). `spellIcons` 키다. */
  spells: number[];
  /** 위 스펠 조합의 픽률 — 태그 빌드 전체 판수 대비. */
  spellPick: number;
}

/** tierlist-items.{ko,en}.json 의 아이템 한 개. */
export interface TierItem {
  id: string;
  name: string;
  iconPath: string;
}

/** 앱 증강 풀과 조인한 추천 증강. `tier` 는 소스 티어(1~4). */
export interface TierAugment {
  aug: Augment;
  tier: number;
}

/** 희귀도 하나로 묶은 추천 증강 — 등급(S→C) 순, 같은 등급 안은 승률 순. */
export interface AugmentGroup {
  rarity: AugmentRarity;
  list: TierAugment[];
}
