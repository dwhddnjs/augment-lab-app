# 챔피언 선택 화면 — CLAUDE.md 폴더 구조 규칙 정합

## Context

`src/app/select-champion-modal.tsx`(라우트)가 화면 본체를
`features/champions/components/champion-select-modal.tsx`에서 import하고 있었다.

CLAUDE.md 경계 규칙 #2는 **화면 단위는 `features/<도메인>/screens/*-screen.tsx`에 두고,
조각(카드/타일/슬롯)만 `components/`에 둔다**고 규정한다. mypage는 이미
`features/mypage/screens/`로 이전됐으나 이 화면은 아직 `components/`에 있고
`*-screen.tsx` 네이밍도 아니었다. 이 마이그레이션을 적용해 구조를 규칙에 맞췄다.

**스코프: 구조 이동만.** 동작·스타일·디자인 토큰은 건드리지 않음(사용자 확정).

## 변경 내용

### 1. 화면 파일 이동 + 컴포넌트명 변경
- `git mv src/features/champions/components/champion-select-modal.tsx`
  → `src/features/champions/screens/champion-select-screen.tsx`
- `export function ChampionSelectModal()` → `export function ChampionSelectScreen()`
- 내부 로직/JSX/스타일은 그대로 유지

### 2. 라우트 import 수정
`src/app/select-champion-modal.tsx`:
```tsx
import { ChampionSelectScreen } from "@/features/champions/screens/champion-select-screen";

export default ChampionSelectScreen;
```

### 3. 건드리지 않은 것 (의도적)
- **라우트 파일명 `select-champion-modal.tsx` 유지** — URL `/select-champion-modal`이며
  `src/app/_layout.tsx`의 `Stack.Screen name` 및 `router.push("/select-champion-modal")`
  4곳(build-list-screen, app-tabs.{tsx,ios,android})이 이 경로에 의존.

## 검증
1. `npm run lint` — 통과
2. `npm run ios` 후 `+` 버튼 → 모달 표시 → 챔피언 선택 → 시작하기 → `/draft` 진입 확인
