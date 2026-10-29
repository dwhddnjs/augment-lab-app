---
name: augment-check
description: "증강 데이터(src/features/augments/data/augments.{ko,en}.json)를 수정·추가·삭제할 때마다 검수 페이지(docs/index.html)를 재생성하는 절차. 증강 아이콘 경로(CDragon Kiwi 폴더) 원칙 포함. 증강 데이터를 건드릴 때 반드시 읽고 따를 것."
version: 1.0.0
license: MIT
---

# 증강 데이터 변경 → 검수 페이지 갱신

`src/features/augments/data/augments.{ko,en}.json`을 **수정·추가·삭제할 때마다** 검수 페이지를 반드시 재생성한다:

```bash
node scripts/gen-data-check.mjs   # → docs/index.html
```

- 검수 페이지는 **하나뿐이다**(`docs/index.html`). 칼바람 증강과 아이템을 상단 `데이터`
  칩으로 갈라 본다. 그래서 **아이템 데이터를 고칠 때도 이 페이지를 재생성**한다.
- ko/en을 `id`로 병합해 rarity별로 보여주고, 앱과 동일한 이미지 URL 규칙
  (`augmentImageUrls` large→base→small 3단 폴백 / `itemImageUrl`)으로 아이콘을 렌더한다.
- 아이템은 **앱 진열 풀만**(칼바람 111) 싣는다. 나머지는 저장된 빌드를 되살릴 때만
  쓰여 카드로 뜨지 않는다 — 검수 대상이 아니다.
- 같은 아이콘 파일을 공유하는 증강은 **"공유" 배지**로 표시(오류 아님).
- **신규**·**수치 미확인**·**비활성** 배지와 "앱·위키 수치가 다른 건" 목록은 `docs/augment-diff.json`에서 온다.
  이 파일은 `node scripts/apply-mayhem-patch.mjs --write`가 만든다.
- **설명 수정됨** 배지는 `docs/desc-edited.json`에서 온다. 라이엇 원문을 손으로 줄이거나 고쳐 쓴
  항목의 id 목록이고, 데이터셋별로 키가 나뉜다(지금은 `aram` 하나). 설명을 손볼 때마다 여기에
  id를 추가할 것.
- 데이터 변경 후 `docs/index.html`도 **함께 커밋**할 것.

## 모드 구분이 먼저다 — 여기서 틀리면 전부 틀린다

`cherry-augments.json` 에는 **모드 구분이 없다.** 여기 있는 증강을 전부 칼바람으로 넣으면
다른 모드 전용 증강이 칼바람 풀을 오염시킨다(실제로 클래식 전용 55개가 들어갔던 적이 있다).

모드를 가르는 정답은 **`v1/augment-lists.json`** 이다:

| modeName | 이 앱의 모드 | 비고 |
| --- | --- | --- |
| `KIWI` | `aram` — 칼바람 나락 아수라장 | 26.21 풀 249개 → 앱 234개 (펜타킬 헤드라이너 5 · 수동 제외 10 빠짐) |
| `KIWI_JADE` | 아수라장 클래식 스타일 | 앱에서 제거됨(2026-10-30) — 태그하지 않는다 |
| `CHERRY` | 아레나 | 앱에서 제거됨(2026-09-19) — 가져오지 않는다 |

칼바람 풀에 없으면 `modes: []`(**비공개** — 미출시·패치로 삭제·옛 클래식 전용) — 데이터는
남기되 뽑기·첫 설치 프리웜에는 안 쓴다. 옛 빌드가 참조할 수 있어 지우지 않는다.
패치 노트의 "삭제된 증강" 목록보다 **풀이 정답이다** — 26.21 에서 `으악, 내 동전!` 은 노트에
없었지만 풀에서 빠졌다.

**동명이인 함정**: CDragon 에는 이름이 같은 증강이 115쌍 있다(`ARAM_ADAPt` vs `ADAPt`).
한쪽만 모드 풀에 속한다. 이름으로 매칭하면 어느 쪽이 걸릴지 순회 순서에 달리므로,
**풀 소속을 이름보다 먼저 본다.** 확정한 `augmentNameId` 는 데이터에 저장해 이후 조회가
이 키 하나로 가게 한다.

