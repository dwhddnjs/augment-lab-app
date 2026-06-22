/**
 * Fetches ARAM Mayhem augment data from the League of Legends Wiki
 * (Module:MayhemAugmentData/data) and writes to src/data/augments.{ko,en}.json.
 *
 * NOTE: The wiki stores augments in Lua table format. This script uses the
 * MediaWiki API to get raw Lua source, then parses it with regex.
 * If parsing breaks on a patch, fall back to manual augments.json editing.
 */

import fs from 'fs';
import path from 'path';
import type { Augment, AugmentRarity } from '../../src/types/augment';

const OUT_DIR = path.resolve(__dirname, '../../src/data');
const WIKI_API = 'https://wiki.leagueoflegends.com/en-us/api.php';

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`);
  return res.json();
}

async function fetchLuaModule(moduleName: string): Promise<string> {
  const params = new URLSearchParams({
    action: 'query',
    titles: `Module:${moduleName}`,
    prop: 'revisions',
    rvprop: 'content',
    format: 'json',
    formatversion: '2',
  });
  const data = await fetchJson(`${WIKI_API}?${params}`);
  const page = data.query.pages[0];
  if (!page || page.missing) throw new Error(`Wiki module not found: ${moduleName}`);
  return page.revisions[0].content as string;
}

function parseRarity(raw: string): AugmentRarity {
  const lower = raw.toLowerCase();
  if (lower.includes('prismatic')) return 'prismatic';
  if (lower.includes('gold')) return 'gold';
  return 'silver';
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Strip wiki markup from description: {{as|stat}} → stat, {{pp|1|2}} → 1/2, etc.
function stripWikiMarkup(text: string): string {
  return text
    .replace(/\{\{pp\|([^}]+)\}\}/g, (_, vals) => vals.split('|').join('/'))
    .replace(/\{\{[^|}]+\|([^}]+)\}\}/g, '$1')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .trim();
}

// Extract the content of a top-level brace block starting at `start` index.
// Returns [content, endIndex] where content is inside the outer { }.
function extractBraceBlock(src: string, start: number): [string, number] {
  let depth = 0;
  let i = start;
  let bodyStart = -1;
  while (i < src.length) {
    if (src[i] === '{') {
      depth++;
      if (depth === 1) bodyStart = i + 1;
    } else if (src[i] === '}') {
      depth--;
      if (depth === 0) return [src.slice(bodyStart, i), i];
    }
    i++;
  }
  return ['', src.length];
}

function parseLuaAugments(lua: string): Augment[] {
  const augments: Augment[] = [];

  // Wiki Lua format: ["Augment Name"] = { ["tier"] = "Silver", ["description"] = "...", ... }
  // Find each top-level entry header, then extract block with brace counting.
  const headerRe = /\["([^"]+)"\]\s*=\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = headerRe.exec(lua)) !== null) {
    const name = match[1];
    // Back up to the opening brace
    const blockStart = match.index + match[0].length - 1;
    const [block] = extractBraceBlock(lua, blockStart);

    const getField = (key: string): string => {
      const quoted = new RegExp(`\\["${key}"\\]\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(block);
      if (quoted) return quoted[1];
      const longStr = new RegExp(`\\["${key}"\\]\\s*=\\s*\\[=\\[([\\s\\S]*?)]=\\]`).exec(block);
      if (longStr) return longStr[1].trim();
      return '';
    };

    const tier = getField('tier');
    const description = getField('description');
    if (!tier) continue;

    augments.push({
      id: slugify(name),
      name,
      description: stripWikiMarkup(description),
      rarity: parseRarity(tier),
      iconPath: '',
    });
  }

  return augments;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Fetching ARAM Mayhem augment data from wiki...');
  let augments: Augment[] = [];

  try {
    const lua = await fetchLuaModule('MayhemAugmentData/data');
    augments = parseLuaAugments(lua);
    console.log(`  Parsed ${augments.length} augments from wiki`);
  } catch (e) {
    console.warn('  Wiki fetch/parse failed:', (e as Error).message);
    console.warn('  Writing empty augments. Edit src/data/augments.en.json manually.');
  }

  // Both locales share the same file for now (augment descriptions are English on wiki)
  // When Korean translations are available, add a separate pass.
  const json = JSON.stringify(augments, null, 2);
  fs.writeFileSync(path.join(OUT_DIR, 'augments.en.json'), json);
  fs.writeFileSync(path.join(OUT_DIR, 'augments.ko.json'), json);
  console.log('  → augments.en.json and augments.ko.json written');
}

main().catch((e) => { console.error(e); process.exit(1); });
