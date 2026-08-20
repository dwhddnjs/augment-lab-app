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
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const FILES = ['ko', 'en'].map((l) => ({
  locale: l,
  file: path.join(root, `src/features/augments/data/augments.${l}.json`),
}));

export function tidy(desc) {
  return (
    desc
      // 문장 끝에 붙은 플레이버 대사 — '아니, 아니, 자르반 1세가…' 같은 것
      .replace(/\s*[‘'"“][^‘'"“”’]{8,}[’'"”][.\s]*$/u, '')
      // 말줄임으로 흐려지는 꼬리 문장
      .replace(/\s*[^.!?]*?(?:\.\.\.|…)\s*$/u, '')
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

let changed = 0;
const preview = [];
for (const { locale, file } of FILES) {
  const list = JSON.parse(readFileSync(file, 'utf8'));
  for (const a of list) {
    const next = tidy(a.description ?? '');
    if (next !== a.description) {
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
