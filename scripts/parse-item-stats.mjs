#!/usr/bin/env node
/**
 * 아이템 description의 <stats> 블록을 파싱해 정규화된 stats 필드를 재생성한다.
 *
 * DDragon item.json의 stats 필드는 레거시라 스킬 가속·관통력·치명타 피해량·흡혈·
 * 강인함·회복 및 보호막 효과 등 현대 스탯이 누락돼 있다. 반면 ko description의
 * <stats> 블록에는 모든 스탯이 정확한 수치로 들어있으므로 이를 단일 출처로 삼는다.
 *
 * ko로 파싱한 결과(수치는 로케일 무관)를 items.ko.json / items.en.json 양쪽에 적용.
 *
 * Run: node scripts/parse-item-stats.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/features/items/data');

/** description 라벨 → 정규화 키. percent는 비율(40% → 0.4)로 저장. */
const LABEL_MAP = {
  '체력': { key: 'hp', kind: 'flat' },
  '마나': { key: 'mp', kind: 'flat' },
  '공격력': { key: 'attackdamage', kind: 'flat' },
  '주문력': { key: 'abilitypower', kind: 'flat' },
  '방어력': { key: 'armor', kind: 'flat' },
  '마법 저항력': { key: 'spellblock', kind: 'flat' },
  '공격 속도': { key: 'attackspeed', kind: 'percent' },
  '이동 속도': { kind: 'flatOrPercent', flatKey: 'movespeedFlat', percentKey: 'movespeedPercent' },
  '기본 체력 재생': { key: 'hpregen', kind: 'percent' },
  '기본 마나 재생': { key: 'mpregen', kind: 'percent' },
  '스킬 가속': { key: 'abilityhaste', kind: 'flat' },
  '치명타 확률': { key: 'crit', kind: 'percent' },
  '치명타 피해량': { key: 'critdamage', kind: 'percent' },
  '물리 관통력': { key: 'lethality', kind: 'flat' },
  '방어구 관통력': { key: 'armorpen', kind: 'percent' },
  '마법 관통력': { kind: 'flatOrPercent', flatKey: 'magicpenFlat', percentKey: 'magicpenPercent' },
  '생명력 흡수': { key: 'lifesteal', kind: 'percent' },
  '모든 피해 흡혈': { key: 'omnivamp', kind: 'percent' },
  '강인함': { key: 'tenacity', kind: 'percent' },
  '체력 회복 및 보호막': { key: 'healshield', kind: 'percent' },
  '적응형 능력치': { key: 'adaptive', kind: 'flat' },
  // 클래식 레트로 아이템은 단위가 다르다. 현대 아이템의 "기본 체력 재생 100%"는
  // 챔피언 기본 재생에 곱하는 비율이지만, 레트로의 "5초당 체력 재생 10"은 절대값이다.
  // 같은 키에 담으면 10배 곱해지므로 별도 flat 키로 받는다.
  '5초당 체력 재생': { key: 'hpregenFlat', kind: 'flat' },
  '5초당 마나 재생': { key: 'mpregenFlat', kind: 'flat' },
  // 구버전 쿨감. 현대의 스킬 가속과 계산식이 달라 합칠 수 없다.
  '재사용 대기시간 감소': { key: 'cdr', kind: 'percent' },
};
/** 스탯이 아니므로 패널에서 제외하는 라벨 */
const SKIP_LABELS = new Set(['초당 골드', '10초당 골드']);

const unknownLabels = new Map(); // label → count

function parseStats(description) {
  const block = /<stats>(.*?)<\/stats>/s.exec(description ?? '');
  if (!block) return {};
  const stats = {};
  // 앞자리 숫자를 포함해야 "5초당 체력 재생"이 "초당 체력 재생"으로 잘리지 않는다.
  const re = /((?:\d+)?[가-힣/ ]+?)\s*<attention>\s*([0-9.]+)(%?)\s*<\/attention>/g;
  let m;
  while ((m = re.exec(block[1])) !== null) {
    const label = m[1].trim();
    const value = parseFloat(m[2]);
    const isPercent = m[3] === '%';
    if (SKIP_LABELS.has(label)) continue;
    const def = LABEL_MAP[label];
    if (!def) {
      unknownLabels.set(label, (unknownLabels.get(label) ?? 0) + 1);
      continue;
    }
    let key;
    let amount;
    if (def.kind === 'flatOrPercent') {
      key = isPercent ? def.percentKey : def.flatKey;
      amount = isPercent ? value / 100 : value;
    } else if (def.kind === 'percent') {
      key = def.key;
      amount = value / 100;
    } else {
      key = def.key;
      amount = value;
    }
    stats[key] = Math.round(((stats[key] ?? 0) + amount) * 1000) / 1000;
  }
  return stats;
}

// 협곡(items)과 클래식 레트로(classic-items)는 완전히 다른 아이템 세트라 파일이 나뉜다.
// 두 벌 다 같은 규칙으로 파싱한다 — 클래식 id(77xxxx)는 협곡과 겹치지 않는다.
const BASENAMES = ['items', 'classic-items'];

const statsById = new Map();
let total = 0;
let withStats = 0;

for (const basename of BASENAMES) {
  // 1) ko를 단일 출처로 파싱 → id별 stats 맵 (수치는 로케일 무관)
  const koItems = JSON.parse(readFileSync(path.join(DATA_DIR, `${basename}.ko.json`), 'utf8'));
  for (const it of koItems) {
    const stats = parseStats(it.description);
    statsById.set(it.id, stats);
    total += 1;
    if (Object.keys(stats).length > 0) withStats += 1;
  }

  // 2) ko/en 양쪽 파일의 stats 필드 갱신 후 저장
  for (const suffix of ['ko', 'en']) {
    const file = path.join(DATA_DIR, `${basename}.${suffix}.json`);
    const items = JSON.parse(readFileSync(file, 'utf8'));
    for (const it of items) {
      it.stats = statsById.get(it.id) ?? {};
    }
    writeFileSync(file, JSON.stringify(items, null, 2) + '\n');
    console.log(`  → ${basename}.${suffix}.json 갱신 (${items.length}개)`);
  }
}

// 3) 검수 로그
console.log(`\n파싱 완료: 총 ${total}개 중 stats 보유 ${withStats}개`);
if (unknownLabels.size > 0) {
  console.warn('\n⚠️  매핑되지 않은 라벨 (LABEL_MAP에 추가 필요):');
  for (const [label, count] of unknownLabels) console.warn(`   ${count}회  "${label}"`);
} else {
  console.log('매핑 누락 라벨 없음 ✅');
}

console.log('\n대표 아이템 검수:');
// 협곡 2 + 클래식 2 — 두 세트가 다 파싱됐는지 한눈에 본다.
const samples = ['3031', '3041', '773031', '773050'];
const named = new Map(
  BASENAMES.flatMap((b) =>
    JSON.parse(readFileSync(path.join(DATA_DIR, `${b}.ko.json`), 'utf8')).map((it) => [it.id, it]),
  ),
);
for (const id of samples) {
  const it = named.get(id);
  if (it) console.log(`  ${it.name}:`, JSON.stringify(statsById.get(id)));
}
