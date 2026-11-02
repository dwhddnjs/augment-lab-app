/**
 * 헤드라이너 문구의 색 표기 — "[s]스킬[/s] [e]강화[/e]!" 처럼 같은 키로 열고 닫은 구간. 중첩은 없다.
 * 카드 렌더(renderMarked)·평문 표시(stripMarks)·검사(check-headliners)가 모두 이 파서 하나를 쓴다.
 * 짝이 안 맞거나 중첩된 표기는 대괄호가 든 평문 조각으로 남아 검사에서 걸린다.
 */
const MARK_RE = /\[(\w+)\](.*?)\[\/\1\]/g;

export interface MarkedPart {
  text: string;
  mark?: string;
}

export function parseMarked(text: string): MarkedPart[] {
  const parts: MarkedPart[] = [];
  let last = 0;
  for (const m of text.matchAll(MARK_RE)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[2], mark: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function stripMarks(text: string): string {
  return parseMarked(text)
    .map((p) => p.text)
    .join("");
}
