#!/usr/bin/env node
/**
 * Fills iconPath in augments.{ko,en}.json using CDragon cherry-augments data.
 * Run: node scripts/fill-augment-icons.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const res = await fetch(
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json',
);
const cdragonList = await res.json();

// Build lookup: normalized name → iconPath
const lookup = new Map();
for (const item of cdragonList) {
  const key = normalize(item.nameTRA);
  lookup.set(key, item.augmentSmallIconPath);
}

let filled = 0;
let missing = 0;

function processFile(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  for (const aug of data) {
    if (aug.iconPath) continue; // already set
    const key = normalize(aug.name);
    const iconPath = lookup.get(key) ?? '';
    if (iconPath) {
      aug.iconPath = iconPath;
      filled++;
    } else {
      // try id-based fallback
      const idKey = normalize(aug.id.replace(/-/g, ''));
      const fallback = lookup.get(idKey) ?? '';
      aug.iconPath = fallback;
      if (fallback) filled++;
      else {
        console.warn(`  MISS: ${aug.id} (${aug.name})`);
        missing++;
      }
    }
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

processFile(path.join(root, 'src/features/augments/data/augments.ko.json'));
processFile(path.join(root, 'src/features/augments/data/augments.en.json'));

console.log(`Done: ${filled} filled, ${missing} missing`);
