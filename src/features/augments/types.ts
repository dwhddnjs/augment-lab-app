export type AugmentRarity = 'silver' | 'gold' | 'prismatic';

/**
 * 증강이 실제로 등장하는 게임 모드.
 * 'aram'    — 칼바람 나락 무작위 총력전: 아수라장 (CDragon augment-lists 의 KIWI)
 * 'classic' — 무작위 총력전: 아수라장 클래식 스타일 (KIWI_JADE)
 * 두 모드는 증강 상당수를 공유하므로 한 증강이 둘 다 가질 수 있다.
 */
export type AugmentMode = 'aram' | 'classic';

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
   * 아레나 증강 데이터에는 아직 없어 옵셔널이다.
   */
  augmentNameId?: string;
  /**
   * 등장 모드. 빈 배열이면 어느 모드 풀에도 없다(미출시이거나 이미 제거된 증강).
   * 뽑기에는 안 쓰이지만 과거 빌드가 참조할 수 있어 데이터는 남긴다.
   */
  modes?: AugmentMode[];
}
