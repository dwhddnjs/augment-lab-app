#!/usr/bin/env node
/**
 * 2026-06 ARAM 아수라장 대규모 패치 반영 (공용 증강분).
 *
 *   node scripts/apply-mayhem-patch.mjs           # 미리보기(dry-run)
 *   node scripts/apply-mayhem-patch.mjs --write    # 실제 파일 반영
 *
 * 기준선 = 현재 augments.{ko,en}.json (199개, augmentNameId로 CDragon에 매핑).
 * CommunityDragon latest 를 정답으로:
 *   - 신규 공용 증강 추가 (설명은 stringtable 자동 정제 초안 → 검수 페이지에서 다듬을 것)
 *   - 개명/리워크된 증강은 id 유지(빌드 augmentIds 참조 보호) 후 이름·rarity·아이콘 갱신
 *   - 아이콘 경로 / rarity 변경 반영
 * 기존 199개의 다듬어진 설명은 보존(개명건 제외).
 *
 * 챔피언 고유 증강은 아직 CDragon 미노출 → 이 스크립트 범위 밖.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const CDRAGON = 'https://raw.communitydragon.org/latest';
const UA = { 'User-Agent': 'Mozilla/5.0 (augment-data-build)' };
const EN_PATH = path.join(root, 'src/features/augments/data/augments.en.json');
const KO_PATH = path.join(root, 'src/features/augments/data/augments.ko.json');

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9가-힣]/gi, '');
const base = (p) => (p || '').replace(/.*\//, '').toLowerCase();
const core = (id) => id.replace(/^ARAM_/i, '').replace(/_(Active|Cutlass)$/i, '').replace(/^Quest_/i, '').toLowerCase();
const slugify = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isGeneric = (b) => /genericability/i.test(b);
const RAR = { kSilver: 'silver', kGold: 'gold', kPrismatic: 'prismatic' };
const iconSlug = (p) => base(p).replace(/\.(png|jpg|jpeg).*$/i, '').replace(/_(small|large)$/i, '');

// stringtable 변수·마크업 정제 (초안 품질 — 검수에서 다듬음)
function clean(s) {
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/@[^@]*@/g, '')
    .replace(/\s+([.,%)])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`fetch ${res.status}: ${url}`);
  return res.json();
}

async function main() {
  console.log('CDragon 소스 로드…');
  const [cdEn, cdKo, stEn, stKo] = await Promise.all([
    getJson(`${CDRAGON}/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json`),
    getJson(`${CDRAGON}/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json`),
    getJson(`${CDRAGON}/game/en_us/data/menu/en_us/lol.stringtable.json`),
    getJson(`${CDRAGON}/game/ko_kr/data/menu/en_us/lol.stringtable.json`),
  ]);
  const cd = Object.values(cdEn).filter((x) => x && x.augmentNameId);
  const koNameById = new Map(Object.values(cdKo).filter((x) => x && x.id != null).map((x) => [x.id, x.nameTRA]));

  // stringtable → slug별 {summary, tooltip, desc} (프리픽스 체인 유연 처리)
  const buildSlugs = (st) => {
    const e = st.entries ?? st;
    const m = new Map();
    const addVar = (rec, kind, v) => { if (rec[kind] === undefined) rec[kind] = v; };
    for (const [k0, v] of Object.entries(e)) {
      const k = k0.toLowerCase();
      // 퀘스트 진행/마일스톤 등 본설명 아닌 키 제외
      if (/milestone|questcomplete|questmilestone|quest_finished|_quest_desc|spellmodifier|playerbuff/.test(k)) continue;
      const mm = /^(.*?)_(summary|tooltip|name|desc)$/.exec(k);
      if (!mm) continue;
      const [, slug, kind] = mm;
      // 프리픽스 체인(kiwi/cherry/aram/augment/quest)을 점진적으로 벗긴 변형 모두 등록
      const variants = new Set([slug, slug.replace(/_/g, '')]);
      let s = slug, prev;
      do { prev = s; s = s.replace(/^(kiwi|cherry|aram|augment|quest)_/, ''); variants.add(s); variants.add(s.replace(/_/g, '')); } while (s !== prev);
      for (const vv of variants) { if (!vv) continue; if (!m.has(vv)) m.set(vv, {}); addVar(m.get(vv), kind, v); }
    }
    return m;
  };
  const slugsEn = buildSlugs(stEn);
  const slugsKo = buildSlugs(stKo);
  const descFrom = (slugs, a) => {
    const ic = iconSlug(a.augmentSmallIconPath);
    const cands = [ic, ic.replace(/_/g, ''), core(a.augmentNameId), core(a.augmentNameId).replace(/_/g, ''), a.augmentNameId.toLowerCase().replace(/_/g, ''), norm(a.nameTRA), norm(a.simpleNameTRA)];
    for (const c of cands) {
      const r = slugs.get(c);
      if (r && (r.summary || r.tooltip || r.desc)) return clean(r.summary || r.tooltip || r.desc);
    }
    return '';
  };

  const en = JSON.parse(readFileSync(EN_PATH, 'utf8'));
  const ko = JSON.parse(readFileSync(KO_PATH, 'utf8'));
  const koById = new Map(ko.map((a) => [a.id, a]));

  // 기준선 매핑
  const cdByName = new Map(), cdByIcon = new Map();
  for (const a of cd) { const n = norm(a.nameTRA); if (!cdByName.has(n)) cdByName.set(n, a); const b = base(a.augmentSmallIconPath); if (!isGeneric(b) && !cdByIcon.has(b)) cdByIcon.set(b, a); }
  const baseline = en.map((a) => ({ app: a, cd: cdByName.get(norm(a.name)) || cdByIcon.get(base(a.iconPath)) }));
  const baseIds = new Set(baseline.map((b) => b.cd?.augmentNameId).filter(Boolean));
  const baseCore = new Set([...baseIds].map(core));
  const appNames = new Set(en.map((a) => norm(a.name)));

  // 분류
  const isNoise = (id) => /^(GoH|Crafting|Gamba|GainStat|Special|Null|Replace|Transmute)/i.test(id) || /AugmentSlot|StatAnvil/i.test(id);
  const looks = (a) => /^ARAM_/i.test(a.augmentNameId) || /\/Kiwi\//i.test(a.augmentSmallIconPath);
  const seen = new Set();
  const cand = cd.filter((a) => looks(a) && !isNoise(a.augmentNameId) && (seen.has(a.augmentNameId) ? false : (seen.add(a.augmentNameId), true)));
  const added = [], renamed = [];
  for (const a of cand) {
    if (baseIds.has(a.augmentNameId) || appNames.has(norm(a.nameTRA))) continue;
    if (baseCore.has(core(a.augmentNameId))) {
      const old = baseline.find((b) => b.cd && core(b.cd.augmentNameId) === core(a.augmentNameId));
      if (old) renamed.push({ old, a });
    } else added.push(a);
  }

  // 1) 신규 추가
  const newEn = [], newKo = [];
  for (const a of added) {
    const id = slugify(a.nameTRA);
    const rarity = RAR[a.rarity];
    const iconPath = a.augmentSmallIconPath;
    const enDesc = descFrom(slugsEn, a) || '';
    const koDesc = descFrom(slugsKo, a) || enDesc;
    const koName = koNameById.get(a.id) || a.nameTRA;
    newEn.push({ id, name: a.nameTRA, description: enDesc, rarity, iconPath });
    newKo.push({ id, name: koName, description: koDesc, rarity, iconPath });
  }

  // 2) 개명/리워크: id 유지, 이름·rarity·아이콘 갱신 (설명은 보존)
  const renameLog = [];
  for (const { old, a } of renamed) {
    const id = old.app.id;
    const enRec = en.find((x) => x.id === id);
    const koRec = koById.get(id);
    renameLog.push(`${old.app.name} → ${a.nameTRA} (id 유지: ${id})`);
    if (enRec) { enRec.name = a.nameTRA; enRec.rarity = RAR[a.rarity]; enRec.iconPath = a.augmentSmallIconPath; }
    if (koRec) { koRec.name = koNameById.get(a.id) || a.nameTRA; koRec.rarity = RAR[a.rarity]; koRec.iconPath = a.augmentSmallIconPath; }
  }

  // 3) 아이콘/rarity 변경 (개명·신규 외 기존 항목)
  const changeLog = [];
  for (const b of baseline) {
    if (!b.cd) continue;
    const enRec = en.find((x) => x.id === b.app.id);
    const koRec = koById.get(b.app.id);
    const newIcon = b.cd.augmentSmallIconPath;
    if (!isGeneric(base(newIcon)) && base(b.app.iconPath) !== base(newIcon)) {
      changeLog.push(`아이콘 ${b.app.name}: ${base(b.app.iconPath)} → ${base(newIcon)}`);
      if (enRec) enRec.iconPath = newIcon;
      if (koRec) koRec.iconPath = newIcon;
    }
    if (b.app.rarity !== RAR[b.cd.rarity]) {
      changeLog.push(`rarity ${b.app.name}: ${b.app.rarity} → ${RAR[b.cd.rarity]}`);
      if (enRec) enRec.rarity = RAR[b.cd.rarity];
      if (koRec) koRec.rarity = RAR[b.cd.rarity];
    }
  }

  const outEn = [...en, ...newEn];
  const outKo = [...ko, ...newKo];

  console.log(`\n신규 ${newEn.length} · 개명 ${renamed.length} · 변경 ${changeLog.length}  →  ${en.length} → ${outEn.length}개`);
  console.log('\n[개명]'); renameLog.forEach((l) => console.log('  ' + l));
  console.log('\n[변경]'); changeLog.forEach((l) => console.log('  ' + l));
  console.log('\n[신규 설명 정제 샘플 5]');
  for (const a of newKo.slice(0, 5)) console.log(`  · ${a.name} [${a.rarity}]\n      ${a.description || '(설명 없음)'}`);
  const emptyDesc = newKo.filter((a) => !a.description);
  if (emptyDesc.length) console.log(`\n⚠️  설명 비어있는 신규: ${emptyDesc.length} → ${emptyDesc.map((a) => a.name).join(', ')}`);

  if (WRITE) {
    writeFileSync(EN_PATH, JSON.stringify(outEn, null, 2) + '\n');
    writeFileSync(KO_PATH, JSON.stringify(outKo, null, 2) + '\n');
    console.log('\n✓ 파일 반영 완료. 이제: node scripts/gen-augment-check.mjs');
  } else {
    console.log('\n(미리보기 — 반영하려면 --write)');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
