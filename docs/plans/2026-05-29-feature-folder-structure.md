# 폴더 구조 재편 + CLAUDE.md 규칙화 플랜

## Context

현재 `src/`는 레이어 기반(components/hooks/data/types/lib)으로 흩어져 있어, 한 도메인(예: champions)의 코드를 보려면 5개 폴더를 오가야 한다. 도메인이 뚜렷한 앱(champions/augments/items/builds)이므로 **feature 기반**으로 재편하면 가독성과 응집도가 크게 개선된다.

또한 현재 CLAUDE.md에는 디자인 시스템·i18n 규칙은 있지만 **폴더 구조/모듈 경계 규칙이 없어** 새 코드가 어디로 가야 할지 일관성이 없다. 재편과 함께 CLAUDE.md에 규칙을 명문화한다.

목표:
- src/를 feature 기반으로 한 번에 재편
- 공용 UI는 components/{themed,navigation,ui}로 세분화
- lib/는 인프라(외부 클라이언트·i18n)만 남기고 도메인 데이터는 feature로 이동
- CLAUDE.md에 폴더 구조 규칙 섹션 추가

---

## 최종 폴더 구조

```
src/
├── app/                            # Expo Router 라우트 (변경 없음)
│   ├── _layout.tsx
│   ├── select-champion-modal.tsx   # 얇은 라우트 (UI는 features/champions로)
│   └── (tabs)/...
│
├── features/                       # 도메인별 응집 모듈
│   ├── champions/
│   │   ├── components/             # ChampionSelectModal 등
│   │   ├── hooks/                  # use-champions.ts
│   │   ├── data/                   # champions.{ko,en}.json
│   │   └── types.ts                # Champion 타입
│   ├── augments/
│   │   ├── hooks/                  # use-augments.ts
│   │   ├── data/                   # augments.{ko,en}.json
│   │   └── types.ts
│   ├── items/
│   │   ├── hooks/                  # use-items.ts
│   │   ├── data/                   # items.{ko,en}.json
│   │   └── types.ts
│   └── builds/
│       ├── queries/                # builds.ts, favorites.ts
│       └── types.ts                # (필요 시)
│
├── components/                     # 도메인 무관한 공용 UI만
│   ├── themed/                     # themed-text, themed-view
│   ├── navigation/                 # app-tabs.{ios,android}.tsx, animated-icon
│   └── ui/                         # hint-row, collapsible, external-link, web-badge
│
├── hooks/                          # 도메인 무관한 글로벌 훅
│   ├── use-theme.ts
│   ├── use-color-scheme.ts
│   └── use-locale.ts
│
├── lib/                            # 인프라 / 외부 클라이언트 / 순수 유틸
│   ├── supabase.ts                 # 외부 클라이언트
│   ├── ddragon.ts                  # Riot CDN URL 빌더
│   ├── i18n.ts                     # useTranslation
│   └── hangul.ts                   # 한글 처리 유틸
│
├── constants/
│   └── theme.ts
│
└── styles/
    └── global.css                  # src/ 루트에서 이동
```

### 폴더 경계 규칙 (CLAUDE.md에 명문화될 내용)

1. **`src/app/`** = Expo Router 라우트만. 라우트 파일은 얇게 — 실제 UI는 `features/*/components`에서 import.
2. **`src/features/<도메인>/`** = 한 도메인에 종속된 모든 것 (components·hooks·data·types·queries). 다른 feature를 import하지 않는다 (필요하면 lib/hooks로 끌어올림).
3. **`src/components/`** = 도메인 무관한 공용 UI 프리미티브만. feature 폴더로부터 import하지 않는다.
   - `themed/` — ThemedText, ThemedView 등 토큰 래퍼
   - `navigation/` — 탭바·아이콘 등 네비게이션 chrome
   - `ui/` — 그 외 공용 (hint-row, collapsible 등)
4. **`src/hooks/`** = 여러 feature가 공유하는 글로벌 훅만 (테마·로케일·색상 스킴).
5. **`src/lib/`** = 외부 클라이언트 + 순수 유틸 + 인프라. React 의존 X (훅 아님).
6. **`src/constants/`** = 디자인 토큰 등 정적 상수.
7. **`src/types/`는 폐지** — 타입은 사용 feature로 동거시킨다.

---

## 마이그레이션 단계

다음 critical files가 이동·수정 대상:

