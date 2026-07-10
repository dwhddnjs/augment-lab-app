# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

@AGENTS.md

## 작업별 skill — 시작 전 반드시 읽을 것

- **UI 작업**(컴포넌트·리스트·폼·컨트롤·시트·메뉴·헤더·라우팅) → `.agents/skills/expo-ui/SKILL.md`. 진짜 네이티브가 hero. universal `@expo/ui` 1순위, 안 될 때만 RN으로 내려간다.
- **디자인**(색·타이포·간격/반경·리퀴드글라스·이미지/아이콘) → `.agents/skills/design-system/SKILL.md`. 모든 값은 `src/constants/theme.ts` 토큰만. hex·숫자 리터럴 하드코딩 금지.
- **증강 데이터 변경**(`src/features/augments/data/augments.{ko,en}.json` 수정·추가·삭제) → `.agents/skills/augment-check/SKILL.md`. 변경 때마다 검수 페이지를 재생성하고 함께 커밋.

## 플랜 문서 저장

플랜모드로 작성한 계획 문서는 **매번** `docs/plans/<YYYY-MM-DD>-<주제>.md` 형식으로 저장할 것. 폴더가 없으면 생성.

## i18n / 로케일 원칙

글로벌 서비스이므로 **모든 사용자 노출 텍스트는 로케일 분기**. 하드코딩 금지:

- 파일 상단에 `const t = { ko: {...}, en: {...} }` dictionary 정의 → 컴포넌트 안 `const translate = useTranslation(t)` → `translate('key')`. 키 누락 시 `en` 폴백.
- 데이터(챔피언/아이템/증강 이름)는 `useChampions()` 등 훅이 이미 로케일 분기.
- `useLocale()`(`src/hooks/use-locale.ts`)이 현재 로케일 반환(`'ko' | 'en'`).

## 명령어

```bash
npm install            # 의존성 설치
npm start              # Expo 개발 서버 시작
npm run ios            # iOS 시뮬레이터
npm run lint           # ESLint
```

테스트 러너 미설정.

## 아키텍처

**Expo SDK 56 / React 19 / React Native 0.85** 기반 **iOS 전용** 앱(Android·웹 미지원). 파일 기반 라우팅(Expo Router v56), `experiments.typedRoutes` + `reactCompiler` 활성.

Android 지원 코드는 제거했다. `.android.tsx` 파일이나 `Platform.OS === 'android'` 분기를 새로 만들지 말 것. 남아 있는 플랫폼 폴백(`custom-tabs.tsx`, `glass-button-fallback.tsx`)은 Android가 아니라 **iOS 26 미만** 대응이다.

### 폴더 구조 — 필수 규칙

```
src/
├── app/                        # Expo Router 라우트만 (얇게 — screens에서 import)
├── features/                   # 도메인별 응집 모듈
│   └── <도메인>/
│       ├── screens/            # 라우트가 렌더하는 화면 단위 (*-screen.tsx)
│       ├── components/         # 화면을 구성하는 작은 조각 (카드/타일/슬롯/메뉴)
│       ├── hooks/              # 도메인 훅
│       ├── data/               # *.ko.json / *.en.json
│       └── types.ts
├── components/                 # 도메인 무관 공용 UI (themed/, navigation/, ui/)
├── hooks/                      # 여러 feature 공유 글로벌 훅 (테마/로케일/색상스킴)
├── lib/                        # 외부 클라이언트 + 순수 유틸 (supabase/ddragon/i18n/hangul)
├── constants/theme.ts
└── styles/global.css
```

경계 규칙:
1. `src/app/` — 라우트 파일만. UI는 `features/*/screens`에서 import.
2. `features/<도메인>/` — **screens(화면)와 components(조각)를 분리**. 다른 feature를 import하지 않는다(공유는 `hooks/`·`lib/`로 승격).
3. `src/components/` — 도메인 무관 공용 프리미티브만. feature를 import하지 않는다.
4. `src/hooks/` — 여러 feature 공유 글로벌 훅만.
5. `src/lib/` — 외부 클라이언트 + 순수 유틸(React 훅 아님. `i18n.ts`의 `useTranslation`만 예외).
6. 공용 UI는 2개 이상 feature에서 쓰일 때 `components/ui`로 승격.
7. `src/types/` 폴더 만들지 말 것 — 타입은 사용처(feature)와 동거.

## 경로 별칭 / React Compiler

- `@/`→`src/`, `@/assets/`→`assets/`(`tsconfig.json`)
- React Compiler 자동 실행 — 프로파일링 없이 `useMemo`/`useCallback` 수동 추가 금지. **예외**: `useFocusEffect`(Expo Router)는 `useCallback` 필수.