## 패치 반영 절차

```bash
node scripts/apply-mayhem-patch.mjs --write    # (필요 시) 신규 증강 수집(KIWI 풀 소속만) + docs/augment-diff.json
node scripts/tag-augment-modes.mjs --write     # augmentNameId·modes 확정, 아이콘 CDragon 기준 교정
node scripts/tidy-augment-text.mjs --write     # 플레이버·군더더기 정리
node scripts/check-augment-data.mjs            # 정합성 검증 (개수 스냅샷·설명 길이·깨진 수치)
node scripts/tidy-augment-text.mjs --selftest  # 정제 정규식이 문장을 먹지 않는지
node scripts/gen-data-check.mjs               # 검수 페이지 재생성
```

두 스크립트 모두 **기존 증강의 아이콘을 바꾸지 않고 CDragon 과 다른 건만 리포트한다.**
CDragon 값이 인게임과 다른 경우가 있어서다(꽁! 은 게임에서 generic, 빵과 버터/치즈/잼은 앱의
개별 아이콘이 맞다). 리포트를 보고 사람이 판단한다.

### 신규 증강 설명은 손으로 쓴다 (26.21 부터)

26.21 부터 신규 증강의 stringtable 키가 해시(`{15ee3ba207}`)로만 나오고, Kiwi 계수도 map30 에
없다. 그래서 `apply-mayhem-patch.mjs` 의 신규 설명은 **위키 `MayhemAugmentData` 영문 초안**으로
채워진다(수치 포함). ko/en 최종 문장은 손으로 쓴다:

1. 공식 한국어 문장 — 직전 패치 대비 **새로 생긴 해시 키**만 추려(`latest` vs `16.(N-1)`
   `lol.stringtable.json`) 위키 영문 설명의 핵심어로 en 툴팁을 찾고, 같은 키의 ko 값을 쓴다.
2. 수치 — 위키 값. 레벨 비례는 `40~100`(ko) / `40-100`(en). 소환사 주문형 증강(트럼펫 폭발 등)은
   `Module:SpellData/data` 에 수치가 있다.
3. 길이 — 카드 6줄(아래)과 `check-augment-data.mjs` 의 130자를 둘 다 지킨다.
4. 신규 id 를 `docs/desc-edited.json` 에 추가.
5. 패치 노트와 위키 수치가 다르면 위키(게임 데이터 추출)를 따르고 검증 기록에 남긴다.

### 직전 패치들의 수치 변경도 확인한다

패치 노트의 아수라장 "증강" 변경 목록은 매 패치 나온다. 앱 설명에 수치·동작이 적힌 증강이면
반영해야 하는데, 신규 추가만 보다가 놓치기 쉽다(26.20 의 하체 운동의 날·주문 분산·도취가
26.21 작업 때야 발견됐다). 반영할 때 **마지막 반영 이후 모든 패치 노트**의 아수라장 섹션을 본다.

## 설명 길이

증강 카드는 폰트를 **고정**한다(카드마다 글자 크기가 달라지면 읽기 힘들다). 그래서 길이는
UI 가 아니라 데이터에서 맞춘다 — `rarity-card-frame.tsx` 가 `numberOfLines={6}` · `fontSize 8`
이라 **6줄을 넘기면 말줄임표로 잘린다**.

글자 수만 세면 안 된다. 명시적 줄바꿈(`\n`)이 든 설명은 129자로도 9줄이 된다(옛 아레나의
`불멸의 경계`가 그 경우였다). 그래서 `gen-data-check.mjs` 의 `estimateCardLines()` 가 어절 단위로
줄바꿈을 시뮬레이션해 **`잘림 ko N줄` / `잘림 en N줄` 배지**를 붙이고, `표시 > 설명 잘림` 칩으로
모아 본다. 폭 상수 `CARD_DESC_WIDTH = 109` 는 iPhone 15 가로 기준이다(시뮬레이터와 어긋나면
이 숫자만 조정).

