/**
 * 증강연구서 데이터 검수용 단일 HTML 페이지를 생성한다.
 *
 *   node scripts/gen-data-check.mjs
 *   → docs/index.html
 *
 * 칼바람·클래식 증강 / 아레나 증강 / 특수 증강 / 아이템 / 프리즘 아이템을 ko·en 을
 * id 로 병합해 한 페이지에 담고, 앱과 동일한 이미지 URL 규칙(augmentImageUrl ·
 * cdragonItemIconUrl · itemImageUrl)으로 아이콘을 렌더한다. 데이터셋은 상단 칩으로
 * 가르고, 그 아래 모드·등급·표시 행은 고른 데이터셋에 맞는 것만 남는다.
 *
 * 예전엔 gen-augment-check(칼바람) · gen-arena-check(아레나) · gen-check-index(진입점)
 * 셋으로 나뉘어 있었다. 셋이 CSS 팔레트와 아이콘 URL 규칙을 각자 복붙해 들고 있었고
 * 진입점 개수는 손으로 적혀 있어 조용히 낡았다 — 그래서 하나로 합쳤다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const readIf = (p) => (fs.existsSync(path.join(root, p)) ? readJson(p) : null);

// ─────────────────────────── 텍스트 정리 ───────────────────────────

/** src/lib/augment-text.ts 의 cleanAugmentDescription 과 같은 규칙. */
const cleanAugmentDesc = (raw) =>
  String(raw ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\(%i:[^%]*%\)/g, '')
    .replace(/%i:[^%]*%/g, '')
    .replace(/@[^@]+@%?/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\|[a-zA-Z]+/g, '')
    .replace(/;[^|<\s]+/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+([.,%)])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();

