const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function toChoseong(str: string): string {
  let out = '';
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      out += CHOSEONG[Math.floor((code - 0xAC00) / 588)];
    } else {
      out += ch;
    }
  }
  return out;
}

/** 이름 부분일치 + 한글 초성 검색. 챔피언·증강 등 이름이면 무엇이든 받는다. */
export function matchName(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (name.toLowerCase().includes(q)) return true;
  if (/^[ㄱ-ㅎ\s]+$/.test(query.trim())) {
    return toChoseong(name).includes(query.trim());
  }
  return false;
}
