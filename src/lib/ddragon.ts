import versionData from '@/lib/version.json';

const BASE = 'https://ddragon.leagueoflegends.com';
const CDN = `${BASE}/cdn/${versionData.ddragonVersion}`;
const CDRAGON_BASE = 'https://raw.communitydragon.org/latest';

export function championSquareUrl(imageKey: string) {
  return `${CDN}/img/champion/${imageKey}`;
}

export function championLoadingUrl(champId: string) {
  return `${BASE}/cdn/img/champion/loading/${champId}_0.jpg`;
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
// - 'small' (64px) is served under the rcp-be-lol-game-data plugin root.
// - 'large' (256px) lives under CDragon's `game/` asset root, with the
//   filename suffix swapped from `_small` to `_large`.
export function augmentImageUrl(iconPath: string, size: 'small' | 'large' = 'large') {
  const stripped = iconPath.replace(/^\/lol-game-data\/assets/i, '').toLowerCase();
  if (size === 'large') {
    const large = stripped.replace(/_small(\.\w+)$/i, '_large$1');
    return `${CDRAGON_BASE}/game${large}`;
  }
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
