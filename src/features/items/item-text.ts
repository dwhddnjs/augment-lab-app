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

/**
 * 프리즘 아이템 description에서 스탯 블록을 제외한 고유 효과(passive/active)만
 * 한 문단으로 추출. 보강된 평문("스탯줄\n\n효과")과 CDragon HTML 원문 모두 처리한다.
 */
export function prismaticEffectSummary(raw: string): string {
  const clean = cleanItemDescription(raw);
  const blocks = clean.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  // 첫 블록은 스탯 줄 묶음 — 나머지(효과)만 합친다. 블록이 하나뿐이면 그대로 사용.
  const effect = blocks.length > 1 ? blocks.slice(1) : blocks;
  return effect.join(" ").replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

/**
 * 프리즘 아이템 description에서 기본 스탯 줄 묶음만 추출(효과 제외).
 * 보강된 평문은 첫 블록이 스탯이다. 스탯 블록이 없으면 빈 문자열.
 */
export function prismaticStatSummary(raw: string): string {
  const clean = cleanItemDescription(raw);
  const blocks = clean.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  // 효과만 있고 스탯 블록이 없는 아이템(블록 1개)은 스탯 없음 처리.
  return blocks.length > 1 ? blocks[0] : "";
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
