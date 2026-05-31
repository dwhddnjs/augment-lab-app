#!/usr/bin/env node
/**
 * Fills Korean `name` and `description` in augments.ko.json.
 *
 * Sources (CommunityDragon, latest patch):
 *   - cherry-augments.json (ko_kr + default) → Korean augment names, matched by
 *     normalized English name → numeric id → Korean nameTRA.
 *   - lol.stringtable.json (ko_kr) → Korean descriptions, matched by the augment's
 *     internal asset slug (derived from iconPath) or by Korean name.
 *
 * Korean ARAM Mayhem augment strings live under the `kiwi_…` / `cherry_…` key
 * prefixes with optional `aram_` / `augment_` infixes, e.g.
 *   kiwi_adamant_summary, kiwi_aram_killsecured_summary, cherry_demonicclasp_summary
 *
 * Anything without a Korean match keeps its English value (fallback). Run:
 *   node scripts/fill-augment-ko.mjs
 *
 * NOTE: the stringtable is ~30MB; this is a one-off data-build script, not runtime.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const KO_PATH = path.join(root, 'src/features/augments/data/augments.ko.json');
const EN_PATH = path.join(root, 'src/features/augments/data/augments.en.json');

const CDRAGON = 'https://raw.communitydragon.org/latest';
const UA = { 'User-Agent': 'Mozilla/5.0 (augment-data-build)' };

const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9가-힣]/gi, '');

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  return res.json();
}

// Internal asset slug from iconPath, e.g.
// "/lol-game-data/.../Icons/Adamant_small.png" → "adamant"
function iconSlug(iconPath) {
  if (!iconPath) return null;
  let base = iconPath.split('/').pop() ?? '';
  base = base.replace(/\.(png|jpg|jpeg)$/i, '').replace(/_(small|large)$/i, '');
  return base.toLowerCase();
}

async function main() {
  console.log('Fetching CommunityDragon sources…');
  const [cherryKo, cherryEn, stringtable] = await Promise.all([
    getJson(`${CDRAGON}/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json`),
    getJson(`${CDRAGON}/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json`),
    getJson(`${CDRAGON}/game/ko_kr/data/menu/en_us/lol.stringtable.json`),
  ]);

  // English normalized name → Korean name (via numeric id)
  const koById = new Map(cherryKo.map((i) => [i.id, i.nameTRA]));
  const enNameToKo = new Map();
  for (const i of cherryEn) enNameToKo.set(norm(i.nameTRA), koById.get(i.id));

  // Build slug → { name, summary, tooltip } from the stringtable.
  const entries = stringtable.entries ?? stringtable;
  const slugs = new Map();
  const keyRe = /^(?:kiwi|cherry)_(?:aram_|augment_)?(.+)_(summary|tooltip|name)$/;
  for (const [key, val] of Object.entries(entries)) {
    const m = keyRe.exec(key);
    if (!m) continue;
    const [, slug, kind] = m;
    if (!slugs.has(slug)) slugs.set(slug, {});
    const rec = slugs.get(slug);
    if (rec[kind] === undefined) rec[kind] = val;
  }
  // Korean name → slug (for name-based description fallback)
  const koNameToSlug = new Map();
  for (const [slug, rec] of slugs) {
    if (rec.name) {
      const k = norm(rec.name);
      if (!koNameToSlug.has(k)) koNameToSlug.set(k, slug);
    }
  }

  function koDescFor(aug) {
    const cands = [];
    const s = iconSlug(aug.iconPath);
    if (s) cands.push(s, s.replace(/_/g, ''));
    const koName = enNameToKo.get(norm(aug.name));
    if (koName && koNameToSlug.has(norm(koName))) cands.push(koNameToSlug.get(norm(koName)));
    for (const c of cands) {
      const rec = slugs.get(c);
      if (rec && (rec.summary || rec.tooltip)) return rec.summary || rec.tooltip;
    }
    return null;
  }

  const ko = JSON.parse(readFileSync(KO_PATH, 'utf8'));
  const en = JSON.parse(readFileSync(EN_PATH, 'utf8'));
  const enById = new Map(en.map((a) => [a.id, a]));

  let nameHit = 0;
  let descHit = 0;
  const nameMiss = [];
  const descMiss = [];

  for (const aug of ko) {
    const enAug = enById.get(aug.id) ?? aug;
    const koName = enNameToKo.get(norm(enAug.name));
    if (koName) {
      aug.name = koName;
      nameHit++;
    } else {
      aug.name = enAug.name; // English fallback
      nameMiss.push(enAug.name);
    }
    const koDesc = koDescFor(enAug);
    if (koDesc) {
      aug.description = koDesc;
      descHit++;
    } else {
      aug.description = enAug.description; // English fallback
      descMiss.push(enAug.name);
    }
  }

  writeFileSync(KO_PATH, JSON.stringify(ko, null, 2) + '\n');
  console.log(`Names:        ${nameHit}/${ko.length} Korean (${nameMiss.length} EN fallback)`);
  console.log(`Descriptions: ${descHit}/${ko.length} Korean (${descMiss.length} EN fallback)`);
  if (nameMiss.length) console.log('  name fallback:', nameMiss.join(', '));
  if (descMiss.length) console.log('  desc fallback:', descMiss.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
