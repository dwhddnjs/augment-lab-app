#!/usr/bin/env node
/**
 * 증강 설명에서 카드에 필요 없는 군더더기만 걷어낸다.
 *
 *   node scripts/tidy-augment-text.mjs           # 미리보기(dry-run)
 *   node scripts/tidy-augment-text.mjs --write    # 실제 반영
 *
 * 증강 카드는 "효과 + 수치 + 발동 조건"을 보고 고르는 화면이다. 플레이버 대사나
 * 아이템 나열 꼬리가 들어가면 정작 필요한 내용이 밀려난다.
 *
 * 규칙은 일부러 보수적이다 — 문장을 다시 쓰는 일은 하지 않는다. 기계가 확실히 판별할 수 있는
 * 것(따옴표로 감싼 대사, 말줄임으로 끝나는 꼬리, 수치가 빠져 생긴 빈 괄호·공백)만 손대고,
 * 길이를 줄이려고 의미를 재구성하는 건 사람이 판단한다.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const SELFTEST = process.argv.includes('--selftest');
const FILES = ['ko', 'en'].map((l) => ({
  locale: l,
  file: path.join(root, `src/features/augments/data/augments.${l}.json`),
}));

function tidy(desc) {
  return (
    desc
      // 문장 끝에 붙은 플레이버 대사 — '아니, 아니, 자르반 1세가…' 같은 것
      .replace(/\s*[‘'"“][^‘'"“”’]{8,}[’'"”][.\s]*$/u, '')
      // 말줄임으로 흐려지는 꼬리 문장. 앞 문장의 종결부(.!?)가 반드시 있어야 '꼬리'로 본다 —
      // lookbehind 없이 두면 종결부가 없는 한 문장짜리 설명에서 매칭이 0번째 글자부터
      // 시작해 설명 전체가 통째로 지워진다.
      .replace(/(?<=[.!?])\s*[^.!?]*?(?:\.\.\.|…)\s*$/u, '')
      // 수치가 빠져 생긴 껍데기
      .replace(/\(\s*[+*]?\s*\)/g, '')
      .replace(/\s+%/g, '%')
      .replace(/\s+([.,)])/g, '$1')
      .replace(/([(])\s+/g, '$1')
      // 카드는 좁아서 문단 나눔이 자리만 먹는다 — 한 덩어리로 합친다.
      .replace(/\s*\n+\s*/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  );
}

// 정규식이 문장을 지나치게 먹는지 보는 최소 검사. 여기서 걸리는 건 전부 실제로 겪은 건들이다.
//   node scripts/tidy-augment-text.mjs --selftest
if (SELFTEST) {
  const cases = [
    // 종결부 없는 한 문장은 통째로 지워지면 안 된다 — 예전 정규식이 여기서 ''를 뱉었다.
    ['적중 시 이동 속도가 증가합니다…', '적중 시 이동 속도가 증가합니다…'],
    ['Gain movement speed on hit...', 'Gain movement speed on hit...'],
    // 앞 문장이 끝난 뒤의 말줄임 꼬리만 걷어낸다.
    ['공격력이 25 증가합니다. 아니, 아니, 자르반 1세가…', '공격력이 25 증가합니다.'],
    // 수치가 빠져 생긴 껍데기와 문단 나눔.
    ['체력을 (  ) 회복합니다.\n\n재사용 대기시간 30초', '체력을 회복합니다. 재사용 대기시간 30초'],
    ['적을 % 둔화시킵니다.', '적을% 둔화시킵니다.'],
  ];
  for (const [input, want] of cases) {
    assert.equal(tidy(input), want, JSON.stringify(input));
  }
  // 실제 데이터를 하나도 비우지 않는지도 같이 본다.
  for (const { locale, file } of FILES) {
    for (const a of JSON.parse(readFileSync(file, 'utf8'))) {
      assert.ok(tidy(a.description ?? '').trim(), `[${locale}] ${a.name} 의 설명이 정제 후 비었다`);
    }
  }
  console.log(`✓ tidy 셀프테스트 통과 (케이스 ${cases.length}건 + 데이터 전건)`);
  process.exit(0);
}

let changed = 0;
const preview = [];
for (const { locale, file } of FILES) {
  const list = JSON.parse(readFileSync(file, 'utf8'));
  for (const a of list) {
    const next = tidy(a.description ?? '');
    // 정제가 설명을 통째로 날린 경우엔 원본을 지킨다. 카드에 빈 설명이 뜨는 것보다
    // 다듬어지지 않은 설명이 뜨는 편이 낫고, 무엇이 문제인지도 눈에 보인다.
    if (next !== a.description && next.trim()) {
      changed++;
      if (preview.length < 40) {
        preview.push(`  [${locale}] ${a.name}\n    - ${a.description}\n    + ${next}`);
      }
      a.description = next;
    }
  }
  if (WRITE) writeFileSync(file, JSON.stringify(list, null, 2) + '\n');
}

console.log(`정리 대상 ${changed}건`);
if (preview.length) console.log('\n' + preview.join('\n'));
console.log(WRITE ? '\n✓ 반영 완료' : '\n(미리보기 — 반영하려면 --write)');
