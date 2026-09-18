/**
 * 아이템 description 텍스트 정리.
 *
 * DDragon/CDragon 원문은 리치 텍스트다:
 *   "<mainText><stats>공격력 <attention>75</attention><br>...</stats><br><br></mainText>"
 * 스탯 줄은 따로 보여주므로(빌드 상세) 고유 효과만 남긴다 — `cleanItemDescription`.
 */
import { cleanAugmentDescription } from '@/lib/augment-text';

/**
 * 고유 효과만 남긴다. <stats> 블록은 스탯 요약 줄과 중복이라 걷어내고,
 * 나머지 리치 태그 정리는 증강과 동일한 클리너를 쓴다.
 */
export function cleanItemDescription(raw: string): string {
  return cleanAugmentDescription(raw.replace(/<stats>[\s\S]*?<\/stats>/gi, ''));
}
