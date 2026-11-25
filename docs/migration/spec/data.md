# 데이터 명세 (번들 JSON · 파생 인덱스 · 순수 계산)

RN 원본: `src/features/*/data/`, `src/features/*/hooks/`, `src/lib/{ddragon,hangul,augment-text,arrays,i18n}.ts`, `src/features/items/{stats,item-filters,text}.ts`, `src/features/tierlist/tiers.ts`, `src/features/headliners/marked.ts`.
네트워크로 데이터를 받지 않는다. 전부 앱에 번들한다. JSON 파일은 옮기지 않고 세 앱이 같은 경로를 읽는다(README 결정 2).

## 1. 파일과 형태

| 파일 | 형태 | 개수 |
|---|---|---|
| `augments/data/augments.{ko,en}.json` | `Augment[]` `{id, name, description, rarity: silver/gold/prismatic, iconPath, augmentNameId, modes}` | 각 323개. 두 로케일이 같은 ID, 같은 순서. `modes ['aram']` 233, `[]` 90. `one-trick`만 `augmentNameId: ""` |
| `champions/data/champions.{ko,en}.json` | `Champion[]` `{id:'Aatrox', key:'266', name, title, blurb, tags[], stats(숫자 20개), imageKey:'Aatrox.png'}` | 172 |
| `champions/data/champion-spells.{ko,en}.json` | `{ [championId]: {q,w,e,r: {name, image}} }` | 173 키 (`Locke`는 대응 챔피언 없음) |
| `items/data/items.{ko,en}.json` | `Item[]` `{id:'3031', name, description(마크업), plaintext, gold{base,total,sell,purchasable}, tags[], stats, imageKey}` | 254 |
| `items/data/aram-item-ids.json` | `string[]` | 111 (전부 items에 있음) |
| `headliners/data/headliners.{ko,en}.json` | `{headliners:{[id]:{name,description}}, stickers:{[id]:{name,full}}, skills:{q,w,e,r}, skillTitle, skillBonus, skillBonusShort, anvils}` | 헤드라이너 13, 스티커 6 |
| `tierlist/data/tierlist.json` | `{patch, date, generatedAt, augIds: string[233], spellIcons{'1':path…}, aram: TierRow[172]}` | S26 A26 B18 C51 D51 |
| `tierlist/data/tierlist-items.{ko,en}.json` | `TierItem[]` `{id, name, iconPath}` | 101 |
| `src/lib/version.json` | `{ddragonVersion:'16.16.1', patch:'26.23', generatedAt}` | – |

증강 예시:
```json
{"id":"adapt","name":"ADAPt","rarity":"silver","iconPath":"/lol-game-data/assets/ASSETS/UX/Cherry/Augments/Icons/ADAPt_small.png","augmentNameId":"ARAM_ADAPt","modes":["aram"]}
```

**TierRow**:
```
{ key, score, sub, tier, augments: [augIds 인덱스, winrate×10000, sourceTier 1–4][], build: string[], situational: string[], spells: number[0|2], spellPick }
```
- `score` = 승률, `sub` = 픽률(둘 다 소수)
- **이미 티어순으로 정렬돼 있다. 다시 정렬하지 않는다.**
- 챔피언과는 `TierRow.key ↔ Champion.key`(숫자 문자열)로 잇는다. `Champion.id`가 아니다.

## 2. 로딩·인덱스

- **로케일**: `data[locale] ?? data.en`. 네이티브에서는 **현재 로케일 파일만** 읽는다. 로케일이 바뀌면 다시 읽는다.
- **증강**
  - `useAugments`: 전체 목록(옛 빌드 조회용)
  - `useAugmentPool('aram')`: `modes`에 `'aram'`이 있는 것만
  - `useAugmentName`: `transmuted`면 앞에 `전환: `(ko) / `Transmute: `(en)
- **아이템**
  - `useItems`: 전체(조회용)
  - `useItemPool('aram')`: `aram-item-ids` Set으로 거름