/** 아이템 description HTML → 평문(앱 cleanItemDescription 과 같은 규칙). */
const cleanItemDesc = (raw) =>
  String(raw ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// ────────────────────── 카드 설명 줄수 추정 ──────────────────────
//
// 증강 카드는 폰트를 고정한다(rarity-card-frame.tsx: fontSize 8 · numberOfLines 6).
// 그래서 설명이 길면 UI 가 아니라 데이터가 잘린다. 여기서 몇 줄이 되는지 미리
// 재서 검수 페이지에 배지로 띄운다 — 글자 수만 세면 명시적 줄바꿈이 있는 설명을
// 놓친다(129자짜리가 9줄이 되는 식).

/** iPhone 15 가로 기준 설명 폭: cardWidth 141 − framePad 8×2 − content 4×2 − desc 4×2. */
const CARD_DESC_WIDTH = 109;
/** rarity-card-frame.tsx 의 numberOfLines. */
const CARD_DESC_LINES = 6;

// 프리즘 아이템 카드(arena-prismatic-card)는 증강 카드와 규칙이 다르다 — 스탯 줄과
// 효과 줄이 따로고 numberOfLines 가 각각 4·6 이다. 다만 둘이 한 카드 세로를 나눠 쓰므로
// 스탯이 넉 줄까지 가면 효과에 남는 건 다섯 줄이다.
const prismFits = (statLines, effLines) =>
  (statLines <= 3 && effLines <= 6) || (statLines === 4 && effLines <= 5);

// ponytail: 폰트 메트릭 근사(8pt SF Pro). 시뮬레이터와 어긋나면 여기 숫자만 조정한다.
const charWidth = (ch) => {
  const c = ch.codePointAt(0);
  if (ch === ' ') return 2.2;
  if (c >= 0x3000 && c <= 0xd7a3) return 8; // 한글·CJK
  if (/[0-9]/.test(ch)) return 4.5;
  if (/[A-Z]/.test(ch)) return 5.4;
  if (/[a-z]/.test(ch)) return 4.3;
  if (/[.,;:!?()%]/.test(ch)) return 2.4;
  return 2.6;
};

/**
 * 정리된 설명이 카드에서 차지하는 줄 수. 어절 단위 탐욕 줄바꿈이고, 한 어절이
 * 폭보다 길면 글자에서 끊는다(iOS 의 한글 어절 우선 줄바꿈과 같은 모델).
 */
function estimateCardLines(text, maxW = CARD_DESC_WIDTH) {
  let lines = 0;
  for (const para of String(text).split('\n')) {
    lines++;
    let cur = 0;
    for (const tok of para.split(/(\s+)/)) {
      if (!tok) continue;
      let tw = 0;
      for (const ch of tok) tw += charWidth(ch);
      if (tw > maxW) {
        for (const ch of tok) {
          const cw = charWidth(ch);
          if (cur + cw > maxW) { lines++; cur = 0; }
          cur += cw;
        }
        continue;
      }
      if (cur + tw > maxW) { lines++; cur = tw; } else cur += tw;
    }
  }
  return lines;
}

// ─────────────────────────── 데이터 로드 ───────────────────────────

// 손으로 설명을 고친 항목. 아레나와 칼바람은 id 가 99개 겹치므로 데이터셋 키로 나눈다.
// ponytail: 사유 없는 id 배열. 필요해지면 원소를 {id, why} 객체로 승격한다.
const edited = readIf('docs/desc-edited.json') ?? {};
const editedSet = (k) => new Set(edited[k] ?? []);

// apply-mayhem-patch.mjs 가 남긴 패치 리포트(칼바람 전용). 없으면 배지 없이 그린다.
const diff = readIf('docs/augment-diff.json') ?? {};
const newIds = new Set(diff.newIds ?? []);
const noCoefIds = new Set((diff.noCoefficients ?? []).map((a) => a.id));
const numberDiffs = diff.numberDiffs ?? [];
// disabled 는 {id, name} 목록이다. 이름으로 맞추면 CDragon 의 동명이인 115쌍에서
// 엉뚱한 증강에 배지가 붙거나, 개명된 증강이 배지를 조용히 잃는다 — 매칭 키는 늘 id 다.
const disabledIds = new Set((diff.disabled ?? []).map((d) => d.id).filter(Boolean));

const byId = (list) => new Map(list.map((x) => [x.id, x]));

/** ko 기준으로 en 을 id 로 붙이고, 설명은 정리해 줄수까지 재서 넘긴다. */
function mergeAugments(koList, enList, editedIds, extra = () => ({})) {
  const en = byId(enList);
  return koList.map((a) => {
    const descKo = cleanAugmentDesc(a.description);
    const descEn = cleanAugmentDesc(en.get(a.id)?.description ?? '');
    return {
      id: a.id,
      ko: a.name,
      en: en.get(a.id)?.name ?? a.name,
      rarity: a.rarity,
      iconPath: a.iconPath,
      descKo,
      descEn,
      lnKo: estimateCardLines(descKo),
      lnEn: estimateCardLines(descEn),
      clip:
        estimateCardLines(descKo) > CARD_DESC_LINES ||
        estimateCardLines(descEn) > CARD_DESC_LINES,
      edited: editedIds.has(a.id),
      ...extra(a),
    };
  });
}

// --- 칼바람·클래식 증강 ---
const aug = mergeAugments(
  readJson('src/features/augments/data/augments.ko.json'),
  readJson('src/features/augments/data/augments.en.json'),
  editedSet('aram'),
  (a) => ({
    modes: a.modes ?? [],
    isNew: newIds.has(a.id),
    // 게임 bin 에 계수가 없어 수치를 확정하지 못한 항목 — 눈으로 확인이 필요하다.
    noCoef: noCoefIds.has(a.id),
    disabled: disabledIds.has(a.id),
  }),
);

// --- 아레나 증강 ---
const arena = mergeAugments(
  readJson('src/features/arena/data/augments.ko.json'),
  readJson('src/features/arena/data/augments.en.json'),
  editedSet('arena'),
  (a) => ({ maxLevel: a.maxLevel ?? 1 }),
);

// --- 특수 증강 (원본 rarity 4: 재련 craft + 시즌 변형) ---
// rarity 가 없다. 앱도 arena-reforge-card 에서 골드 프레임으로 통일해 그린다.
const special = mergeAugments(
  readJson('src/features/arena/data/special-augments.ko.json'),
  readJson('src/features/arena/data/special-augments.en.json'),
  editedSet('special'),
);

// --- 아이템 (앱 진열 풀만) ---
// 전체 404개 중 조회용 212개는 저장된 빌드를 되살릴 때만 쓰여 카드로 뜨지 않는다.
const aramIds = new Set(readJson('src/features/items/data/aram-item-ids.json'));
const classicIds = new Set(readJson('src/features/items/data/classic-item-ids.json'));
// 아레나는 협곡(칼바람) 완성 아이템 풀을 그대로 쓴다 — arena-shop.tsx 와 같은 규칙.
// 지금은 제외 목록이 칼바람 풀과 겹치지 않아 두 풀이 같은 111개지만, 규칙을 그대로
// 옮겨 둬야 라이엇이 갈라놓는 순간 개수가 갈라져 눈에 띈다.
const EXCLUDED_BOOT_IDS = new Set(['1001', '3168', '3170', '3171', '3173', '3174', '3175']);
const itemEn = byId([
  ...readJson('src/features/items/data/items.en.json'),
  ...readJson('src/features/items/data/classic-items.en.json'),
]);
const items = [
  ...readJson('src/features/items/data/items.ko.json'),
  ...readJson('src/features/items/data/classic-items.ko.json'),
]
  .filter((it) => aramIds.has(it.id) || classicIds.has(it.id))
  .map((it) => {
    const boots = it.tags.includes('Boots');
    const inArena =
      aramIds.has(it.id) && it.gold.purchasable && !(boots && EXCLUDED_BOOT_IDS.has(it.id));
    return {
      id: it.id,
      ko: it.name,
      en: itemEn.get(it.id)?.name ?? it.name,
      imageKey: it.imageKey,
      gold: it.gold.total,
      boots,
      descKo: cleanItemDesc(it.description),
      descEn: cleanItemDesc(itemEn.get(it.id)?.description),
      modes: aramIds.has(it.id) ? ['aram', ...(inArena ? ['arena'] : [])] : ['classic'],
    };
  });

// --- 프리즘 아이템 (id 447xxx, 아레나 전용) ---
// 카드가 스탯 블록과 효과 블록을 따로 그리므로(앱의 prismaticStatSummary /
// prismaticEffectSummary) 줄수도 블록별로 잰다.
const prismBlocks = (raw) => cleanItemDesc(raw).split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
const prismStats = (raw) => { const b = prismBlocks(raw); return b.length > 1 ? b[0].replace(/\n/g, ' · ') : ''; };
const prismEffect = (raw) => {
  const b = prismBlocks(raw);
  return (b.length > 1 ? b.slice(1) : b).join(' ').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
};
const prismEn = byId(readJson('src/features/arena/data/prismatic-items.en.json'));
const prismEdited = editedSet('prism');
const prism = readJson('src/features/arena/data/prismatic-items.ko.json').map((i) => {
  const enRaw = prismEn.get(i.id)?.description ?? '';
  const ln = {
    lnStatKo: estimateCardLines(prismStats(i.description)),
    lnEffKo: estimateCardLines(prismEffect(i.description)),
    lnStatEn: estimateCardLines(prismStats(enRaw)),
    lnEffEn: estimateCardLines(prismEffect(enRaw)),
  };
  return {
    id: i.id,
    ko: i.name,
    en: prismEn.get(i.id)?.name ?? i.name,
    iconPath: i.iconPath,
    price: i.price,
    descKo: cleanItemDesc(i.description),
    descEn: cleanItemDesc(enRaw),
    ...ln,
    edited: prismEdited.has(i.id),
    clip: !prismFits(ln.lnStatKo, ln.lnEffKo) || !prismFits(ln.lnStatEn, ln.lnEffEn),
  };
});

// 같은 아이콘 파일을 공유하는 증강 식별 (오류가 아니라 검수 표시용)
const basename = (p) => p.replace(/.*\//, '').toLowerCase();
for (const list of [aug, arena, special]) {
  const counts = new Map();
  for (const a of list) counts.set(basename(a.iconPath), (counts.get(basename(a.iconPath)) ?? 0) + 1);
  for (const a of list) a.shared = counts.get(basename(a.iconPath)) > 1;
}

// ─────────────────────────── 집계 ───────────────────────────

const n = (list, fn) => list.filter(fn).length;
const rarity = (list, r) => n(list, (a) => a.rarity === r);
const clipped = (list) => n(list, (a) => a.clip);
const augLike = [...aug, ...arena, ...special];

const stat = {
  aram: n(aug, (a) => a.modes.includes('aram')),
  classic: n(aug, (a) => a.modes.includes('classic')),
  both: n(aug, (a) => a.modes.length >= 2),
  none: n(aug, (a) => a.modes.length === 0),
  itemAram: n(items, (i) => i.modes.includes('aram')),
  itemClassic: n(items, (i) => i.modes.includes('classic')),
  itemArena: n(items, (i) => i.modes.includes('arena')),
  shared: n(augLike, (a) => a.shared),
  isNew: n(aug, (a) => a.isNew),
  noCoef: n(aug, (a) => a.noCoef),
  edited: n(augLike, (a) => a.edited) + n(prism, (p) => p.edited),
  clipKo: n(augLike, (a) => a.lnKo > CARD_DESC_LINES),
  clipEn: n(augLike, (a) => a.lnEn > CARD_DESC_LINES),
  clipPrism: n(prism, (p) => p.clip),
};

// script 블록 안에 넣는 값은 < 를 유니코드로 이스케이프한다. 설명에 </script> 나
// <!-- 가 섞이면 브라우저가 거기서 script 를 끊어 페이지가 통째로 빈다.
// JSON 파서에게 < 와 < 는 같은 문자라 데이터 의미는 그대로다.
const embed = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

const DDRAGON_VERSION = readJson('src/lib/version.json').ddragonVersion;

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>증강연구서 데이터 검수 — 증강 ${aug.length + arena.length + special.length} · 아이템 ${items.length + prism.length}</title>
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
  .controls { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; align-items: center; }
  .filters { display: grid; gap: 7px; margin-top: 10px; }
  .frow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .frow.hide { display: none; }
  .flabel { flex: 0 0 44px; font-size: 11px; color: var(--text3); letter-spacing: .02em; }
  .count { font-size: 12px; color: var(--text2); white-space: nowrap; }
  .count b { color: var(--text); }
  .reset { font-size: 12px; color: var(--text3); cursor: pointer; padding: 4px 8px; border-radius: 6px; }
  .reset:hover { color: var(--text); background: var(--raised); }
  input[type=search] { background: var(--raised); border: 1px solid var(--border); color: var(--text);
    border-radius: 9px; padding: 7px 12px; font-size: 13.5px; min-width: 240px; flex: 1; max-width: 420px; outline: none; }
  input[type=search]:focus { border-color: var(--mint); }
  .chip { background: var(--raised); border: 1px solid var(--border); color: var(--text2);
    border-radius: 999px; padding: 5px 12px; font-size: 12.5px; cursor: pointer; user-select: none;
    line-height: 1.35; transition: background .12s, color .12s, border-color .12s; }
  .chip:hover { border-color: #3a4a44; color: var(--text); }
  .chip.hide { display: none; }
  .chip.active { background: var(--mint); color: #06231b; border-color: var(--mint); font-weight: 600; }
  .chip.toggle.active { background: #4a2f2f; color: #ffd9d9; border-color: #7a4a4a; }
  .chip small { opacity: .65; margin-left: 4px; font-size: 11px; }
  main { padding: 20px 24px 60px; }
  .group-title { margin: 24px 0 12px; font-size: 15px; color: var(--text2); display: flex; gap: 8px; align-items: center; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 10px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 12px; display: flex; gap: 12px; align-items: flex-start; position: relative; }
  .card.shared { border-color: #6a4a2a; }
  .card.isnew { border-color: rgba(30,215,160,.45); }
  .card.clip { border-color: rgba(220,90,90,.5); }
  .icon { width: 56px; height: 56px; border-radius: 9px; flex: 0 0 56px; background: var(--raised);
    object-fit: contain; }
  .icon.err { display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text3); }
  .meta { min-width: 0; flex: 1; }
  .ko { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .en { font-size: 12px; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .desc { font-size: 13px; color: var(--text); line-height: 1.45; margin-top: 8px; white-space: pre-wrap; }
  .descEn { font-size: 12px; color: var(--text2); line-height: 1.4; margin-top: 5px; white-space: pre-wrap; }
  .badges { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; align-items: center; }
  .badges span { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px; }
  .rb.silver { background: rgba(185,196,204,.15); color: var(--silver); }
  .rb.gold { background: rgba(232,196,95,.15); color: var(--gold); }
  .rb.prismatic { background: rgba(201,139,255,.15); color: var(--prism); }
  .sb { background: rgba(232,150,80,.15); color: #e89650; }
  .nb { background: rgba(30,215,160,.16); color: var(--mint); }
  .cb { background: rgba(220,90,90,.16); color: #ff9a9a; }
  .xb { background: rgba(220,60,60,.22); color: #ffb3b3; }
  .db { background: rgba(120,120,120,.18); color: var(--text3); }
  .tb { background: rgba(140,160,255,.16); color: #b3c2ff; }
  .mb.aram { background: rgba(90,170,255,.16); color: #8fc4ff; }
  .mb.classic { background: rgba(255,180,90,.16); color: #ffc98f; }
  .mb.arena { background: rgba(201,139,255,.16); color: var(--prism); }
  .mb.none { background: rgba(120,120,120,.18); color: var(--text3); }
  .lvl { background: rgba(30,215,160,.14); color: var(--mint); letter-spacing: -.5px; }
  .lvl.nolvl { background: rgba(108,127,120,.18); color: var(--text3); letter-spacing: 0; }
  .gb { background: rgba(232,196,95,.14); color: var(--gold); }
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
  <h1>증강연구서 데이터 검수</h1>
  <div class="stats">
    증강 <b>${aug.length}</b> ·
    아레나 증강 <b>${arena.length}</b> ·
    특수 증강 <b>${special.length}</b> ·
    아이템 <b>${items.length}</b> ·
    프리즘 아이템 <b>${prism.length}</b>
  </div>
  <div class="stats" style="margin-top:3px">
    <span style="color:#8fc4ff">칼바람 ${stat.aram}</span> ·
    <span style="color:#ffc98f">클래식 ${stat.classic}</span> ·
    미출시 ${stat.none} ·
    <span style="color:#e89650">아이콘 공유 ${stat.shared}</span> ·
    <span style="color:var(--mint)">신규 ${stat.isNew}</span> ·
    <span style="color:#ff9a9a">수치 미확인 ${stat.noCoef}</span> ·
    <span style="color:#b3c2ff">설명 수정됨 ${stat.edited}</span> ·
    <span style="color:#ffb3b3">설명 잘림 ko ${stat.clipKo} · en ${stat.clipEn} · 프리즘 ${stat.clipPrism}</span>
  </div>
  <div class="controls">
    <input id="q" type="search" placeholder="한글·영문 이름·설명 검색…" autocomplete="off" />
    <span class="reset" id="reset">초기화</span>
    <span class="count" id="count"></span>
  </div>
  <div class="filters">
    <div class="frow">
      <span class="flabel">데이터</span>
      <span class="chip active" data-g="ds" data-v="aug">칼바람·클래식 증강<small>${aug.length}</small></span>
      <span class="chip" data-g="ds" data-v="arena">아레나 증강<small>${arena.length}</small></span>
      <span class="chip" data-g="ds" data-v="special">특수 증강<small>${special.length}</small></span>
      <span class="chip" data-g="ds" data-v="item">아이템<small>${items.length}</small></span>
      <span class="chip" data-g="ds" data-v="prism">프리즘 아이템<small>${prism.length}</small></span>
    </div>
    <div class="frow" id="row-mode">
      <span class="flabel">모드</span>
      <span class="chip active" data-g="mode" data-v="all" data-for="aug item">전체</span>
      <span class="chip" data-g="mode" data-v="aram" data-for="aug">칼바람<small>${stat.aram}</small></span>
      <span class="chip" data-g="mode" data-v="classic" data-for="aug">클래식<small>${stat.classic}</small></span>
      <span class="chip" data-g="mode" data-v="both" data-for="aug">양쪽 공유<small>${stat.both}</small></span>
      <span class="chip" data-g="mode" data-v="none" data-for="aug">미출시<small>${stat.none}</small></span>
      <span class="chip" data-g="mode" data-v="aram" data-for="item">칼바람<small>${stat.itemAram}</small></span>
      <span class="chip" data-g="mode" data-v="classic" data-for="item">클래식<small>${stat.itemClassic}</small></span>
      <span class="chip" data-g="mode" data-v="arena" data-for="item">아레나<small>${stat.itemArena}</small></span>
    </div>
    <div class="frow" id="row-rarity">
      <span class="flabel">등급</span>
      <span class="chip active" data-g="rarity" data-v="all" data-for="aug arena">전체</span>
      <span class="chip" data-g="rarity" data-v="silver" data-for="aug arena">실버</span>
      <span class="chip" data-g="rarity" data-v="gold" data-for="aug arena">골드</span>
      <span class="chip" data-g="rarity" data-v="prismatic" data-for="aug arena">프리즘</span>
    </div>
    <div class="frow" id="row-flag">
      <span class="flabel">표시</span>
      <span class="chip toggle" data-t="clip" data-for="aug arena special prism">설명 잘림</span>
      <span class="chip toggle" data-t="edited" data-for="aug arena special prism">설명 수정됨</span>
      <span class="chip toggle" data-t="shared" data-for="aug arena special">아이콘 공유</span>
      <span class="chip toggle" data-t="isNew" data-for="aug">신규</span>
      <span class="chip toggle" data-t="noCoef" data-for="aug">수치 미확인</span>
      <span class="chip toggle" data-t="fixed" data-for="arena">레벨업 불가</span>
    </div>
  </div>
</header>
<main id="out"></main>

<script>
const DATA = {
  aug: ${embed(aug)},
  arena: ${embed(arena)},
  special: ${embed(special)},
  item: ${embed(items)},
  prism: ${embed(prism)},
};
const NUMBER_DIFFS = ${embed(numberDiffs)};
const CLIP_LINES = ${CARD_DESC_LINES};
// 프리즘 아이템 카드의 스탯·효과 줄 상한(생성기 prismFits 와 같은 규칙).
const PRISM_FITS = (s, e) => (s <= 3 && e <= 6) || (s === 4 && e <= 5);
const CDRAGON = 'https://raw.communitydragon.org/latest';
const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}';
const strip = (p) => p.replace(/^\\/lol-game-data\\/assets/i, '').toLowerCase();
// 앱의 augmentImageUrl — large → base(컬러 원본) → small 3단 폴백
const augUrl = (p) => CDRAGON + '/game' + strip(p).replace(/_small(\\.\\w+)$/i, '_large$1');
const augUrlBase = (p) => CDRAGON + '/game' + strip(p).replace(/_small(\\.\\w+)$/i, '$1');
const augUrlSmall = (p) => CDRAGON + '/plugins/rcp-be-lol-game-data/global/default' + strip(p);
// 앱의 cdragonItemIconUrl — 프리즘 아이템(447xxx)은 ddragon 에 없다
const prismUrl = (p) => CDRAGON + '/plugins/rcp-be-lol-game-data/global/default' + strip(p);
// 앱의 itemImageUrl
const itemUrl = (k) => DDRAGON + '/img/item/' + k;

const RNAME = { silver: '실버', gold: '골드', prismatic: '프리즘' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let ds = 'aug', mode = 'all', rarity = 'all', query = '';
const flags = { clip: false, edited: false, shared: false, isNew: false, noCoef: false, fixed: false };

function pass(a) {
  if (rarity !== 'all' && a.rarity !== rarity) return false;
  if (mode !== 'all') {
    if (mode === 'both' && (a.modes ?? []).length < 2) return false;
    else if (mode === 'none' && (a.modes ?? []).length) return false;
    else if (mode !== 'both' && mode !== 'none' && !(a.modes ?? []).includes(mode)) return false;
  }
  if (flags.clip && !a.clip) return false;
  if (flags.edited && !a.edited) return false;
  if (flags.shared && !a.shared) return false;
  if (flags.isNew && !a.isNew) return false;
  if (flags.noCoef && !a.noCoef) return false;
  if (flags.fixed && a.maxLevel !== 1) return false;
  if (query) {
    const hay = (a.ko + ' ' + a.en + ' ' + a.id + ' ' + a.descKo + ' ' + a.descEn).toLowerCase();
    if (!hay.includes(query.toLowerCase())) return false;
  }
  return true;
}

function badges(a) {
  let b = '';
  if (a.rarity) b += '<span class="rb ' + a.rarity + '">' + RNAME[a.rarity] + '</span>';
  if (ds === 'arena') b += a.maxLevel > 1
    ? '<span class="lvl">' + '★'.repeat(a.maxLevel) + ' 최대 ' + a.maxLevel + '레벨</span>'
    : '<span class="lvl nolvl">레벨업 불가</span>';
  if (ds === 'aug') {
    if (a.modes.includes('aram')) b += '<span class="mb aram">칼바람</span>';
    if (a.modes.includes('classic')) b += '<span class="mb classic">클래식</span>';
    if (!a.modes.length) b += '<span class="mb none">미출시</span>';
  }
  if (ds === 'item') {
    if (a.modes.includes('aram')) b += '<span class="mb aram">칼바람</span>';
    if (a.modes.includes('arena')) b += '<span class="mb arena">아레나</span>';
    if (a.modes.includes('classic')) b += '<span class="mb classic">클래식</span>';
    b += '<span class="gb">' + a.gold + 'G</span>';
  }
  if (ds === 'prism') {
    b += '<span class="gb">' + a.price + 'G</span>';
    // 스탯 · 효과가 서로 다른 줄 상한을 쓰므로 어느 블록이 넘쳤는지까지 적는다.
    for (const [loc, s, e] of [['ko', a.lnStatKo, a.lnEffKo], ['en', a.lnStatEn, a.lnEffEn]]) {
      if (!PRISM_FITS(s, e)) b += '<span class="xb">잘림 ' + loc + ' 스탯 ' + s + '줄 · 효과 ' + e + '줄</span>';
    }
  } else {
    if (a.lnKo > CLIP_LINES) b += '<span class="xb">잘림 ko ' + a.lnKo + '줄</span>';
    if (a.lnEn > CLIP_LINES) b += '<span class="xb">잘림 en ' + a.lnEn + '줄</span>';
  }
  if (a.isNew) b += '<span class="nb">신규</span>';
  if (a.noCoef) b += '<span class="cb">수치 미확인</span>';
  if (a.disabled) b += '<span class="db">비활성</span>';
  if (a.edited) b += '<span class="tb">설명 수정됨</span>';
  if (a.shared) b += '<span class="sb">공유</span>';
  return b;
}

function card(a) {
  const el = document.createElement('div');
  el.className = 'card' + (a.shared ? ' shared' : '') + (a.isNew ? ' isnew' : '') +
    (a.lnKo > CLIP_LINES || a.lnEn > CLIP_LINES ? ' clip' : '');
  const img = document.createElement('img');
  img.className = 'icon';
  img.loading = 'lazy';
  img.alt = a.ko;
  img.src = ds === 'item' ? itemUrl(a.imageKey) : ds === 'prism' ? prismUrl(a.iconPath) : augUrl(a.iconPath);
  img.onerror = () => {
    if (ds !== 'item' && ds !== 'prism') {
      const st = img.dataset.step || '0';
      if (st === '0') { img.dataset.step = '1'; img.src = augUrlBase(a.iconPath); return; }
      if (st === '1') { img.dataset.step = '2'; img.src = augUrlSmall(a.iconPath); return; }
    }
    img.replaceWith(Object.assign(document.createElement('div'),
      { className: 'icon err', textContent: 'no img' }));
  };
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = '<div class="ko">' + esc(a.ko) + '</div>' +
    '<div class="en">' + esc(a.en) + '</div>' +
    '<div class="badges">' + badges(a) + '</div>' +
    '<div class="desc">' + esc(a.descKo) + '</div>' +
    '<div class="descEn">' + esc(a.descEn) + '</div>' +
    '<div class="iconpath">' + esc(a.imageKey ?? a.iconPath.replace(/.*\\//, '')) + '</div>';
  el.appendChild(img);
  el.appendChild(meta);
  return el;
}

// 데이터셋마다 묶는 축이 다르다 — 증강은 등급, 아이템은 신발 여부, 나머지는 한 덩어리.
function groupsOf(list) {
  if (ds === 'aug' || ds === 'arena') {
    const order = ['silver', 'gold', 'prismatic'];
    return order
      .map((r) => [RNAME[r] + ' 증강', list.filter((a) => a.rarity === r)])
      .filter(([, l]) => l.length);
  }
  if (ds === 'item') {
    return [['전설 아이템', list.filter((a) => !a.boots)], ['신발', list.filter((a) => a.boots)]]
      .filter(([, l]) => l.length);
  }
  return [[{ special: '특수 증강 (재련·시즌 변형)', prism: '프리즘 아이템' }[ds], list]];
}

function render() {
  const all = DATA[ds];
  const list = all.filter(pass).sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));
  document.getElementById('count').innerHTML = '<b>' + list.length + '</b> / ' + all.length + '개';
  const out = document.getElementById('out');
  out.innerHTML = '';
  if (!list.length) { out.innerHTML = '<div class="empty">결과 없음</div>'; return; }
  for (const [title, group] of groupsOf(list)) {
    const h = document.createElement('div');
    h.className = 'group-title';
    h.textContent = title + ' · ' + group.length + '개';
    out.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'grid';
    for (const a of group) grid.appendChild(card(a));
    out.appendChild(grid);
  }
}

// 고른 데이터셋에 해당 없는 칩은 비활성이 아니라 숨긴다 — 못 누르는 칩은 노이즈다.
// 남는 칩이 없으면 행 자체(라벨 포함)를 접는다.
function syncChips() {
  for (const c of document.querySelectorAll('.chip[data-for]')) {
    c.classList.toggle('hide', !c.dataset.for.split(' ').includes(ds));
  }
  for (const row of document.querySelectorAll('.frow[id]')) {
    row.classList.toggle('hide', !row.querySelector('.chip:not(.hide)'));
  }
}

function selectGroup(g, v) {
  for (const c of document.querySelectorAll('.chip[data-g="' + g + '"]')) {
    c.classList.toggle('active', c.dataset.v === v && !c.classList.contains('hide'));
  }
}

document.getElementById('q').addEventListener('input', (e) => { query = e.target.value.trim(); render(); });

for (const c of document.querySelectorAll('.chip[data-g]')) {
  c.addEventListener('click', () => {
    const g = c.dataset.g;
    for (const x of document.querySelectorAll('.chip[data-g="' + g + '"]')) x.classList.remove('active');
    c.classList.add('active');
    if (g === 'ds') {
      // 데이터셋이 바뀌면 하위 필터는 의미가 달라진다 — 남겨두면 빈 화면이 뜬다.
      ds = c.dataset.v;
      mode = 'all'; rarity = 'all';
      for (const k of Object.keys(flags)) flags[k] = false;
      for (const x of document.querySelectorAll('.chip[data-t]')) x.classList.remove('active');
      syncChips();
      selectGroup('mode', 'all');
      selectGroup('rarity', 'all');
    } else if (g === 'mode') mode = c.dataset.v;
    else rarity = c.dataset.v;
    render();
  });
}

for (const c of document.querySelectorAll('.chip[data-t]')) {
  c.addEventListener('click', () => {
    flags[c.dataset.t] = !flags[c.dataset.t];
    c.classList.toggle('active', flags[c.dataset.t]);
    render();
  });
}

document.getElementById('reset').addEventListener('click', () => {
  mode = 'all'; rarity = 'all'; query = '';
  for (const k of Object.keys(flags)) flags[k] = false;
  document.getElementById('q').value = '';
  for (const x of document.querySelectorAll('.chip[data-t]')) x.classList.remove('active');
  selectGroup('mode', 'all');
  selectGroup('rarity', 'all');
  render();
});

// 앱 설명과 위키 수치가 엇갈리는 건들. 대개 서술 상세도 차이라 자동 반영하지 않고
// 여기 모아만 둔다 — 실제 패치 변경인지 눈으로 가려 다음 커밋에서 정리한다.
if (NUMBER_DIFFS.length) {
  const d = document.createElement('details');
  d.className = 'review';
  d.innerHTML = '<summary>앱 · 위키 수치가 다른 ' + NUMBER_DIFFS.length +
    '건 — 확인 필요 (자동 반영하지 않음)</summary><table>' +
    NUMBER_DIFFS.map((r) =>
      '<tr><td class="n">' + esc(r.name) + '</td>' +
      '<td class="a"><b>앱</b> ' + esc(r.app) + '<br><b>위키</b> <span class="w">' + esc(r.wiki) + '</span></td></tr>'
    ).join('') + '</table>';
  document.body.appendChild(d);
}

syncChips();
render();
</script>
</body>
</html>`;

const outPath = path.join(root, 'docs/index.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`✓ ${path.relative(root, outPath)} (${kb}KB)`);
console.log(`  증강 ${aug.length}(실버 ${rarity(aug, 'silver')}·골드 ${rarity(aug, 'gold')}·프리즘 ${rarity(aug, 'prismatic')}) · 아레나 ${arena.length} · 특수 ${special.length}`);
console.log(`  아이템 ${items.length}(칼바람 ${stat.itemAram}·클래식 ${stat.itemClassic}·아레나 ${stat.itemArena}) · 프리즘 ${prism.length}`);
console.log(`  설명 잘림 — 칼바람 ${clipped(aug)} · 아레나 ${clipped(arena)} · 특수 ${clipped(special)} · 프리즘 ${clipped(prism)}`);
