/**
 * Fetches champion and item data from Riot Data Dragon for ko_KR and en_US,
 * then writes JSON files to src/data/.
 *
 * Run via: npm run data:refresh
 */

import fs from 'fs';
import path from 'path';
import type { Champion } from '../../src/types/champion';
import type { Item } from '../../src/types/item';

const OUT_DIR = path.resolve(__dirname, '../../src/data');
const LOCALES = ['ko_KR', 'en_US'] as const;
const LOCALE_SUFFIX: Record<string, string> = { ko_KR: 'ko', en_US: 'en' };

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`);
  return res.json();
}

async function getLatestVersion(): Promise<string> {
  const versions: string[] = await fetchJson('https://ddragon.leagueoflegends.com/api/versions.json');
  return versions[0];
}

async function fetchChampions(version: string, locale: string): Promise<Champion[]> {
  const data = await fetchJson(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/${locale}/champion.json`
  );
  return Object.values(data.data as Record<string, any>).map((c) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    title: c.title,
    blurb: c.blurb,
    tags: c.tags,
    stats: c.stats,
    imageKey: c.image.full,
  }));
}

async function fetchItems(version: string, locale: string): Promise<Item[]> {
  const data = await fetchJson(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/${locale}/item.json`
  );
  return Object.entries(data.data as Record<string, any>)
    .filter(([, item]) => item.gold?.purchasable && item.maps?.['11'] !== false)
    .map(([id, item]) => ({
      id,
      name: item.name,
      description: item.description,
      plaintext: item.plaintext ?? '',
      gold: item.gold,
      tags: item.tags ?? [],
      stats: item.stats ?? {},
      imageKey: item.image.full,
    }));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Fetching latest Data Dragon version...');
  const version = await getLatestVersion();
  console.log(`Version: ${version}`);

  for (const locale of LOCALES) {
    const suffix = LOCALE_SUFFIX[locale];
    console.log(`\nFetching champions [${locale}]...`);
    const champions = await fetchChampions(version, locale);
    fs.writeFileSync(
      path.join(OUT_DIR, `champions.${suffix}.json`),
      JSON.stringify(champions, null, 2)
    );
    console.log(`  → ${champions.length} champions written`);

    console.log(`Fetching items [${locale}]...`);
    const items = await fetchItems(version, locale);
    fs.writeFileSync(
      path.join(OUT_DIR, `items.${suffix}.json`),
      JSON.stringify(items, null, 2)
    );
    console.log(`  → ${items.length} items written`);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'version.json'),
    JSON.stringify({ ddragonVersion: version, generatedAt: new Date().toISOString() }, null, 2)
  );
  console.log('\nDone. src/data/ updated.');
}

main().catch((e) => { console.error(e); process.exit(1); });