- `useTierlistItems`: 로케일별 `id → TierItem` 맵
- **ID 해석**: `resolveIds`(`lib/arrays.ts`)는 지금 데이터에 없는 ID를 조용히 버린다.
- **챔피언 정렬**: `name.localeCompare(b.name, locale)`. 정렬은 태그·검색 필터를 거친 뒤에 한다.
- **역할 순서**(`CHAMPION_TAGS`): Fighter, Assassin, Mage, Tank, Marksman, Support. 라벨은 `CHAMPION_TAG_LABELS`(`src/lib/i18n.ts`)

## 3. ddragon / CDragon URL (`src/lib/ddragon.ts`)

`CDN = https://ddragon.leagueoflegends.com/cdn/<ddragonVersion>`

| 함수 | URL |
|---|---|
| championSquareUrl(k) | `${CDN}/img/champion/${k}` |
| itemImageUrl(k) | `${CDN}/img/item/${k}` |
| spellImageUrl(k) | `${CDN}/img/spell/${k}` |
| 스플래시 (버전 없음) | `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg` |
| centered (버전 없음) | `…/cdn/img/champion/centered/${id}_0.jpg` |
| cdragonIconUrl(p) | `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default` + (p에서 `/lol-game-data/assets` 접두사를 대소문자 무시로 떼고 **전체 소문자**) |
| championClassIconUrl(tag) | `…/latest/plugins/rcp-fe-lol-static-assets/global/default/npe-ft-role-icon-${tag 소문자}.png` |

`augmentImageUrls(p)`: 폴백 체인 `[large, base, small]`
- large: `https://raw.communitydragon.org/latest/game` + 소문자 경로에서 `_small.ext` → `_large.ext`
- base: 같은 경로에서 `_small` 제거
- small: `cdragonIconUrl`
- 로컬 아이콘 10개(`assets/augments/*.png`, `ddragon.ts` 70~81행)에 해당하면 `[]`를 돌려주고 로컬 이미지를 쓴다

## 4. 텍스트 정리

### 4.1 `cleanAugmentDescription` (`lib/augment-text.ts`) — 이 순서대로 정규식 치환

1. `<br/?>` → `\n`
2. `<…>` 태그 제거
3. `(%i:…%)` 제거
4. `%i:…%` 제거
5. `@…@`와 뒤따르는 선택적 `%` 제거
6. `{{…}}` 제거
7. `|word` 제거
8. `;[^|<\s]+` 제거
9. 빈 `()` 제거
10. `.` `,` `%` `)` 앞 공백 제거
11. 공백·탭 2개 이상 → 1개
12. 줄바꿈 2개 이상 → 1개
13. trim

- 지금 증강 데이터에는 마크업이 없어 사실상 아무 일도 하지 않는다. 그래도 렌더 경로에서 호출한다.
- `cleanItemDescription`(`items/text.ts`): `<stats>…</stats>`를 먼저 지우고 위 정리를 돌린다.
- 검증 예시 — 아이템 3153 결과: `"Mist's Edge\nAttacks deal … On-Hit.\nClawing Shadows\nAttacking …"`

### 4.2 헤드라이너 색 마크업 (`headliners/marked.ts`)

- 정규식 `/\[(\w+)\](.*?)\[\/\1\]/g`. 중첩 없음. 짝이 안 맞는 태그는 평문으로 둔다.
- 키
  - 스티커: `k`, `ad`, `ap`, `as`, `hp`, `sv` → StatTextColors
  - 스킬 문구: `e`, `s`, `h`, `b` → SkillCardColors
- `stripMarks`: 텍스트 부분만 이어 붙인다

### 4.3 치환자

- `{n}` `{spell}` `{patch}` `{date}`는 `String.replace`로 바꾼다 → **처음 한 번만** 바뀐다(동작 그대로 유지)

## 5. 초성 검색 `matchName` (`lib/hangul.ts`)

