/**
 * 아레나 데이터·아이콘 검수용 단일 HTML 페이지를 생성한다.
 *
 *   node scripts/gen-arena-check.mjs
 *   → docs/arena-check.html
 *
 * src/features/arena/data 의 ko/en 을 id 로 매칭해 병합하고, 앱의 이미지 URL
 * 규칙(augmentImageUrl large / cdragonItemIconUrl)과 동일하게 CDragon URL 을
 * 만들어 증강(등급별)·프리즘 아이템·특수 증강을 한 페이지에서 보여준다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'src/features/arena/data');

const read = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));

// 아이템 description HTML → 평문(앱 cleanItemDescription과 동일 규칙).
const cleanItemDesc = (raw) =>
  String(raw ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// --- 증강 (rarity 0/1/2) ---
const augKo = read('augments.ko.json');
const augEn = new Map(read('augments.en.json').map((a) => [a.id, a]));
const augments = augKo.map((a) => ({
  id: a.id,
  ko: a.name,
  en: augEn.get(a.id)?.name ?? a.name,
  rarity: a.rarity,
  maxLevel: a.maxLevel ?? 1,
  iconPath: a.iconPath,
  descKo: a.description ?? '',
  descEn: augEn.get(a.id)?.description ?? '',
}));

// --- 특수 증강 (rarity 4: 재련 craft + 시즌 변형) ---
const spKo = read('special-augments.ko.json');
const spEn = new Map(read('special-augments.en.json').map((a) => [a.id, a]));
const special = spKo.map((a) => ({
  id: a.id,
  ko: a.name,
  en: spEn.get(a.id)?.name ?? a.name,
  iconPath: a.iconPath,
  descKo: a.description ?? '',
}));

// --- 프리즘 아이템 (id 447xxx) ---
const piKo = read('prismatic-items.ko.json');
const piEn = new Map(read('prismatic-items.en.json').map((i) => [i.id, i]));
const prismatic = piKo.map((i) => ({
  id: i.id,
  ko: i.name,
  en: piEn.get(i.id)?.name ?? i.name,
  iconPath: i.iconPath,
  price: i.price,
  descKo: cleanItemDesc(i.description),
}));

const rarityCounts = augments.reduce(
  (acc, a) => ((acc[a.rarity] = (acc[a.rarity] ?? 0) + 1), acc),
  {},
);
const levelableCount = augments.filter((a) => a.maxLevel > 1).length;
const fixedCount = augments.length - levelableCount;

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>아레나 검수 — 증강 ${augments.length} · 프리즘 ${prismatic.length}</title>
<style>
  :root {
    --bg: #0d1311; --surface: #131b18; --raised: #1a2420; --border: #25322d;
    --text: #e8f0ec; --text2: #9bb0a8; --text3: #6c7f78;
    --mint: #1ED7A0; --silver: #b9c4cc; --gold: #e8c45f; --prism: #c98bff;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple SD Gothic Neo", sans-serif; }
  header { position: sticky; top: 0; z-index: 10; background: rgba(13,19,17,.92);
    backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 16px 24px; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .stats { color: var(--text2); font-size: 13px; }
  .stats b { color: var(--text); }
  .controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }
  input[type=search] { background: var(--raised); border: 1px solid var(--border); color: var(--text);
    border-radius: 9px; padding: 8px 12px; font-size: 14px; min-width: 220px; outline: none; }
  input[type=search]:focus { border-color: var(--mint); }
  .chip { background: var(--raised); border: 1px solid var(--border); color: var(--text2);
    border-radius: 999px; padding: 6px 14px; font-size: 13px; cursor: pointer; user-select: none; }
  .chip.active { background: var(--mint); color: #06231b; border-color: var(--mint); font-weight: 600; }
  main { padding: 20px 24px 60px; }
  .group-title { margin: 24px 0 12px; font-size: 15px; color: var(--text2); display: flex; gap: 8px; align-items: center; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 10px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 12px; display: flex; gap: 12px; align-items: flex-start; position: relative; }
  .icon { width: 56px; height: 56px; border-radius: 9px; flex: 0 0 56px; background: var(--raised);
    object-fit: contain; }
  .icon.err { display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text3); }
  .meta { min-width: 0; flex: 1; }
  .ko { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .en { font-size: 12px; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .desc { font-size: 13px; color: var(--text); line-height: 1.45; margin-top: 8px; white-space: pre-wrap; }
  .badges { display: flex; gap: 6px; margin-top: 8px; align-items: center; }
  .rb { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px; text-transform: uppercase; }
  .rb.silver { background: rgba(185,196,204,.15); color: var(--silver); }
  .rb.gold { background: rgba(232,196,95,.15); color: var(--gold); }
  .rb.prismatic { background: rgba(201,139,255,.15); color: var(--prism); }
  .lvl { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px;
    background: rgba(30,215,160,.14); color: var(--mint); letter-spacing: -.5px; }
  .lvl.nolvl { background: rgba(108,127,120,.18); color: var(--text3); letter-spacing: 0; }
  .price { font-size: 12px; color: var(--gold); font-weight: 700; }
  .empty { color: var(--text3); padding: 40px; text-align: center; }
  .iconpath { font-size: 10px; color: var(--text3); margin-top: 4px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; font-family: ui-monospace, monospace; }
</style>
</head>
<body>
<header>
  <h1>아레나 데이터·아이콘 검수</h1>
  <div class="stats">
    증강 <b>${augments.length}</b>개 ·
    <span style="color:var(--silver)">실버 ${rarityCounts.silver ?? 0}</span> ·
    <span style="color:var(--gold)">골드 ${rarityCounts.gold ?? 0}</span> ·
    <span style="color:var(--prism)">프리즘 ${rarityCounts.prismatic ?? 0}</span> ·
    프리즘 아이템 <b>${prismatic.length}</b>개 · 특수 증강 <b>${special.length}</b>개
    <br /><span style="color:var(--mint)">레벨업 가능 ${levelableCount}</span> ·
    <span style="color:var(--text3)">레벨업 불가 ${fixedCount}</span>
  </div>
  <div class="controls">
    <input id="q" type="search" placeholder="한글·영문 이름 검색…" autocomplete="off" />
    <span class="chip active" data-v="all">전체</span>
    <span class="chip" data-v="silver">실버</span>
    <span class="chip" data-v="gold">골드</span>
    <span class="chip" data-v="prismatic">프리즘</span>
    <span class="chip" data-v="items">프리즘 아이템</span>
    <span class="chip" data-v="special">특수 증강</span>
  </div>
</header>
<main id="out"></main>

<script>
const AUG = ${JSON.stringify(augments)};
const SPECIAL = ${JSON.stringify(special)};
const PRISM = ${JSON.stringify(prismatic)};
const CDRAGON = 'https://raw.communitydragon.org/latest';
// 앱의 augmentImageUrl(iconPath,'large')
function augUrl(p) {
  const s = p.replace(/^\\/lol-game-data\\/assets/i, '').toLowerCase();
  return CDRAGON + '/game' + s.replace(/_small(\\.\\w+)$/i, '_large$1');
}
function augUrlSmall(p) {
  const s = p.replace(/^\\/lol-game-data\\/assets/i, '').toLowerCase();
  return CDRAGON + '/plugins/rcp-be-lol-game-data/global/default' + s;
}
// 앱의 cdragonItemIconUrl(iconPath)
function itemUrl(p) {
  const s = p.replace(/^\\/lol-game-data\\/assets/i, '').toLowerCase();
  return CDRAGON + '/plugins/rcp-be-lol-game-data/global/default' + s;
}
const RNAME = { silver: '실버', gold: '골드', prismatic: '프리즘' };
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
let view = 'all', query = '';

function matchQ(a) {
  if (!query) return true;
  const q = query.toLowerCase();
  return ((a.ko || '') + ' ' + (a.en || '') + ' ' + (a.id || '') + ' ' + (a.descKo || '')).toLowerCase().includes(q);
}

function augCard(a, isItem) {
  const card = document.createElement('div');
  card.className = 'card';
  const img = document.createElement('img');
  img.className = 'icon';
  img.loading = 'lazy';
  img.src = isItem ? itemUrl(a.iconPath) : augUrl(a.iconPath);
  img.alt = a.ko;
  img.onerror = () => {
    if (!isItem && !img.dataset.fb) { img.dataset.fb = '1'; img.src = augUrlSmall(a.iconPath); return; }
    img.replaceWith(Object.assign(document.createElement('div'),
      { className: 'icon err', textContent: 'no img' }));
  };
  const meta = document.createElement('div');
  meta.className = 'meta';
  let badge = '';
  if (a.rarity) {
    badge = '<span class="rb ' + a.rarity + '">' + RNAME[a.rarity] + '</span>';
    badge += a.maxLevel > 1
      ? '<span class="lvl">' + '★'.repeat(a.maxLevel) + ' 최대 ' + a.maxLevel + '레벨</span>'
      : '<span class="lvl nolvl">레벨업 불가</span>';
  } else if (a.price != null) {
    badge = '<span class="price">' + a.price + 'G</span>';
  }
  meta.innerHTML = '<div class="ko">' + esc(a.ko) + '</div>' +
    '<div class="en">' + esc(a.en || '') + '</div>' +
    '<div class="badges">' + badge + '</div>' +
    '<div class="desc">' + esc(a.descKo) + '</div>' +
    '<div class="iconpath">' + esc(a.iconPath.replace(/.*\\//, '')) + '</div>';
  card.appendChild(img);
  card.appendChild(meta);
  return card;
}

function section(title, list, isItem) {
  const h = document.createElement('div');
  h.className = 'group-title';
  h.textContent = title + ' · ' + list.length + '개';
  const grid = document.createElement('div');
  grid.className = 'grid';
  for (const a of list) grid.appendChild(augCard(a, isItem));
  return [h, grid];
}

function render() {
  const out = document.getElementById('out');
  out.innerHTML = '';
  const order = { silver: 0, gold: 1, prismatic: 2 };
  const showAug = view === 'all' || ['silver', 'gold', 'prismatic'].includes(view);
  const showItems = view === 'all' || view === 'items';
  const showSpecial = view === 'all' || view === 'special';
  let any = false;

  if (showAug) {
    const groups = {};
    for (const a of AUG.filter(matchQ)) {
      if (['silver', 'gold', 'prismatic'].includes(view) && a.rarity !== view) continue;
      (groups[a.rarity] ??= []).push(a);
    }
    for (const k of Object.keys(groups).sort((x, y) => order[x] - order[y])) {
      const list = groups[k].sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));
      section(RNAME[k] + ' 증강', list, false).forEach((n) => out.appendChild(n));
      any = true;
    }
  }
  if (showItems) {
    const list = PRISM.filter(matchQ).sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));
    if (list.length) { section('프리즘 아이템', list, true).forEach((n) => out.appendChild(n)); any = true; }
  }
  if (showSpecial) {
    const list = SPECIAL.filter(matchQ).sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));
    if (list.length) { section('특수 증강 (재련·시즌 변형)', list, false).forEach((n) => out.appendChild(n)); any = true; }
  }
  if (!any) out.innerHTML = '<div class="empty">결과 없음</div>';
}

document.getElementById('q').addEventListener('input', (e) => { query = e.target.value.trim(); render(); });
document.querySelectorAll('.chip[data-v]').forEach((c) => c.addEventListener('click', () => {
  document.querySelectorAll('.chip[data-v]').forEach((x) => x.classList.remove('active'));
  c.classList.add('active'); view = c.dataset.v; render();
}));
render();
</script>
</body>
</html>`;

const outPath = path.join(root, 'docs/arena-check.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log(`✓ 증강 ${augments.length} · 프리즘 ${prismatic.length} · 특수 ${special.length} → ${path.relative(root, outPath)}`);
console.log(`  실버 ${rarityCounts.silver} · 골드 ${rarityCounts.gold} · 프리즘 ${rarityCounts.prismatic}`);
