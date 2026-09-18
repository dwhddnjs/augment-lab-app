# Augment Lab

칼바람 나락(아수라장) 증강·아이템 빌드 시뮬레이터 + 챔피언 티어리스트. **iOS 전용** Expo 앱.

## 실행

```bash
npm install
npm run ios      # 개발 빌드 설치 + 시뮬레이터 실행
npm start        # 설치된 개발 빌드에 Metro 만 붙일 때
npm run lint
```

## 데이터 갱신

| 명령 | 하는 일 |
| --- | --- |
| `npm run data:refresh` | DDragon 최신 챔피언·아이템 → `src/features/{champions,items}/data`, `src/lib/version.json` → 아이템 `stats` 재파싱 → 검수 페이지(`docs/index.html`) 재생성 |
| `npm run data:item-stats` | 아이템 설명의 `<stats>` 를 파싱해 `stats` 재생성 (`data:refresh` 가 자동으로 이어 실행) |
| `npm run data:tierlist` | 칼바람 티어리스트 → `src/features/tierlist/data` |
| `node scripts/fetch-classic-items.mjs` | 클래식 모드 아이템 풀 |

증강 데이터 패치 절차와 검수 페이지(`docs/index.html`)는 `.agents/skills/augment-check/SKILL.md` 참고.

## 자체 점검 (테스트 러너 대신 assert 스크립트)

```bash
npx tsx scripts/check-tierlist.ts
npx tsx scripts/check-backup.ts
npx tsx scripts/check-build-storage.ts
node scripts/check-rarity-odds.mjs
node scripts/check-augment-data.mjs
```

구조·코딩 규칙은 `CLAUDE.md`.
