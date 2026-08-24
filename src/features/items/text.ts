import { cleanAugmentDescription } from '@/lib/augment-text';

/**
 * 아이템 설명에서 고유 효과만 남긴다. <stats> 블록은 스탯 요약 줄과 중복이라 걷어내고,
 * 나머지 리치 태그 정리는 증강과 동일한 클리너를 쓴다.
 */
export function cleanItemDescription(raw: string): string {
  return cleanAugmentDescription(raw.replace(/<stats>[\s\S]*?<\/stats>/gi, ''));
}
