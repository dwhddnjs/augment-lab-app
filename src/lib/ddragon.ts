import versionData from '@/lib/version.json';

const BASE = 'https://ddragon.leagueoflegends.com';
const CDN = `${BASE}/cdn/${versionData.ddragonVersion}`;
const CDRAGON_BASE = 'https://raw.communitydragon.org/latest';

export function championSquareUrl(imageKey: string) {
  return `${CDN}/img/champion/${imageKey}`;
}

// 와이드 splash 아트(1215×717). 가로 배너/히어로에 cover+center로 넣으면
// 세로 loading 아트보다 얼굴·상체 구도가 챔피언 간 일관적이다.
export function championSplashUrl(champId: string) {
  return `${BASE}/cdn/img/champion/splash/${champId}_0.jpg`;
}

export function itemImageUrl(imageKey: string) {
  return `${CDN}/img/item/${imageKey}`;
}

// iconPath from CDragon JSON: "/lol-game-data/assets/ASSETS/..."
// 같은 아이콘이 CDragon `game/` 루트 아래 세 변형으로 존재할 수 있다. 호출측
// (AugmentImage)이 large → base → small 순으로 폴백하며 첫 성공 URL을 쓴다.
// - 'large' (256px): 파일명 접미사를 `_small` → `_large` 로 치환.
// - 'base'  (컬러 원본): 라이엇이 실제로 가리키는 컬러 아이콘은 접미사 없는
//   베이스 파일(silver_spoon.png 등)에 있다. `_large` 가 없는(404) 증강은
//   여기서 컬러를 얻는다. `_small` 접미사를 제거.
// - 'small' (64px): rcp-be-lol-game-data 플러그인 루트의 원본 `_small` 경로.
export function augmentImageUrl(iconPath: string, size: 'small' | 'base' | 'large' = 'large') {
  const stripped = iconPath.replace(/^\/lol-game-data\/assets/i, '').toLowerCase();
  if (size === 'large') {
    const large = stripped.replace(/_small(\.\w+)$/i, '_large$1');
    return `${CDRAGON_BASE}/game${large}`;
  }
  if (size === 'base') {
    const base = stripped.replace(/_small(\.\w+)$/i, '$1');
    return `${CDRAGON_BASE}/game${base}`;
  }
  return `${CDRAGON_BASE}/plugins/rcp-be-lol-game-data/global/default${stripped}`;
}

// 아레나 프리즘 아이템(id 447xxx)은 ddragon에 없고 CDragon에만 존재한다.
// iconPath: "/lol-game-data/assets/ASSETS/Items/Icons2D/7100_MirageBlade.png"
export function cdragonItemIconUrl(iconPath: string) {
  const stripped = iconPath.replace(/^\/lol-game-data\/assets/i, '').toLowerCase();
  return `${CDRAGON_BASE}/plugins/rcp-be-lol-game-data/global/default${stripped}`;
}

const CLASS_ICON_KEYS: Record<string, string> = {
  Fighter: 'fighter',
  Mage: 'mage',
  Assassin: 'assassin',
  Tank: 'tank',
  Marksman: 'marksman',
  Support: 'support',
};

export function championClassIconUrl(tag: string): string | null {
  const key = CLASS_ICON_KEYS[tag];
  if (!key) return null;
  return `${CDRAGON_BASE}/plugins/rcp-fe-lol-static-assets/global/default/npe-ft-role-icon-${key}.png`;
}
