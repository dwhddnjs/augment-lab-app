const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function toChoseong(str: string): string {
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

export function matchChampionName(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (name.toLowerCase().includes(q)) return true;
  if (/^[ㄱ-ㅎ\s]+$/.test(query.trim())) {
    return toChoseong(name).includes(query.trim());
  }
  return false;
}
