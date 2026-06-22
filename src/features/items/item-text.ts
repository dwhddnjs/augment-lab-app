/**
 * 아이템 description HTML을 파싱해 툴팁 표시용 세그먼트로 변환.
 * augment-text.ts와 같은 패턴.
 *
 * DDragon description 예시:
 *   "<mainText><stats>공격력 <attention>75</attention><br>치명타 확률 <attention>25%</attention></stats><br><br></mainText>"
 */

export interface ItemTextSegment {
  text: string;
  type: 'stat' | 'attention' | 'normal';
}

/** 아이템 description을 사람이 읽기 좋은 평문으로 정리 */
export function cleanItemDescription(raw: string): string {
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

/** stat 블록(이름 + 수치 쌍)을 파싱해 세그먼트 배열로 반환 */
export function parseItemStatBlock(raw: string): ItemTextSegment[] {
  // <stats> 블록 내부 추출
  const statsMatch = raw.match(/<stats>([\s\S]*?)<\/stats>/i);
  const statsContent = statsMatch ? statsMatch[1] : '';

  // <attention> 태그를 기준으로 분리
  const segments: ItemTextSegment[] = [];
  const lineContent = statsContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/  +/g, ' ')
    .trim();

  for (const line of lineContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed) {
      segments.push({ text: trimmed, type: 'stat' });
    }
  }
  return segments;
}

/** <mainText> 이후 일반 설명(passive/active) 텍스트 추출 */
export function parseItemFlavorText(raw: string): string {
  // stats 블록 이후의 텍스트
  const afterStats = raw.replace(/<stats>[\s\S]*?<\/stats>/i, '');
  const cleaned = afterStats
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}
