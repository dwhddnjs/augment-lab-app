# 드래프트 화면 개선 플랜

## Context

`src/features/draft/components/draft-screen.tsx`의 ARAM 증강 드래프트 화면에 6가지 문제가 있다. 목표는 실제 LoL ARAM 증강 선택 화면(첨부 스크린샷 3장)과 최대한 동일한 카드 UX를 제공하는 것. 가장 중요한 요구사항은 **카드 스타일을 레퍼런스와 똑같게** 만드는 것.

탐색 결과 확인된 핵심 사실:
- `expo-screen-orientation`은 이미 설치(`~56.0.5`)되어 있고 `app.json` plugins에도 등록됨. 하지만 `src/features/draft/hooks/use-landscape-lock.ts`는 **빈 no-op**. `app.json` 기본값은 `"orientation": "portrait"`.
- `pickWeighted`(`use-draft.ts`)는 카드마다 희귀도를 **독립적으로** 뽑음 → 같은 라운드에 실버/골드/프리즘이 섞임.
- 증강 아이콘은 Riot CDN에 **64×64(`_small.png`)만** 존재(`_large` 404). 현재 `iconSize = cardWidth*0.42`(~80px+)로 업스케일해서 깨져 보임.
- `augments.ko.json`은 **한글이 0자** — 전부 영어. 데이터 파이프라인(`scripts/fetch-data/fetch-augments.ts`)이 en/ko에 같은 영어 데이터를 씀.
- CDragon `cherry-augments.json`(ko_kr)에 한글 **이름**은 있음(앱 202개 중 200개 매칭). 단 **설명(description)은 어떤 CDragon JSON에도 없음**(Arena 설명셋은 ARAM Mayhem과 0개 겹침).

## 사용자 결정사항
1. **설명**: 한글 설명 소스를 더 찾아본다(느림·불확실). → 찾되, 못 찾은 증강은 영어 설명 폴백.
2. **아이콘**: 원본 64px 크기로 링 안에 또렷하게 표시(업스케일 금지).

---

## 작업 항목

### 0. 플랜 문서 저장 (실행 첫 단계)
이 플랜을 `docs/plans/2026-06-01-draft-screen-rework.md`로 복사 저장(CLAUDE.md 규칙).

### 1. 가로 모드 강제 (`use-landscape-lock.ts`)
- `expo-screen-orientation`으로 구현. 화면 진입 시 `lockAsync(OrientationLock.LANDSCAPE)`, 언마운트 시 `lockAsync(OrientationLock.PORTRAIT_UP)`(또는 `unlockAsync`)로 복귀.
- `useEffect` + cleanup 패턴. 비동기 호출은 try/catch로 감싸 Expo Go에서 실패해도 크래시 없게.
- `draft-result` 화면도 가로 유지가 자연스러우면 동일 훅 사용 검토(현재 범위 밖이면 draft만).
- 검증 포인트: `app.json`의 portrait 기본값은 그대로 두고 런타임 락만 사용(다른 화면은 세로 유지).

### 2. 같은 희귀도 3장 (`use-draft.ts`)
- `pickWeighted`를 **2단계**로 변경: ① 라운드 가중치(`RARITY_WEIGHTS`)로 **희귀도 하나를 먼저 롤** → ② 그 희귀도 풀에서 3장 추출(중복 없이, 풀 부족 시 차상위 희귀도로 보충).
- `reroll`은 **현재 카드와 같은 희귀도**에서 1장 재추첨(같은 색 유지).
- 기존 시그니처(`currentCards`, `reroll`, `pick`)는 유지해 `draft-screen.tsx` 영향 최소화.

