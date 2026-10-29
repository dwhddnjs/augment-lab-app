export type AugmentRarity = 'silver' | 'gold' | 'prismatic';

/**
 * 증강이 실제로 등장하는 게임 모드.
 * 'aram' — 칼바람 나락 무작위 총력전: 아수라장 (CDragon augment-lists 의 KIWI)
 * 클래식(KIWI_JADE)·아레나(CHERRY)는 앱에서 제거됐다(2026-10-30 · 2026-09-19).
 */
export type AugmentMode = 'aram';

export interface Augment {
  id: string;
  name: string;
  description: string;
  rarity: AugmentRarity;
  // CDragon relative path — use cdnAugmentImageUrl() to build full URL
  iconPath: string;
  /**
   * CDragon augmentNameId. 아이콘·모드·수치를 조회하는 유일한 키다.
   * CDragon 에는 동명 증강이 115쌍 있어(ARAM_ADAPt vs ADAPt) 이름으로는 특정할 수 없다.
   * 값이 없는 항목이 남아 있어(현재 1개) 옵셔널이다.
   */
  augmentNameId?: string;
  /**
   * 등장 모드. 빈 배열이면 어느 모드 풀에도 없다(미출시이거나 이미 제거된 증강).
   * 뽑기에는 안 쓰이지만 과거 빌드가 참조할 수 있어 데이터는 남긴다.
   */
  modes?: AugmentMode[];
}
