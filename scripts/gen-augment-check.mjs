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

// apply-mayhem-patch.mjs 가 남긴 패치 리포트. 없으면 배지 없이 그냥 그린다.
const diffPath = path.join(root, 'docs/augment-diff.json');
const diff = fs.existsSync(diffPath) ? JSON.parse(fs.readFileSync(diffPath, 'utf8')) : {};
const newIds = new Set(diff.newIds ?? []);
const noCoefIds = new Set((diff.noCoefficients ?? []).map((a) => a.id));
const numberDiffs = diff.numberDiffs ?? [];
const disabledNames = new Set(diff.disabled ?? []);

const merged = ko.map((a) => ({
  id: a.id,
  ko: a.name,
  en: enMap.get(a.id)?.name ?? a.name,
  rarity: a.rarity,
  iconPath: a.iconPath,
  descKo: a.description ?? '',
  descEn: enMap.get(a.id)?.description ?? '',
  modes: a.modes ?? [],
  isNew: newIds.has(a.id),
  // 게임 bin 에 계수가 없어 수치를 확정하지 못한 항목 — 눈으로 확인이 필요하다.
  noCoef: noCoefIds.has(a.id),
  disabled: disabledNames.has(enMap.get(a.id)?.name),
}));

// 같은 아이콘 파일을 공유하는 증강 식별 (검수 표시용)
const basename = (p) => p.replace(/.*\//, '').toLowerCase();
const counts = new Map();
for (const a of merged) counts.set(basename(a.iconPath), (counts.get(basename(a.iconPath)) ?? 0) + 1);
for (const a of merged) a.shared = counts.get(basename(a.iconPath)) > 1;

const rarityCounts = merged.reduce((acc, a) => ((acc[a.rarity] = (acc[a.rarity] ?? 0) + 1), acc), {});
const sharedCount = merged.filter((a) => a.shared).length;
const newCount = merged.filter((a) => a.isNew).length;
const noCoefCount = merged.filter((a) => a.noCoef).length;
const aramCount = merged.filter((a) => a.modes.includes('aram')).length;
const classicCount = merged.filter((a) => a.modes.includes('classic')).length;
const unreleasedCount = merged.filter((a) => a.modes.length === 0).length;

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
    backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 14px 24px 12px; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .stats { color: var(--text2); font-size: 13px; }
  .stats > span, .stats > b { white-space: nowrap; }
  .stats b { color: var(--text); }
  .controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; align-items: center; }
  .filters { display: grid; gap: 7px; margin-top: 10px; }
  .frow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .flabel { flex: 0 0 38px; font-size: 11px; color: var(--text3); letter-spacing: .02em; }
  .count { margin-left: auto; font-size: 12px; color: var(--text2); white-space: nowrap; }
  .count b { color: var(--text); }
  .reset { font-size: 12px; color: var(--text3); cursor: pointer; padding: 4px 6px; border-radius: 6px; }
  .reset:hover { color: var(--text); background: var(--raised); }
  input[type=search] { background: var(--raised); border: 1px solid var(--border); color: var(--text);
    border-radius: 9px; padding: 7px 12px; font-size: 13.5px; min-width: 240px; flex: 1; max-width: 420px; outline: none; }
  input[type=search]:focus { border-color: var(--mint); }
  .chip { background: var(--raised); border: 1px solid var(--border); color: var(--text2);
    border-radius: 999px; padding: 5px 12px; font-size: 12.5px; cursor: pointer; user-select: none;
    line-height: 1.35; transition: background .12s, color .12s, border-color .12s; }
  .chip:hover { border-color: #3a4a44; color: var(--text); }
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
  .nb { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px;
    background: rgba(30,215,160,.16); color: var(--mint); }
  .cb { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px;
    background: rgba(220,90,90,.16); color: #ff9a9a; }
  .db { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px;
    background: rgba(120,120,120,.18); color: var(--text3); }
  .card.isnew { border-color: rgba(30,215,160,.45); }
  .mb { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px; }
  .mb.aram { background: rgba(90,170,255,.16); color: #8fc4ff; }
  .mb.classic { background: rgba(255,180,90,.16); color: #ffc98f; }
  .mb.none { background: rgba(120,120,120,.18); color: var(--text3); }
  details.review { margin: 28px 0 0; border: 1px solid var(--border); border-radius: 12px;
    background: var(--surface); padding: 12px 16px; }
  details.review summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  details.review table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
  details.review td { border-top: 1px solid var(--border); padding: 8px 6px; vertical-align: top; }
  details.review td.n { width: 150px; color: var(--text); font-weight: 600; }
  details.review td.a { color: var(--text2); }
  details.review td.w { color: var(--text3); }
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
    <span style="color:var(--prism)">프리즘 ${rarityCounts.prismatic ?? 0}</span>
  </div>
  <div class="stats" style="margin-top:3px">
    <span style="color:#8fc4ff">칼바람 ${aramCount}</span> ·
    <span style="color:#ffc98f">클래식 ${classicCount}</span> ·
    미출시 ${unreleasedCount} ·
    <span style="color:#e89650">아이콘 공유 ${sharedCount}</span> ·
    <span style="color:var(--mint)">신규 ${newCount}</span> ·
    <span style="color:#ff9a9a">수치 미확인 ${noCoefCount}</span>
  </div>
  <div class="controls">
    <input id="q" type="search" placeholder="한글·영문 이름·설명 검색…" autocomplete="off" />
  </div>
  <div class="filters">
    <div class="frow">
      <span class="flabel">등급</span>
      <span class="chip active" data-g="rarity" data-v="all">전체</span>
      <span class="chip" data-g="rarity" data-v="silver">실버</span>
      <span class="chip" data-g="rarity" data-v="gold">골드</span>
      <span class="chip" data-g="rarity" data-v="prismatic">프리즘</span>
    </div>
    <div class="frow">
      <span class="flabel">모드</span>
      <span class="chip active" data-g="mode" data-v="all">전체</span>
      <span class="chip" data-g="mode" data-v="aram">칼바람</span>
      <span class="chip" data-g="mode" data-v="classic">클래식</span>
      <span class="chip" data-g="mode" data-v="both">양쪽 공유</span>
      <span class="chip" data-g="mode" data-v="none">미출시</span>
    </div>
    <div class="frow">
      <span class="flabel">표시</span>
      <span class="chip toggle" data-t="shared">아이콘 공유</span>
      <span class="chip toggle" data-t="isNew">신규</span>
      <span class="chip toggle" data-t="noCoef">수치 미확인</span>
      <span class="reset" id="reset">초기화</span>
      <span class="count" id="count"></span>
    </div>
  </div>
</header>
<main id="out"></main>

<script>
const DATA = ${JSON.stringify(merged)};
const NUMBER_DIFFS = ${JSON.stringify(numberDiffs)};
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
// 등급·모드는 단일 선택, 표시 플래그만 다중 토글.
// 칼바람+클래식 동시 선택은 사실상 "양쪽 공유"라 별도 항목으로 뺐다 — 토글 두 개를 켜서
// 교집합을 만들게 하는 것보다 그렇게 이름 붙여 두는 편이 무엇을 보는지 분명하다.
let rarity = 'all', mode = 'all', query = '';
const flags = { shared: false, isNew: false, noCoef: false };

function render() {
  const out = document.getElementById('out');
  let items = DATA.filter((a) => {
    if (rarity !== 'all' && a.rarity !== rarity) return false;
    if (mode === 'aram' && !a.modes.includes('aram')) return false;
    if (mode === 'classic' && !a.modes.includes('classic')) return false;
    if (mode === 'both' && a.modes.length < 2) return false;
    if (mode === 'none' && a.modes.length) return false;
    if (flags.shared && !a.shared) return false;
    if (flags.isNew && !a.isNew) return false;
    if (flags.noCoef && !a.noCoef) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = (a.ko + ' ' + a.en + ' ' + a.id + ' ' + a.descKo + ' ' + a.descEn).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  document.getElementById('count').innerHTML = '<b>' + items.length + '</b> / ' + DATA.length + '개';
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
      card.className = 'card' + (a.shared ? ' shared' : '') + (a.isNew ? ' isnew' : '');
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
        (a.modes.includes('aram') ? '<span class="mb aram">칼바람</span>' : '') +
        (a.modes.includes('classic') ? '<span class="mb classic">클래식</span>' : '') +
        (a.modes.length === 0 ? '<span class="mb none">미출시</span>' : '') +
        (a.isNew ? '<span class="nb">신규</span>' : '') +
        (a.noCoef ? '<span class="cb">수치 미확인</span>' : '') +
        (a.disabled ? '<span class="db">비활성</span>' : '') +
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

// 단일 선택 그룹(등급·모드)
document.querySelectorAll('.chip[data-g]').forEach((c) =>
  c.addEventListener('click', () => {
    const g = c.dataset.g;
    document.querySelectorAll('.chip[data-g="' + g + '"]').forEach((x) => x.classList.remove('active'));
    c.classList.add('active');
    if (g === 'rarity') rarity = c.dataset.v;
    else mode = c.dataset.v;
    render();
  }),
);

// 다중 토글(표시)
document.querySelectorAll('.chip[data-t]').forEach((c) =>
  c.addEventListener('click', () => {
    const k = c.dataset.t;
    flags[k] = !flags[k];
    c.classList.toggle('active', flags[k]);
    render();
  }),
);

document.getElementById('reset').addEventListener('click', () => {
  rarity = 'all';
  mode = 'all';
  for (const k of Object.keys(flags)) flags[k] = false;
  query = '';
  document.getElementById('q').value = '';
  document.querySelectorAll('.chip[data-t]').forEach((x) => x.classList.remove('active'));
  for (const g of ['rarity', 'mode']) {
    document.querySelectorAll('.chip[data-g="' + g + '"]').forEach((x) =>
      x.classList.toggle('active', x.dataset.v === 'all'),
    );
  }
  render();
});

// 앱 설명과 위키 수치가 엇갈리는 건들. 대개 서술 상세도 차이라 자동 반영하지 않고
// 여기 모아만 둔다 — 실제 패치 변경인지 눈으로 가려 다음 커밋에서 정리한다.
if (NUMBER_DIFFS.length) {
  const d = document.createElement('details');
  d.className = 'review';
  const rows = NUMBER_DIFFS.map((r) =>
    '<tr><td class="n">' + esc(r.name) + '</td>' +
    '<td class="a"><b>앱</b> ' + esc(r.app) + '<br><b>위키</b> <span class="w">' + esc(r.wiki) + '</span></td></tr>'
  ).join('');
  d.innerHTML = '<summary>앱 · 위키 수치가 다른 ' + NUMBER_DIFFS.length +
    '건 — 확인 필요 (자동 반영하지 않음)</summary><table>' + rows + '</table>';
  document.body.appendChild(d);
}
render();
</script>
</body>
</html>`;

const outPath = path.join(root, 'docs/augment-check.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log(`✓ ${merged.length}개 증강 → ${path.relative(root, outPath)}`);
console.log(`  실버 ${rarityCounts.silver} · 골드 ${rarityCounts.gold} · 프리즘 ${rarityCounts.prismatic} · 공유 아이콘 ${sharedCount}개`);
