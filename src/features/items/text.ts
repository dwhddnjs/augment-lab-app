/**
 * 아이템 description 텍스트 정리.
 *
 * DDragon/CDragon 원문은 리치 텍스트다:
 *   "<mainText><stats>공격력 <attention>75</attention><br>...</stats><br><br></mainText>"
 * 화면에 따라 필요한 조각이 달라 두 갈래로 뽑는다 —
 * 스탯 줄을 따로 보여주는 곳(빌드 상세)은 `cleanItemDescription`,
 * 한 덩어리로 요약하는 곳(아레나 픽 카드)은 `itemDescriptionText`.
 */
import { cleanAugmentDescription } from '@/lib/augment-text';

/** 태그만 걷어낸 전체 평문(스탯 줄 포함). */
export function itemDescriptionText(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<mainText>/gi, '')
    .replace(/<\/mainText>/gi, '')
    .replace(/<stats>/gi, '')
    .replace(/<\/stats>/gi, '')
    .replace(/<attention>/gi, '')
    .replace(/<\/attention>/gi, '')
    .replace(/<[^>]+>/g, '') // 나머지 태그 제거
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 고유 효과만 남긴다. <stats> 블록은 스탯 요약 줄과 중복이라 걷어내고,
 * 나머지 리치 태그 정리는 증강과 동일한 클리너를 쓴다.
 */
export function cleanItemDescription(raw: string): string {
  return cleanAugmentDescription(raw.replace(/<stats>[\s\S]*?<\/stats>/gi, ''));
}

/**
 * 프리즘 아이템 description에서 스탯 블록을 제외한 고유 효과(passive/active)만
 * 한 문단으로 추출. 보강된 평문("스탯줄\n\n효과")과 CDragon HTML 원문 모두 처리한다.
 */
export function prismaticEffectSummary(raw: string): string {
  const blocks = splitBlocks(raw);
  // 첫 블록은 스탯 줄 묶음 — 나머지(효과)만 합친다. 블록이 하나뿐이면 그대로 사용.
  const effect = blocks.length > 1 ? blocks.slice(1) : blocks;
  return effect.join(' ').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * 프리즘 아이템 description에서 기본 스탯 줄 묶음만 추출(효과 제외).
 * 보강된 평문은 첫 블록이 스탯이다. 스탯 블록이 없으면 빈 문자열.
 */
export function prismaticStatSummary(raw: string): string {
  const blocks = splitBlocks(raw);
  // 효과만 있고 스탯 블록이 없는 아이템(블록 1개)은 스탯 없음 처리.
  return blocks.length > 1 ? blocks[0] : '';
}

function splitBlocks(raw: string): string[] {
  return itemDescriptionText(raw)
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
}
