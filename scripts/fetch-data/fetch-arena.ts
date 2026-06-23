/**
 * Fetches Arena ("Cherry") data from CommunityDragon → src/features/arena/data/.
 *   - augments.{ko,en}.json          rarity 0/1/2 → silver/gold/prismatic (메인 증강)
 *   - special-augments.{ko,en}.json  rarity 4 (재련 craft 옵션 + 시즌 변형)
 *   - prismatic-items.{ko,en}.json   item id 447100~447199 (아레나 전용 프리즘 아이템)
 *
 * 게임 클라이언트 설명(desc)은 <태그>와 @변수@를 포함한다.
 *   - <태그>는 strip, <br>은 줄바꿈으로
 *   - @변수@는 dataValues로 best-effort 치환(배열은 0번 인덱스, @Key*100@ 배수 지원)
 *
 * NOTE: 기존 fetch-*.ts는 src/data/로 출력하는 outdated 버전이다. 이 스크립트는
 * 실제 데이터 위치인 src/features/arena/data/로 직접 출력한다.
 *
 * Run: npx tsx scripts/fetch-data/fetch-arena.ts  (또는 npm run data:refresh)
 */
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve(__dirname, '../../src/features/arena/data');
const ARENA_LOCALES = [
  { cdragon: 'ko_kr', suffix: 'ko' },
  { cdragon: 'en_us', suffix: 'en' },
] as const;

type Rarity = 'silver' | 'gold' | 'prismatic';
const RARITY_MAP: Record<number, Rarity> = { 0: 'silver', 1: 'gold', 2: 'prismatic' };

// 아레나 프리즘 아이템 ID 대역 (검증: 447100~447123, 여유 두고 199까지)
const PRISM_MIN = 447100;
const PRISM_MAX = 447199;

interface ArenaAugment {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  iconPath: string;
}
interface SpecialAugment {
  id: string;
  name: string;
  description: string;
  iconPath: string;
}
interface PrismaticItem {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  price: number;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`);
  return res.json();
}

function slugify(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fmtNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}

// @Key@ / @Key*100@ → dataValues[Key][0] * 배수
function substituteVars(text: string, dataValues: Record<string, unknown>): string {
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(dataValues || {})) lower[k.toLowerCase()] = v;
  return text.replace(/@(\w+)(?:\*([\d.]+))?@/g, (_, key: string, mult?: string) => {
    const raw = lower[key.toLowerCase()];
    const base = Array.isArray(raw) ? raw[0] : raw;
    if (typeof base !== 'number') return '';
    return fmtNum(base * (mult ? parseFloat(mult) : 1));
  });
}

// <태그> strip + @변수@ 치환 + <br> 줄바꿈 정리
function cleanDesc(raw: string, dataValues: Record<string, unknown> = {}): string {
  return substituteVars(raw || '', dataValues)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// iconSmall("assets/ux/cherry/...") → augmentImageUrl() 호환 경로
// (/lol-game-data/assets/ 접두사를 붙이면 strip 후 /assets/... 로 정규화됨)
function augIconPath(iconSmall: string): string {
  const p = (iconSmall || '').replace(/^\/+/, '');
  return `/lol-game-data/assets/${p}`;
}

async function fetchArenaAugments(cdragonLocale: string) {
  const data = await fetchJson(
    `https://raw.communitydragon.org/latest/cdragon/arena/${cdragonLocale}.json`
  );
  const augments: any[] = data.augments || [];
  const main: ArenaAugment[] = [];
  const special: SpecialAugment[] = [];
  for (const a of augments) {
    const id = slugify(a.apiName || a.name);
    const description = cleanDesc(a.desc, a.dataValues);
    const iconPath = augIconPath(a.iconSmall);
    const rarity = RARITY_MAP[a.rarity as number];
    if (rarity) {
      main.push({ id, name: a.name, description, rarity, iconPath });
    } else {
      special.push({ id, name: a.name, description, iconPath });
    }
  }
  return { main, special };
}

async function fetchPrismaticItems(cdragonLocale: string): Promise<PrismaticItem[]> {
  // items.json의 영문 로케일은 en_us가 아니라 default 경로다.
  const itemLocale = cdragonLocale === 'en_us' ? 'default' : cdragonLocale;
  const items: any[] = await fetchJson(
    `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/${itemLocale}/v1/items.json`
  );
  return items
    .filter((i) => i.id >= PRISM_MIN && i.id <= PRISM_MAX && i.inStore)
    .map((i) => ({
      id: String(i.id),
      name: i.name,
      description: i.description || '',
      iconPath: i.iconPath,
      price: i.price ?? 0,
    }));
}

function write(file: string, data: unknown) {
  fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(data, null, 2));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { cdragon, suffix } of ARENA_LOCALES) {
    console.log(`\n[${cdragon}] 아레나 증강 fetch...`);
    const { main: aug, special } = await fetchArenaAugments(cdragon);
    write(`augments.${suffix}.json`, aug);
    write(`special-augments.${suffix}.json`, special);
    const dist = aug.reduce<Record<string, number>>((acc, a) => {
      acc[a.rarity] = (acc[a.rarity] ?? 0) + 1;
      return acc;
    }, {});
    console.log(
      `  → augments.${suffix}.json (${aug.length}) ${JSON.stringify(dist)}, ` +
        `special-augments.${suffix}.json (${special.length})`
    );

    console.log(`[${cdragon}] 프리즘 아이템 fetch...`);
    const prism = await fetchPrismaticItems(cdragon);
    write(`prismatic-items.${suffix}.json`, prism);
    console.log(`  → prismatic-items.${suffix}.json (${prism.length})`);
  }

  console.log('\nDone. src/features/arena/data/ updated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