`check-augment-data.mjs` 의 `LIMIT = 130` 은 줄바꿈을 못 보는 옛 근사다. 설명 정리가 끝나
잘림이 0건이 되면 `estimateCardLines` 를 공용으로 빼서 이 검사를 대체할 것.

수치 출처가 셋으로 나뉘니 섞지 말 것:

- **이름·rarity·아이콘** → CDragon `cherry-augments.json` (게임 클라이언트 실데이터, 최우선)
- **신규 증강 수치** → 게임 bin `map30.bin.json`의 `Augment_*` DataValues.
  stringtable 설명의 `@Var@`를 여기 값으로 채운다. CDragon 증강 JSON에는 수치가 없다.
- **기존 증강 수치** → 위키 `Module:MayhemAugmentData/data`. 다만 **일괄 반영 금지** —
  수치 차이 대부분이 패치 변경이 아니라 서술 상세도 차이라, 덮으면 다듬어 둔 설명이 무너진다.
  앱에 수치가 아예 없는 "명백한 누락"만 보강하고 나머지는 검수 페이지에서 눈으로 가린다.

위키는 Cloudflare 뒤에 있어 node `fetch`로는 403이 난다(스크립트가 `curl`로 우회).

## 아이콘 경로 원칙

- **CDragon 에 컬러 원본이 없으면(흰 `_small` 실루엣뿐) 위키 원본을 앱에 넣는다.**
  - `_small` 은 그레이스케일 흰 실루엣이라 컬러 아이콘들 사이에서 튄다.
  - `tintColor` 로 칠하면 안 된다. iOS 템플릿 렌더링이라 테두리·문양 구분이 사라진다(26.21 에서 시도·폐기).
  - 위키 `<이름>_mayhem_augment.png`(CDragon `_large` 와 픽셀 동일)를
    `assets/augments/<CDragon 파일명에서 _small 뺀 것>.png` 로 넣는다.
  - `src/lib/ddragon.ts` `LOCAL_AUGMENT_ICONS` 에 등록한다. 검수 페이지는 이 표를 읽어 그리므로, 등록을 빠뜨리면 검수 페이지에서도 흰 실루엣으로 보인다.
  - CDragon 이 `_large` 를 내면 표와 파일을 지운다.

- **ARAM Mayhem 증강은 `.../UX/Kiwi/Augments/Icons/...` 폴더 사용**. `Cherry`/`Strawberry`(Arena) 폴더를 쓰지 말 것.
- CDragon `cherry-augments.json`에서 rarity(`kSilver`/`kGold`/`kPrismatic`)가 데이터와 일치하는 `Kiwi` 항목을 정답으로 삼는다.

## 개수가 바뀌면 검사가 멈춘다 — 정상이다

어떤 증강이 어느 모드에 속하는지의 정답은 CDragon `augment-lists.json` 에만 있어서,
데이터 파일만 놓고는 모드 분리가 맞는지 논리적으로 검증할 수 없다. 자기 자신을 근거로
자기를 검사하는 꼴이 되기 때문이다(예전 검사가 `!modes.includes('aram') && modes.includes('aram')`
라는 모순식이라 영원히 통과했던 이유가 이것이다).

그래서 `check-augment-data.mjs` 는 사람이 확인한 시점의 개수를 `EXPECTED` 에 박아두고
흔들리면 멈춘다. 클래식 전용 55개가 칼바람에 섞이면 211 → 266 이 되므로 여기서 걸린다.

패치를 반영해 개수가 정말로 바뀌었다면 **검사를 지우지 말고 `EXPECTED` 를 갱신**하고,
무엇이 몇 개 늘고 줄었는지 검증 기록에 남길 것.

## map30 캐시

`apply-mayhem-patch.mjs` 는 20MB 짜리 `map30.bin.json` 을 `node_modules/.cache/augment-data` 에
캐시한다. 하루가 지나면 자동으로 다시 받고, 새 패치가 떴는데 즉시 갱신하려면 `--refresh` 를 붙인다.
캐시가 깨졌으면 스크립트가 스스로 지우고 재실행을 안내한다.
