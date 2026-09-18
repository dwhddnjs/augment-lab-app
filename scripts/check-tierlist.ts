/**
 * 티어리스트 생성물 점검 — `npx tsx scripts/check-tierlist.ts`.
 *
 * 테스트 러너가 없으므로 assert만 쓴다(check-backup.ts / check-build-storage.ts 와 같은 방식).
 *
 * fetch-tierlist.ts 는 비공식 API 두 곳을 조인해 굽는다. 조인 키가 조용히 어긋나면
 * (증강 id 체계 변경, 앱 데이터 갱신, 아이템 접두사 변화) 화면에는 "빈 그룹"이나
 * "이름 없는 아이콘"으로만 나타나 눈치채기 어렵다. 그래서 생성물을 실제 앱 데이터에
 * 대고 다시 조인해 본다. 그룹핑 로직도 tiers.ts 를 그대로 import 해서 검증한다.
 *
 * `scripts/**` 는 tsconfig 타입체크 대상이 아니다 — 데이터 형식을 바꾸면 이 파일을 직접 돌려 볼 것.
 */
import assert from 'node:assert/strict';

import type { Augment } from '@/features/augments/types';
import {
  COLUMNS,
  TIERS,
  augSlugs,
  augTierOf,
  formatSource,
  spellIcons,
  tierRows,
  tierSections,
} from '@/features/tierlist/tiers';

const meta = require('@/features/tierlist/data/tierlist.json') as { patch: string; date: string };
const champions = require('@/features/champions/data/champions.ko.json') as { key: string }[];
const augments = require('@/features/augments/data/augments.ko.json') as Augment[];
const itemsKo = require('@/features/tierlist/data/tierlist-items.ko.json') as { id: string; name: string }[];
const itemsEn = require('@/features/tierlist/data/tierlist-items.en.json') as { id: string; name: string }[];

/** 모달이 한 줄 7개 격자로 그린다 — 빌드는 코어 3 + 확장 3 이 최대다. */
const MAX_BUILD = 6;

const championKeys = new Set(champions.map((c) => c.key));
const itemIds = new Set(itemsKo.map((i) => i.id));
// 화면은 useAugmentPool('aram') 으로 조인한다 — 클래식 전용 증강은 여기서도 없는 것으로 친다.
const rarityOf = new Map(
  augments.filter((a) => a.modes?.includes('aram')).map((a) => [a.id, a.rarity]),
);

assert.ok(meta.patch, 'patch 비어 있음');
assert.ok(meta.date, 'date 비어 있음');
assert.ok(!formatSource('{patch} {date}').includes('{'), '출처 문구 치환 실패');
assert.equal(itemsKo.length, itemsEn.length, 'ko/en 아이템 사전 길이 불일치');
assert.deepEqual(
  itemsKo.map((i) => i.id),
  itemsEn.map((i) => i.id),
  'ko/en 아이템 사전 id 순서 불일치',
);
assert.ok([...itemsKo, ...itemsEn].every((i) => i.name), '이름 없는 아이템');

const rows = tierRows();
assert.ok(rows.length >= 150, `챔피언 ${rows.length}명 — 너무 적다`);

// 사전에 안 쓰이는 아이템이 남으면 번들만 커진다(아레나를 걷어낼 때 실제로 남았다).
const referenced = new Set(rows.flatMap((r) => [...r.build, ...r.situational]));
assert.deepEqual([...itemIds].sort(), [...referenced].sort(), '아이템 사전과 실제 참조가 어긋남');