1. `q = query.trim().toLowerCase()`. 빈 문자열이면 전부 일치.
2. `name.toLowerCase().includes(q)`면 일치.
3. 아니면, `q`가 `/^[ㄱ-ㅎ\s]+$/`일 때만 이름의 초성 문자열과 비교한다.
   - 음절 U+AC00–U+D7A3 → `CHOSEONG[floor((c−0xAC00)/588)]`(19개 표), 다른 문자는 그대로
   - 그 초성 문자열이 `q`를 포함하면 일치
4. `아ㅌ`처럼 섞인 질의는 일치하지 않는다.

## 6. 아이템 계산 (`items/stats.ts`, `items/item-filters.ts`)

### 6.1 `computeStats(baseLevel1, itemStats[])`

아이템 스탯을 더한 뒤 아래 규칙으로 계산한다.

| 스탯 | 계산 |
|---|---|
| 공격 속도 | base.as × (1 + Σas) |
| 이동 속도 | (base.ms + Σflat) × (1 + Σpct) |
| 체력·마나 재생 | base × (1 + Σ) |
| 치명타 | min(100, base.crit + Σcrit×100) |
| AP, 가속, 치명성, 마법 관통, 적응형 | base 0에서 시작 |
| 비율 스탯 | ×100 |
| 사거리 | 변하지 않음 |

- 각 스탯은 `{base, added, total}`로 돌려준다.
- `STAT_DISPLAY_ORDER`: 핵심 13개는 항상 보이고, 나머지는 0이 아닐 때만 보인다.
- `STAT_LABELS`: 라벨·단위·소수 자릿수

### 6.2 `formatItemStats`

1. 값이 있는 항목만 남긴다.
2. `movespeedFlat`/`movespeedPercent`는 이동 속도 라벨로 표시한다.
3. 비율 키는 ×100 + `%`.
4. 숫자는 `parseFloat(v.toFixed(1))`.
5. `' · '`로 잇는다.

### 6.3 필터

- `ITEM_CATEGORIES`: 아이템 ID 32개 오버라이드. 오버라이드가 태그보다 우선한다.
- 신발은 `boots`·`all` 탭에만 나온다.
- fighter / marksman / assassin / mage / tank / support / boots: 태그 기반 판정(`item-filters.ts` 79~208행) — **그대로 옮긴다**.

## 7. 티어리스트 계산 (`tierlist/tiers.ts`, `use-augment-groups`)

- **티어 기본**
  - `TIERS = S A B C D`
  - `augTierOf(t) = TIERS[t−1] ?? 'D'`
  - `pct(n) = (n×100).toFixed(1) + '%'`
- **`tierSections(match?)`**
  - 티어별로 2열 행으로 묶고, 빈 티어는 뺀다.
  - 검색은 챔피언을 숨기기만 한다. 티어는 바뀌지 않는다.
- `findTierRow(key)`
- **증강 그룹**
  1. `augIds[idx]`를 aram 풀과 ID로 잇는다.
  2. 희귀도별로 prismatic → gold → silver 순서로 묶고, 빈 그룹은 뺀다.
  3. 그룹 안에서 source tier 오름차순으로 **안정 정렬**한다(승률 순서는 유지).

## 8. 테스트 벡터 (네이티브 단위 테스트로 그대로 옮김)

- `scripts/check-augment-data.mjs`
  - ko/en 개수·ID·순서·modes·rarity·iconPath·augmentNameId 일치
  - 누락 augmentNameId 최대 1개
  - 개수 스냅샷 323/233/90
  - 포함·제외 ID 목록
  - 설명: 130자 이하, 비어 있지 않음, ko는 한글 포함
- `scripts/check-tierlist.ts`
  - patch·date 존재
  - ko/en 아이템 ID·순서 일치
  - 행 ≥150, 챔피언 key 유효·유일, 티어 순서
  - score 0.2–0.8, sub 0–1
  - 증강: 풀 안이면 2000–8000, tier 1–4, 점수 내림차순, 희귀도 3종
  - build ≤6, 중복 없음, situational과 겹치지 않음
  - spells 0 또는 2
  - 섹션이 모든 행을 순서대로 덮고, 검색 후에도 티어 불변
