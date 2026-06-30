/**
 * 증강 데이터·아이콘 검수용 단일 HTML 페이지를 생성한다.
 *
 *   node scripts/gen-augment-check.mjs
 *   → docs/augment-check.html
 *
 * augments.{ko,en}.json 을 id 로 매칭해 병합하고, 앱의 augmentImageUrl(large)
 * 규칙과 동일하게 CDragon URL 을 만들어 199개 증강을 rarity 별로 보여준다.
 * 같은 아이콘을 공유하는 증강은 카드에 "공유" 배지로 표시해 육안 검수를 돕는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'src/features/augments/data');

const ko = JSON.parse(fs.readFileSync(path.join(dataDir, 'augments.ko.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(dataDir, 'augments.en.json'), 'utf8'));
const enMap = new Map(en.map((a) => [a.id, a]));

const merged = ko.map((a) => ({
  id: a.id,
  ko: a.name,
  en: enMap.get(a.id)?.name ?? a.name,
  rarity: a.rarity,
  iconPath: a.iconPath,
  descKo: a.description ?? '',
  descEn: enMap.get(a.id)?.description ?? '',
}));

// 같은 아이콘 파일을 공유하는 증강 식별 (검수 표시용)
const basename = (p) => p.replace(/.*\//, '').toLowerCase();
const counts = new Map();
for (const a of merged) counts.set(basename(a.iconPath), (counts.get(basename(a.iconPath)) ?? 0) + 1);
for (const a of merged) a.shared = counts.get(basename(a.iconPath)) > 1;

const rarityCounts = merged.reduce((acc, a) => ((acc[a.rarity] = (acc[a.rarity] ?? 0) + 1), acc), {});
const sharedCount = merged.filter((a) => a.shared).length;

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>증강 검수 — ${merged.length}개</title>
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
  .chip.toggle.active { background: #4a2f2f; color: #ffd9d9; border-color: #7a4a4a; }
  main { padding: 20px 24px 60px; }
  .group-title { margin: 24px 0 12px; font-size: 15px; color: var(--text2); display: flex; gap: 8px; align-items: center; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 10px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 12px; display: flex; gap: 12px; align-items: flex-start; position: relative; }
  .card.shared { border-color: #6a4a2a; }
  .icon { width: 56px; height: 56px; border-radius: 9px; flex: 0 0 56px; background: var(--raised);
    object-fit: contain; }
  .icon.err { display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text3); }
  .meta { min-width: 0; flex: 1; }
  .ko { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .en { font-size: 12px; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .desc { font-size: 13px; color: var(--text); line-height: 1.45; margin-top: 8px; white-space: pre-wrap; }
  .descEn { font-size: 12px; color: var(--text2); line-height: 1.4; margin-top: 5px; white-space: pre-wrap; }
  .badges { display: flex; gap: 6px; margin-top: 8px; }
  .rb { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px; text-transform: uppercase; }
  .rb.silver { background: rgba(185,196,204,.15); color: var(--silver); }
  .rb.gold { background: rgba(232,196,95,.15); color: var(--gold); }
  .rb.prismatic { background: rgba(201,139,255,.15); color: var(--prism); }
  .sb { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px;
    background: rgba(232,150,80,.15); color: #e89650; }
  .empty { color: var(--text3); padding: 40px; text-align: center; }
  .iconpath { font-size: 10px; color: var(--text3); margin-top: 4px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; font-family: ui-monospace, monospace; }
</style>
</head>
<body>
<header>
  <h1>증강 데이터·아이콘 검수</h1>
  <div class="stats">
    총 <b>${merged.length}</b>개 ·
    <span style="color:var(--silver)">실버 ${rarityCounts.silver ?? 0}</span> ·
    <span style="color:var(--gold)">골드 ${rarityCounts.gold ?? 0}</span> ·
    <span style="color:var(--prism)">프리즘 ${rarityCounts.prismatic ?? 0}</span> ·
    아이콘 공유 <b style="color:#e89650">${sharedCount}</b>개
  </div>
  <div class="controls">
    <input id="q" type="search" placeholder="한글·영문 이름 검색…" autocomplete="off" />
    <span class="chip active" data-r="all">전체</span>
    <span class="chip" data-r="silver">실버</span>
    <span class="chip" data-r="gold">골드</span>
    <span class="chip" data-r="prismatic">프리즘</span>
    <span class="chip toggle" id="sharedOnly">공유 아이콘만</span>
  </div>
</header>
<main id="out"></main>

<script>
const DATA = ${JSON.stringify(merged)};
const CDRAGON = 'https://raw.communitydragon.org/latest';
// 앱의 augmentImageUrl(iconPath,'large')과 동일
function iconUrl(p) {
  if (/^https?:\\/\\//i.test(p)) return p;
  const s = p.replace(/^\\/lol-game-data\\/assets/i, '').toLowerCase();
  return CDRAGON + '/game' + s.replace(/_small(\\.\\w+)$/i, '_large$1');
}
// 라이엇 컬러 원본은 접미사 없는 베이스 파일에 있다 — 앱과 동일
function iconUrlBase(p) {
  if (/^https?:\\/\\//i.test(p)) return p;
  const s = p.replace(/^\\/lol-game-data\\/assets/i, '').toLowerCase();
  return CDRAGON + '/game' + s.replace(/_small(\\.\\w+)$/i, '$1');
}
// large·base 자산이 없는 신규(Kiwi) 아이콘용 small 폴백 — 앱과 동일
function iconUrlSmall(p) {
  if (/^https?:\\/\\//i.test(p)) return p;
  const s = p.replace(/^\\/lol-game-data\\/assets/i, '').toLowerCase();
  return CDRAGON + '/plugins/rcp-be-lol-game-data/global/default' + s;
}
const RNAME = { silver: '실버', gold: '골드', prismatic: '프리즘' };
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
let rarity = 'all', sharedOnly = false, query = '';

function render() {
  const out = document.getElementById('out');
  let items = DATA.filter((a) => {
    if (rarity !== 'all' && a.rarity !== rarity) return false;
    if (sharedOnly && !a.shared) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = (a.ko + ' ' + a.en + ' ' + a.id + ' ' + a.descKo + ' ' + a.descEn).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const order = { silver: 0, gold: 1, prismatic: 2 };
  const groups = {};
  for (const a of items) (groups[a.rarity] ??= []).push(a);
  out.innerHTML = '';
  const keys = Object.keys(groups).sort((x, y) => order[x] - order[y]);
  if (!keys.length) { out.innerHTML = '<div class="empty">결과 없음</div>'; return; }
  for (const k of keys) {
    const list = groups[k].sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));
    const h = document.createElement('div');
    h.className = 'group-title';
    h.innerHTML = '<span class="rb ' + k + '">' + RNAME[k] + '</span> ' + list.length + '개';
    out.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'grid';
    for (const a of list) {
      const card = document.createElement('div');
      card.className = 'card' + (a.shared ? ' shared' : '');
      const img = document.createElement('img');
      img.className = 'icon';
      img.loading = 'lazy';
      img.src = iconUrl(a.iconPath);
      img.alt = a.ko;
      img.onerror = () => {
        const st = img.dataset.step || '0';
        if (st === '0') { img.dataset.step = '1'; img.src = iconUrlBase(a.iconPath); return; }
        if (st === '1') { img.dataset.step = '2'; img.src = iconUrlSmall(a.iconPath); return; }
        img.replaceWith(Object.assign(document.createElement('div'),
          { className: 'icon err', textContent: 'no img' }));
      };
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = '<div class="ko">' + esc(a.ko) + '</div>' +
        '<div class="en">' + esc(a.en) + '</div>' +
        '<div class="badges"><span class="rb ' + a.rarity + '">' + RNAME[a.rarity] + '</span>' +
        (a.shared ? '<span class="sb">공유</span>' : '') + '</div>' +
        '<div class="desc">' + esc(a.descKo) + '</div>' +
        '<div class="descEn">' + esc(a.descEn) + '</div>' +
        '<div class="iconpath">' + esc(a.iconPath.replace(/.*\\//, '')) + '</div>';
      card.appendChild(img);
      card.appendChild(meta);
      grid.appendChild(card);
    }
    out.appendChild(grid);
  }
}

document.getElementById('q').addEventListener('input', (e) => { query = e.target.value.trim(); render(); });
document.querySelectorAll('.chip[data-r]').forEach((c) => c.addEventListener('click', () => {
  document.querySelectorAll('.chip[data-r]').forEach((x) => x.classList.remove('active'));
  c.classList.add('active'); rarity = c.dataset.r; render();
}));
document.getElementById('sharedOnly').addEventListener('click', (e) => {
  sharedOnly = !sharedOnly; e.target.classList.toggle('active', sharedOnly); render();
});
render();
</script>
</body>
</html>`;

const outPath = path.join(root, 'docs/augment-check.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log(`✓ ${merged.length}개 증강 → ${path.relative(root, outPath)}`);
console.log(`  실버 ${rarityCounts.silver} · 골드 ${rarityCounts.gold} · 프리즘 ${rarityCounts.prismatic} · 공유 아이콘 ${sharedCount}개`);
