# iOS 전용 전환 + `draft` → `aram` 리네임

작성일: 2026-07-10

## 배경

1. 앱을 **iOS 전용**으로 확정한다. Android 지원 코드·설정·에셋·문서를 모두 제거한다.
2. 초기 네이밍 `draft`는 아레나 모드가 추가되면서 의미가 모호해졌다. 칼바람(ARAM) 모드를 가리키는 `aram`으로 통일한다.

## A. Android 제거

### A-1. 플랫폼 분기 파일 → iOS 단일 파일로 병합

`.ios.tsx`를 확장자 없는 `.tsx`로 승격하고, `.android.tsx`와 폴백 `.tsx`를 삭제한다.

| 삭제 | 승격(rename) |
| --- | --- |
| `components/navigation/app-tabs.android.tsx`, `app-tabs.tsx`(폴백) | `app-tabs.ios.tsx` → `app-tabs.tsx` |
| `components/ui/glass-button.tsx`(폴백 위임) | `glass-button.ios.tsx` → `glass-button.tsx` |
| `features/champions/components/champion-select-icons.android.tsx` | `champion-select-icons.ios.tsx` → `champion-select-icons.tsx` |
| `features/champions/screens/champion-select-screen.android.tsx` | `champion-select-screen.ios.tsx` → `champion-select-screen.tsx` |
| `features/mypage/screens/mypage-screen.tsx`(jetpack-compose) | `mypage-screen.ios.tsx` → `mypage-screen.tsx` |

**유지**하는 폴백:
- `custom-tabs.tsx` — iOS 26 미만에서 NativeTabs 대신 쓰는 커스텀 탭바. Android가 아니라 **OS 버전** 폴백이므로 남긴다.
- `glass-button-fallback.tsx` — 리퀴드글래스 불가(iOS 26 미만/Expo Go) 폴백. 주석에서 Android 언급만 제거.

### A-2. Android 전용 코드 제거

- `hooks/use-hardware-back.ts` 삭제 → 호출부 3곳(`draft-screen`, `arena-screen`, `item-select-screen`)에서 훅과 `handleHardwareBack` 핸들러 제거.
- `app/_layout.tsx` — `select-champion-modal`의 `animation: Platform.OS === 'android' ? ...` 분기 제거.
- `constants/theme.ts` — `makeElevation`의 `androidElevation` 인자, `Fonts`/`BottomTabInset`의 `Platform.select` 제거. `Platform` import 제거.
- `components/themed/themed-text.tsx` — `fontWeight: Platform.select({ android: '700' })` 제거.
- `components/ui/collapsible.tsx` — `SymbolView` name 객체({ios,android,web}) → SF Symbol 문자열.
- `features/arena/screens/arena-screen.tsx` — `isAndroid` paddingRight 분기 제거.
- `features/builds/screens/build-detail-screen.tsx` — `isAndroid` headerLeft/headerRight/marginLeft 분기 제거.
- `NativeTabs.Trigger.Icon`의 `md=` (Material Symbol) prop 제거 — iOS는 `sf`만 쓴다.

### A-3. 설정 / 의존성 / 에셋

- `app.json` — `expo.android` 블록 삭제, `expo-splash-screen` 플러그인의 `android` 하위 옵션 삭제.
- `package.json` — `"android": "expo run:android"` 스크립트 삭제, `@expo/material-symbols` 의존성 삭제(Android mypage 전용이었음).
- 에셋 삭제: `assets/images/android-icon-{background,foreground,monochrome}.png`, `assets/store/icon-aram-android-512.png`, `assets/store/adaptive-{background,monochrome}.{png,svg}`.
  - `adaptive-foreground.png`는 splash 이미지 + `setup-screen.tsx`에서 쓰이므로 **유지**.

### A-4. 문서

- `CLAUDE.md` — `npm run android` 명령, "iOS·Android 앱" 서술 수정.
- `README.md` — Android emulator 링크 제거.
- `.agents/skills/expo-ui/` — `references/jetpack-compose.md` 삭제, `SKILL.md`·`references/{universal,headers}.md`에서 Android/Compose 서술 정리.
- `scripts/gen-synergies.mjs` — cross-platform 주석 정리.

## B. `draft` → `aram` 리네임

### B-1. 폴더·파일

```
src/features/draft/                 → src/features/aram/
  components/draft-card.tsx         → components/aram-card.tsx
  hooks/use-draft.ts                → hooks/use-aram.ts
  screens/draft-screen.tsx          → screens/aram-screen.tsx
  (champion-summary, picked-drawer, reroll-button, round-indicator, synergy-icon 는 이름 유지)

src/app/draft.tsx                   → src/app/aram.tsx
src/app/draft-items.tsx             → src/app/aram-items.tsx
```

> `features/aram`과 기존 `features/arena`가 나란히 놓인다. 파일명이 `aram-screen.tsx` / `arena-screen.tsx`로 한 글자 차이이므로 import 경로에 주의.

### B-2. 선언

| 기존 | 변경 |
| --- | --- |
| `DraftScreen` | `AramScreen` |
| `DraftCard` | `AramCard` |
| `useDraft` | `useAram` |
| `DraftPhase` / `DraftState` (types.ts) | `AramPhase` / `AramState` |

### B-3. 라우트 경로 문자열

- `/draft` → `/aram`, `/draft-items` → `/aram-items`
- `app/_layout.tsx`의 `Stack.Screen name`
- `use-champion-select.ts`의 `router.replace({ pathname: ... })`
- `aram-screen.tsx`의 `router.replace({ pathname: "/aram-items" })`

### B-4. 판단이 필요한 예외 — `build-list-screen.tsx`

`handleStartDraft` / `startDraft`("드래프트 시작") 는 빌드 목록의 빈 상태 CTA다. 이 화면은 **칼바람·아레나 탭이 공유**하므로 `aram`으로 바꾸면 아레나 탭에서 틀린 문구가 된다. 모드 중립 표현인 `handleStartBuild` / `startBuild`("빌드 시작" / "Start Build")로 간다. `emptyHint`도 "드래프트를 완료하면" → "빌드를 완료하면"으로 맞춘다.

## 검증

- `npm run lint`
- `npx tsc --noEmit`
- `git grep -i draft -- src`, `git grep -i android -- src app.json package.json` 이 비어 있을 것
