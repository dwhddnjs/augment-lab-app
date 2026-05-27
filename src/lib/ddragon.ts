import versionData from '@/data/version.json';

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

// iconPath comes from CDragon — e.g. "game/assets/ux/cherry/augments/icons/warmup-routine.png"
export function augmentImageUrl(iconPath: string) {
  const normalized = iconPath.toLowerCase().replace(/^\//, '');
  return `${CDRAGON_BASE}/${normalized}`;
}
