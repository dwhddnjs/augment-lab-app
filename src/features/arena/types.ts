import type { Augment } from '@/features/augments/types';

/**
 * 아레나 증강. id/name/description/rarity/iconPath 구조는 칼바람(Augment)과 같되,
 * 시즌2 증강 레벨업 시스템을 위해 maxLevel을 추가로 갖는다.
 * maxLevel은 증강마다 다르며(CDragon dataValues.MaxLevel) rarity와 독립적이다.
 * 아이콘은 칼바람과 동일하게 augmentImageUrl()로 렌더한다.
 */
export interface ArenaAugment extends Augment {
  /**
   * 이 증강의 최대 강화 레벨. 1이면 레벨업 불가(픽 즉시 최대치).
   * 같은 증강을 다시 뽑으면 maxLevel에 도달할 때까지 레벨이 1씩 오른다.
   */
  maxLevel: number;
}

/** drawer/결과에 누적되는 픽한 증강 + 현재 강화 레벨. */
export interface ArenaPickedAugment {
  augment: ArenaAugment;
  level: number;
}

/**
 * 능력치 모루(스탯)로 얻는 단일 스탯 강화. 별도 CDragon 데이터가 없어 수동 정의한다
 * (stat-shards.{ko,en}.json). value는 ItemStats와 동일 단위(비율은 0.2=20%).
 */
export interface StatShard {
  id: string;
  name: string;
  description: string;
  stat: string;
  value: number;
}

/**
 * 재련 craft 옵션(증강 강화·증강 슬롯 획득·프리즘 능력치 모루 등) + 시즌 변형 증강.
 * 원본 데이터 rarity 4에 해당하며 일반 등급이 아니다. 2단계 재련 단계에서 사용.
 */
export interface ArenaSpecialAugment {
  id: string;
  name: string;
  description: string;
  iconPath: string;
}

/**
 * 아레나 전용 프리즘 아이템(원본 item id 447xxx).
 * 아이콘은 ddragon에 없어 cdragonItemIconUrl()로 렌더한다.
 * description은 <mainText> HTML 원문 — 카드 렌더 시 파싱한다(2단계).
 */
export interface PrismaticItem {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  price: number;
}

/**
 * 아레나 진행 단위(step). 12라운드를 평탄화한 흐름으로, 한 라운드가 둘 이상의
 * 선택 페이즈로 나뉠 수 있다(R1 = 증강 + 상점).
 *   - augment  : 증강 3장 중 1장(기존 증강 재등장 시 레벨업)
 *   - prismatic: 프리즘 아이템 3장 중 1장
 *   - shop     : 골드 상점(신발/전설/능력치모루/프리즘모루/전설모루, 스킵 가능).
 *                R1은 500골드로 시작해 사실상 신발만 구매 가능하다.
 *   - reforge  : 재련(증강 강화 / 증강 슬롯 획득 / 프리즘 능력치 모루 3선택)
 */
export type ArenaStepKind = 'augment' | 'prismatic' | 'shop' | 'reforge';

export interface ArenaStep {
  /** 표시용 라운드 번호(1~12). 같은 라운드의 여러 step은 같은 번호를 공유한다. */
  round: number;
  kind: ArenaStepKind;
  /** shop step 진입 시 이번에 지급되는 골드. */
  gold?: number;
}

/** 골드 상점 안의 구매 옵션 종류. */
export type ShopOptionKind =
  | 'legendary'
  | 'stat-anvil'
  | 'prismatic-anvil'
  | 'legendary-anvil';
