/**
 * 검수 통합 인덱스(docs/index.html)를 생성한다.
 *
 *   node scripts/gen-check-index.mjs
 *   → docs/index.html
 *
 * 칼바람(ARAM)·아레나(Arena) 검수 페이지로 가는 진입점. 각 데이터셋의 항목 수를
 * 읽어 카드로 안내한다. 두 검수는 데이터 출처가 다르므로 명확히 분리해 보여준다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const count = (p) => {
  try {
    return readJson(p).length;
  } catch {
    return 0;
  }
};

// 칼바람(ARAM) 증강
const aramAug = count('src/features/augments/data/augments.ko.json');
// 아레나(Arena)
const arenaAug = count('src/features/arena/data/augments.ko.json');
const arenaPrism = count('src/features/arena/data/prismatic-items.ko.json');
const arenaSpecial = count('src/features/arena/data/special-augments.ko.json');

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>증강·아이템 데이터 검수</title>
<style>
  :root {
    --bg: #0d1311; --surface: #131b18; --raised: #1a2420; --border: #25322d;
    --text: #e8f0ec; --text2: #9bb0a8; --text3: #6c7f78;
    --mint: #1ED7A0; --aram: #5fb8e8; --arena: #c98bff;
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple SD Gothic Neo", sans-serif;
    display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; }
  h1 { margin: 0 0 6px; font-size: 24px; }
  .sub { color: var(--text2); font-size: 14px; margin-bottom: 36px; text-align: center; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 340px)); gap: 18px;
    width: 100%; max-width: 720px; justify-content: center; }
  a.card { text-decoration: none; color: inherit; background: var(--surface);
    border: 1px solid var(--border); border-radius: 16px; padding: 24px; display: block;
    transition: transform .12s ease, border-color .12s ease; }
  a.card:hover { transform: translateY(-3px); }
  a.card.aram:hover { border-color: var(--aram); }
  a.card.arena:hover { border-color: var(--arena); }
  .tag { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .3px;
    padding: 4px 10px; border-radius: 999px; margin-bottom: 14px; text-transform: uppercase; }
  .aram .tag { background: rgba(95,184,232,.15); color: var(--aram); }
  .arena .tag { background: rgba(201,139,255,.15); color: var(--arena); }
  .name { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .stat { color: var(--text2); font-size: 14px; line-height: 1.6; }
  .stat b { color: var(--text); }
  .go { margin-top: 16px; font-size: 13px; color: var(--text3); }
  footer { margin-top: 40px; color: var(--text3); font-size: 12px; }
</style>
</head>
<body>
  <h1>증강·아이템 데이터 검수</h1>
  <div class="sub">칼바람과 아레나는 데이터 출처가 다릅니다. 검수할 모드를 선택하세요.</div>
  <div class="cards">
    <a class="card aram" href="augment-check.html">
      <span class="tag">ARAM · 칼바람</span>
      <div class="name">칼바람 증강 검수</div>
      <div class="stat">증강 <b>${aramAug}</b>개</div>
      <div class="go">열기 →</div>
    </a>
    <a class="card arena" href="arena-check.html">
      <span class="tag">Arena · 아레나</span>
      <div class="name">아레나 검수</div>
      <div class="stat">증강 <b>${arenaAug}</b>개 · 프리즘 아이템 <b>${arenaPrism}</b>개<br />특수 증강 <b>${arenaSpecial}</b>개</div>
      <div class="go">열기 →</div>
    </a>
  </div>
  <footer>node scripts/gen-check-index.mjs 로 재생성</footer>
</body>
</html>`;

const outPath = path.join(root, 'docs/index.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log(
  `✓ 칼바람 ${aramAug} · 아레나 증강 ${arenaAug}/프리즘 ${arenaPrism}/특수 ${arenaSpecial} → ${path.relative(root, outPath)}`,
);