const seen = new Set<string>();
for (const [i, row] of rows.entries()) {
  assert.ok(championKeys.has(row.key), `앱에 없는 챔피언 key ${row.key}`);
  assert.ok(!seen.has(row.key), `챔피언 중복 ${row.key}`);
  seen.add(row.key);

  assert.ok(TIERS.includes(row.tier), `${row.key}: 티어 ${row.tier}`);
  assert.ok(row.score >= 0.2 && row.score <= 0.8, `${row.key}: 승률 ${row.score} 범위 밖`);
  assert.ok(row.sub >= 0 && row.sub <= 1, `${row.key}: 픽률 ${row.sub} 범위 밖`);
  // 표시 티어 순. 같은 티어 안의 승률 순서는 보장하지 않는다 — S 는 소스 tier 1·2 를 합쳐서
  // tier2 첫 챔피언이 tier1 마지막보다 승률이 높을 수 있다(fetch-tierlist.ts TIER_MAP 참고).
  if (i > 0) {
    const prev = rows[i - 1];
    assert.ok(TIERS.indexOf(row.tier) >= TIERS.indexOf(prev.tier), `정렬이 깨졌다 (${i}번째 ${row.key})`);
  }

  // 증강 — [사전 인덱스, 승률×1e4, 소스 티어]. 조인 가능하고 희귀도 3종이 모두 채워져야 한다.
  const rarities = new Set<string>();
  for (const [j, [idx, score, tier]] of row.augments.entries()) {
    const slug = augSlugs[idx];
    const rarity = rarityOf.get(slug);
    assert.ok(rarity, `${row.key}: 칼바람 증강 풀에 없는 id ${slug}`);
    assert.ok(score >= 2000 && score <= 8000, `${row.key}: 증강 ${slug} 승률 ${score} 범위 밖`);
    assert.ok(tier >= 1 && tier <= 4, `${row.key}: 증강 ${slug} 티어 ${tier}`);
    assert.equal(augTierOf(tier), TIERS[tier - 1], `${row.key}: augTierOf(${tier})`);
    if (j > 0) assert.ok(score <= row.augments[j - 1][1], `${row.key}: 증강 승률 정렬이 깨졌다`);
    rarities.add(rarity);
  }
  assert.equal(rarities.size, 3, `${row.key}: 희귀도 ${[...rarities]} — 3종이 아니다`);

  // 아이템 — 사전에 이름·아이콘이 있어야 그릴 수 있고, 빌드와 상황템은 겹치지 않는다.
  assert.ok(row.build.length <= MAX_BUILD, `${row.key}: 빌드 ${row.build.length}개`);
  assert.equal(new Set(row.build).size, row.build.length, `${row.key}: 빌드 중복`);
  assert.equal(new Set(row.situational).size, row.situational.length, `${row.key}: 상황템 중복`);
  for (const id of [...row.build, ...row.situational]) {
    assert.ok(itemIds.has(id), `${row.key}: 아이템 사전에 없는 id ${id}`);
  }
  for (const id of row.situational) {
    assert.ok(!row.build.includes(id), `${row.key}: 상황템 ${id} 가 빌드와 겹친다`);
  }

  // 스펠 — 비었거나(pill 숨김) 두 개 모두 아이콘이 있어야 한다. 아이콘이 빠지면 모달이 크래시였다.
  assert.ok(row.spells.length === 0 || row.spells.length === 2, `${row.key}: 스펠 ${row.spells}`);
  for (const id of row.spells) assert.ok(spellIcons[id], `${row.key}: 스펠 ${id} 아이콘 없음`);
  assert.ok(row.spellPick >= 0 && row.spellPick <= 1, `${row.key}: 스펠 픽률 ${row.spellPick}`);
}

// 그룹핑 — 버킷이 rows 를 빠짐없이 덮고 빈 티어가 없어야 한다.
const sections = tierSections();
assert.deepEqual(sections.map((s) => s.title), [...TIERS], '섹션 순서');
const flat = sections.flatMap((s) => s.data.flat());
assert.equal(flat.length, rows.length, `버킷 합 ${flat.length} ≠ ${rows.length}`);
assert.deepEqual(flat.map((r) => r.key), rows.map((r) => r.key), '버킷 순서가 어긋남');
for (const s of sections) {
  assert.ok(s.data.every((r) => r.length <= COLUMNS), `${s.title} 행이 ${COLUMNS}열을 넘는다`);
  assert.ok(s.data.flat().every((r) => r.tier === s.title), `${s.title} 섹션에 다른 티어가 섞였다`);
}

// 검색 필터 — 티어 배정은 그대로 두고 해당 챔피언만 남아야 한다.
const target = rows[rows.length - 1];
const filtered = tierSections((r) => r.key === target.key);
assert.equal(filtered.length, 1, '한 명만 남기면 섹션도 하나여야 한다');
assert.equal(filtered[0].title, target.tier, '검색해도 티어가 바뀌면 안 된다');
assert.deepEqual(filtered[0].data, [[target]], '검색 결과 격자');
assert.equal(tierSections(() => false).length, 0, '결과 0이면 섹션도 0');

console.log(
  `칼바람 ${rows.length}명 · ` + sections.map((s) => `${s.title} ${s.data.flat().length}`).join(' / '),
);
console.log(`아이템 사전 ${itemsKo.length}개 · 스펠 ${Object.keys(spellIcons).length}개 · 패치 ${meta.patch} · ${meta.date}`);
console.log('check-tierlist: 통과');
