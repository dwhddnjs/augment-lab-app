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

export function itemImageUrl(imageKey: string) {
  return `${CDN}/img/item/${imageKey}`;
}

// iconPath from CDragon JSON: "/lol-game-data/assets/ASSETS/..."
// CDragon serves these under plugins/rcp-be-lol-game-data/global/default/
export function augmentImageUrl(iconPath: string) {
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