### 1단계: features/ 신설 및 이동
- `src/data/champions.*.json` → `src/features/champions/data/`
- `src/data/augments.*.json` → `src/features/augments/data/`
- `src/data/items.*.json` → `src/features/items/data/`
- `src/data/version.json` → `src/lib/version.json` (도메인 무관)
- `src/hooks/use-champions.ts` → `src/features/champions/hooks/use-champions.ts`
- `src/hooks/use-augments.ts` → `src/features/augments/hooks/use-augments.ts`
- `src/hooks/use-items.ts` → `src/features/items/hooks/use-items.ts`
- `src/types/champion.ts` → `src/features/champions/types.ts`
- `src/types/augment.ts` → `src/features/augments/types.ts`
- `src/types/item.ts` → `src/features/items/types.ts`
- `src/lib/queries/builds.ts` → `src/features/builds/queries/builds.ts`
- `src/lib/queries/favorites.ts` → `src/features/builds/queries/favorites.ts`

### 2단계: components/ 세분화
- `src/components/themed-text.tsx` → `src/components/themed/themed-text.tsx`
- `src/components/themed-view.tsx` → `src/components/themed/themed-view.tsx`
- `src/components/app-tabs*.tsx` → `src/components/navigation/`
- `src/components/animated-icon.tsx` → `src/components/navigation/`
- `src/components/hint-row.tsx` → `src/components/ui/`
- `src/components/external-link.tsx` → `src/components/ui/`
- `src/components/web-badge.tsx` → `src/components/ui/`
- `src/components/ui/collapsible.tsx` 유지

### 3단계: select-champion-modal UI 추출
- `src/app/select-champion-modal.tsx`는 얇은 라우트로 유지하고, 실제 UI/로직은 `src/features/champions/components/champion-select-modal.tsx`로 분리해 import.

### 4단계: 기타
- `src/global.css` → `src/styles/global.css`
- `src/data/` 폴더 삭제, `src/types/` 폴더 삭제, `src/lib/queries/` 폴더 삭제
- 모든 import 경로를 `@/` alias 기반으로 일괄 업데이트 (예: `@/features/champions/hooks/use-champions`).

### 5단계: CLAUDE.md 업데이트
`## 아키텍처` 아래에 `### 폴더 구조 — 필수 규칙` 섹션 신설. 위 "폴더 경계 규칙" 7개 항목을 그대로 명문화 + 트리 예시 포함. 기존 `### 라우팅` / `### 플랫폼별 파일` 섹션은 유지하되 새 구조 기준으로 예시 경로만 수정.

또한 다음 규칙을 명시:
- **새 도메인 코드를 어디에 둘지** — feature가 있으면 그 안에, 없으면 신설.
- **공용 UI 후보 판단** — 한 feature에서만 쓰면 feature 안에, 2개 이상이면 components/ui로 승격.
- **feature 간 import 금지** — 공유가 필요하면 hooks/ 또는 lib/로 끌어올림.
- **types/ 폴더 만들지 말 것** — 타입은 사용처와 동거.

---

## Verification

마이그레이션 후 검증:

1. **타입 체크**: `npx tsc --noEmit` 통과 (import 경로 모두 정상)
2. **린트**: `npm run lint` 통과
3. **빌드 실행**: `npm start` → iOS 시뮬레이터 또는 Expo Go로 부팅
4. **수동 동선 점검**:
   - 홈 탭 진입 → 챔피언 목록 로드 확인 (champions 데이터/훅)
   - select-champion-modal 열기 → 검색·선택 동작 확인
   - 커뮤니티 탭 → builds 쿼리 동작 확인
   - 마이페이지 → favorites 쿼리 동작 확인
   - 다크/라이트 테마 전환 → ThemedText/ThemedView 정상
   - 로케일 ko/en 전환 → 텍스트 변경 확인
5. **잔여 참조 grep**: `grep -r "src/data\|src/types\|lib/queries" src/` 결과 0건 확인.

---

## 주의

- React Compiler가 켜져 있으므로 `useMemo`/`useCallback` 수동 추가 금지 — 단순 이동만.
- `*.web.tsx` / `*.web.ts` 파일 만들지 않음.
- 디자인 토큰(`colors`, `Spacing`, `Radius`) 사용 규칙은 기존 그대로 유지.
- 이동 중 파일 내용은 import 경로 외에는 변경하지 않는다 (리팩터 + 이동을 한 PR에 섞지 않음).
