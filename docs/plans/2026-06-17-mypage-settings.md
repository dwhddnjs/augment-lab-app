# 마이페이지 UI · 기능 구현 플랜

## Context

마이페이지 탭(`src/app/(tabs)/(mypage)/index.tsx`)은 현재 "준비 중" 플레이스홀더만 있는 빈 화면이다. 이를 실제 설정/요약 화면으로 채운다.

핵심 요구는 **테마(다크/라이트) 수동 전환**이다. 현재 앱은 `useColorScheme()`(시스템 설정)만 따르고, 사용자가 직접 고를 수 없으며 선택을 저장할 인프라도 없다. 같은 맥락에서 로케일(ko/en)도 메모리 전역변수만 있고 영속화/변경 UI가 없다.

테마 하나만 있으면 화면이 빈약하므로, 사용자 확정에 따라 **언어 설정 + 내 빌드 요약 + 앱 정보**를 함께 넣어 완성도 있는 마이페이지를 구성한다. 기존 디자인 토큰·컴포넌트·i18n 패턴을 그대로 재사용해 통일성을 지킨다.

### 사용자 확정 사항
- 테마: **시스템 / 라이트 / 다크 3단** (시스템이 기본, 선택 시 강제 고정)
- 추가 기능: **언어 설정, 내 빌드 요약, 앱 정보 모두 포함**

---

## 설계

### 1. 테마 선호도 상태 (영속화 + 전역)

전역 상태 라이브러리가 없으므로 **기존 `use-locale.ts`의 모듈 전역변수 + listener 패턴**을 그대로 따른다(통일성).

**신규 `src/hooks/use-theme-preference.ts`**
- 값: `ThemePreference = 'system' | 'light' | 'dark'`
- 모듈 전역변수 `_pref` + `listeners` Set 로 전역 구독
- AsyncStorage 키 `theme:v1`로 읽기/쓰기 (`src/lib/build-storage.ts`의 try/catch 폴백 패턴 참고)
- 앱 시작 시 1회 로드하는 `loadThemePreference()` export — 루트에서 호출
- API: `useThemePreference()` → `{ preference, setPreference }`, `getThemePreference()`

**`src/hooks/use-theme.ts` 수정**
- preference 반영해 mode 결정: `preference === 'system' ? resolvedSystem : preference`
- 모든 `ThemedView`/`ThemedText`/`useTheme()` 소비처가 자동으로 따라온다.

**`src/app/_layout.tsx` 수정**
- nav 테마(`darkNavTheme`/`lightNavTheme`)를 동일 규칙으로 선택. 부팅 시 `loadThemePreference()`로 복원.

### 2. 로케일 영속화 (언어 설정 동반)

**`src/hooks/use-locale.ts` 수정**
- `setLocale`에서 AsyncStorage 키 `locale:v1` 저장 추가, `loadLocale()` export, 루트에서 1회 호출.

### 3. 마이페이지 화면 (features 신설)

**`src/features/mypage/components/mypage-screen.tsx`** — 설정 리스트 화면.
1. **외관** — 시스템 / 라이트 / 다크 3단
2. **언어 / Language** — 한국어 / English 2단
3. **내 빌드** — 저장 빌드 개수 + 탭 시 목록 이동
4. **정보** — 버전, GitHub, 라이선스/피드백 링크

컴포넌트는 `@expo/ui` 1순위 시도(`expo:expo-ui` 스킬 + v56 문서 확인), 불가 시 RN 폴백(ThemedView/Pressable + 토큰). i18n은 `const t = {ko,en}` + `useTranslation`.

**내 빌드 목록**: `(mypage)`에 `builds.tsx` 라우트 추가, 기존 `BuildListScreen` 재사용. 개수는 `listBuilds()`.

---

## 변경/신규 파일 요약

| 종류 | 경로 |
|---|---|
| 신규 | `src/hooks/use-theme-preference.ts` |
| 수정 | `src/hooks/use-theme.ts` |
| 수정 | `src/hooks/use-locale.ts` |
| 수정 | `src/app/_layout.tsx` |
| 신규 | `src/features/mypage/components/mypage-screen.tsx` |
| 수정 | `src/app/(tabs)/(mypage)/index.tsx` |
| 수정 | `src/app/(tabs)/(mypage)/_layout.tsx` |
| 신규 | `src/app/(tabs)/(mypage)/builds.tsx` |

기존 재사용: `BuildListScreen`, `listBuilds()`, `external-link.tsx`, `useTranslation`/`useLocale`, 테마 토큰, `ThemedText/ThemedView`, `SymbolView`.

---

## 검증

1. `npm run lint` 통과.
2. `npm run ios`: 외관 라이트/다크/시스템 전환·재시작 영속화·언어 전환·내 빌드 개수/이동·정보 링크 확인.
3. 다크/라이트 양쪽 통일감 육안 확인.