### 3. 증강 데이터 한글화 (데이터 파이프라인)
- `scripts/fill-augment-icons.mjs`와 같은 방식(정규화 이름 매칭)으로 **한글 이름 채우기 스크립트** 추가/확장:
  - 소스: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json`의 `nameTRA`.
  - en `nameTRA`→`id`→ko `nameTRA` 매핑으로 200/202 커버. 미매칭 2개(`Fetch`, `Quest: Sneakerhead`)는 수동 한글 매핑.
  - 결과를 `augments.ko.json`의 `name`에 기록(en.json은 영어 유지).
- **한글 설명 리서치(불확실)**: CDragon 게임 스트링테이블/`.bin`(`game/data/...`)에서 cherry/mayhem 증강 description 한글 문자열을 찾아 매칭 시도.
  - 성공 시 `augments.ko.json`의 `description`에 기록.
  - **실패한 증강은 영어 설명 폴백**(빈 화면 방지). 폴백 비율을 콘솔에 리포트.
- 데이터 무결성: 두 파일의 `id`/순서/개수 동일 유지.

### 4. 카드 스타일 레퍼런스화 (`draft-card-frame.tsx`) — **최우선**
스크린샷 기준 재디자인. 모든 색/간격/반경은 `theme.ts` 토큰 + `AugmentRarityColors` 사용:
- **외곽**: 둥근 사각형, `borderCurve: 'continuous'`, 희귀도색 얇은 테두리 + 은은한 글로우(`boxShadow` 사용, legacy shadow* 금지 — SKILL 규칙).
- **배경**: 중앙이 살짝 더 어두운 다크 그라디언트(`expo-linear-gradient`, 이미 사용 중).
- **아이콘 영역**: 상단에 **원형 링**(희귀도색 테두리) + 뒤쪽 희귀도색 방사형 글로우, 그 안에 아이콘을 **원본 ~56–64px 그대로**(contain, 업스케일 금지).
- **이름**: 흰색 볼드, 가운데, 2줄(`ThemedText type="label"`).
- **희귀도 라벨**: 이름 아래 작은 캡션(한글 `실버/골드/프리즘`, 로케일 분기), 양옆 작은 보석/마름모 장식(선택). 색은 희귀도색.
- **설명**: 회색 본문(`type="caption"`), 가운데, 4줄, 숫자/키워드 하이라이트는 현행 `cleanAugmentDescription` 유지.
- 프리즘은 기존처럼 `AugmentRarityColors.prismatic.gradient` 무지개 테두리 유지.
- 레이아웃은 가로 모드 3열 기준으로 높이/폰트 밸런스 재조정(`cardWidth*(14/9)` 비율 유지 검토).

### 5. 리롤 애니메이션 fade in/out (`draft-card.tsx`)
- 현재 진입은 `rotateY` **카드 뒤집기**(flip). 리롤은 translateY exit. → **flip 제거하고 fade**로 통일:
  - 진입/리셋: `opacity` 0→1 fade in(+ 미세 scale). `rotateY`/`frontStyle`(flip 관련) 제거.
  - 리롤 exit: `opacity` 1→0 fade out 후 `onExitDone`/리마운트로 새 카드 fade in.
  - `card back`(뒤집기용 뒷면 View)와 `perspective`/`rotateY` 변환 제거로 단순화.
- `draft-screen.tsx`의 `handleReroll` 타이밍(현재 260ms)을 fade 길이에 맞게 조정. `pick`의 unchosen exit는 현행 유지(또는 동일하게 fade로 정리).
- React Compiler 켜져 있으므로 수동 `useMemo/useCallback` 추가 금지. 단 `useFocusEffect` 예외 규칙은 해당 없음.

### 6. 로케일 적용 확인 (`draft-screen.tsx` / `draft-card-frame.tsx`)
- `useAugments()`는 이미 `useLocale()`로 ko/en 분기 → #3에서 ko.json만 한글화하면 이름/설명 자동 적용.
- 카드 내 **희귀도 라벨**은 하드코딩(`charAt(0).toUpperCase()...`) → 로케일 dict(`실버/골드/프리즘` vs `Silver/Gold/Prismatic`)로 교체. `t = { ko, en }` + `useTranslation` 패턴(CLAUDE.md 규칙).

---

## 수정 대상 파일
- `src/features/draft/hooks/use-landscape-lock.ts` — 가로 락 구현
- `src/features/draft/hooks/use-draft.ts` — 같은 희귀도 추첨/리롤
- `src/features/draft/components/draft-card-frame.tsx` — 카드 스타일 재디자인(핵심), 희귀도 라벨 로케일
- `src/features/draft/components/draft-card.tsx` — flip 제거, fade in/out
- `src/features/draft/components/draft-screen.tsx` — 리롤 타이밍/exitMode 조정(필요 시)
- `src/features/augments/data/augments.ko.json` — 한글 이름(+가능 시 설명)
- `scripts/`(신규 또는 `fill-augment-icons.mjs` 확장) — 한글 데이터 채우기 스크립트
- `docs/plans/2026-06-01-draft-screen-rework.md` — 플랜 문서 저장

## 검증
1. `npm run lint` 통과.
2. Expo Go(iOS)로 실행 → 챔피언 선택 후 드래프트 진입:
   - 화면이 **가로**로 회전하는지, 나가면 세로 복귀하는지.
   - 카드 3장이 **모두 같은 색**(희귀도)인지, 리롤 후에도 같은 색 유지인지.
   - 아이콘이 링 안에서 **또렷**한지(업스케일 깨짐 없음).
   - 리롤 시 카드가 **fade out→in**(뒤집기 아님)인지.
   - 카드 스타일이 스크린샷과 유사한지(테두리 글로우/원형 아이콘/라벨/설명).
   - 기기 로케일이 한국어일 때 이름/희귀도 라벨이 **한글**, (설명은 소스 확보 시 한글, 아니면 영어 폴백).
3. 데이터 스크립트 실행 후 ko/en json의 `id`/개수 일치 확인, 한글 이름 커버리지 콘솔 리포트 확인.

## 미해결 리스크
- 한글 **설명** 소스 확보는 불확실. 게임 스트링테이블/`.bin` 탐색이 실패하면 영어 설명 폴백으로 마무리(이름·희귀도 라벨은 한글 보장).
