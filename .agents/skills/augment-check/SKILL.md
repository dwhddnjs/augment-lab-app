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

- 검수 페이지는 **하나뿐이다**(`docs/index.html`). 칼바람·클래식 증강만이 아니라 아레나 증강·특수
  증강·아이템·프리즘 아이템까지 상단 `데이터` 칩으로 갈라 본다. 그래서 **아레나 데이터
  (`src/features/arena/data/*`)나 아이템 데이터를 고칠 때도 이 페이지를 재생성**한다.
- ko/en을 `id`로 병합해 rarity별로 보여주고, 앱과 동일한 이미지 URL 규칙
  (`augmentImageUrl(large)` 3단 폴백 / `cdragonItemIconUrl` / `itemImageUrl`)으로 아이콘을 렌더한다.
- 아이템은 **앱 진열 풀만**(칼바람 111 · 클래식 81) 싣는다. 나머지는 저장된 빌드를 되살릴 때만
  쓰여 카드로 뜨지 않는다 — 검수 대상이 아니다. 아레나 아이템은 칼바람 풀과 같은 집합이라
  배열을 나누지 않고 `modes` 플래그로만 가른다.
- 같은 아이콘 파일을 공유하는 증강은 **"공유" 배지**로 표시(오류 아님).
- **신규**·**수치 미확인**·**비활성** 배지와 "앱·위키 수치가 다른 건" 목록은 `docs/augment-diff.json`에서 온다.
  이 파일은 `node scripts/apply-mayhem-patch.mjs --write`가 만든다.
- **설명 수정됨** 배지는 `docs/desc-edited.json`에서 온다. 라이엇 원문을 손으로 줄이거나 고쳐 쓴
  항목의 id 목록이고, 데이터셋별로 키가 나뉜다(`aram`·`arena`·`special`) — 아레나와 칼바람은
  id가 99개 겹쳐 한 배열에 담을 수 없다. 설명을 손볼 때마다 여기에 id를 추가할 것.
- 데이터 변경 후 `docs/index.html`도 **함께 커밋**할 것.

## 모드 구분이 먼저다 — 여기서 틀리면 전부 틀린다

`cherry-augments.json` 에는 **모드 구분이 없다.** 여기 있는 증강을 전부 칼바람으로 넣으면
다른 모드 전용 증강이 칼바람 풀을 오염시킨다(실제로 클래식 전용 55개가 들어갔던 적이 있다).

모드를 가르는 정답은 **`v1/augment-lists.json`** 이다:

| modeName | 이 앱의 모드 | 비고 |
| --- | --- | --- |
| `KIWI` | `aram` — 칼바람 나락 아수라장 | 풀 220개 → 앱 211개 |
| `KIWI_JADE` | `classic` — 아수라장 클래식 스타일 | 풀 188개 → 앱 187개 |
| `CHERRY` | 아레나 | `features/arena` 가 따로 관리 |

두 모드는 증강을 상당수 공유하므로 한 증강이 `modes: ['aram','classic']` 을 가질 수 있다.
어느 풀에도 없으면 `modes: []`(미출시/제거) — 데이터는 남기되 뽑기에는 안 쓴다.

**동명이인 함정**: CDragon 에는 이름이 같은 증강이 115쌍 있다(`ARAM_ADAPt` vs `ADAPt`).
한쪽만 모드 풀에 속한다. 이름으로 매칭하면 어느 쪽이 걸릴지 순회 순서에 달리므로,
**풀 소속을 이름보다 먼저 본다.** 확정한 `augmentNameId` 는 데이터에 저장해 이후 조회가
이 키 하나로 가게 한다.

## 패치 반영 절차

```bash
node scripts/apply-mayhem-patch.mjs --write    # (필요 시) 신규 증강 수집 + docs/augment-diff.json
node scripts/tag-augment-modes.mjs --write     # augmentNameId·modes 확정, 아이콘 CDragon 기준 교정
node scripts/tidy-augment-text.mjs --write     # 플레이버·군더더기 정리
node scripts/check-augment-data.mjs            # 정합성 검증 (개수 스냅샷·설명 길이·깨진 수치)
node scripts/tidy-augment-text.mjs --selftest  # 정제 정규식이 문장을 먹지 않는지
node scripts/gen-data-check.mjs               # 검수 페이지 재생성
```

`tag-augment-modes.mjs` 는 **아이콘을 CDragon 기준으로 되돌리되 generic 으로 퇴보시키지 않는다** —
CDragon 값이 `GenericAbilityAugmentIcon*` 이면 앱에 들어 있는 개별 아이콘을 그대로 둔다
(빵과 버터/치즈/잼이 이 경우다).

## 설명 길이

증강 카드는 폰트를 **고정**한다(카드마다 글자 크기가 달라지면 읽기 힘들다). 그래서 길이는
UI 가 아니라 데이터에서 맞춘다 — `rarity-card-frame.tsx` 가 `numberOfLines={6}` · `fontSize 8`
이라 **6줄을 넘기면 말줄임표로 잘린다**.

글자 수만 세면 안 된다. 명시적 줄바꿈(`\n`)이 든 설명은 129자로도 9줄이 된다 — 아레나의
`불멸의 경계`가 그 경우다. 그래서 `gen-data-check.mjs` 의 `estimateCardLines()` 가 어절 단위로
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
