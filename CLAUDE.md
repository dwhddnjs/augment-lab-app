# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

@AGENTS.md

## 네이티브 마이그레이션 진행 중 (iOS SwiftUI → Android Compose)

- `native/` 작업이거나 사용자가 작업 ID(`I-xx`·`A-xx`)를 말하면, **먼저 `docs/migration/README.md`의 "세션 규칙"만 읽고** 지정된 작업 파일(`docs/migration/ios|android/<ID>-*.md`)로 시작한다.
- 진행 상황 확인: `bash docs/migration/status.sh`. 작업마다 브랜치 `native/<ID>`와 워크트리 `.claude/worktrees/<ID>`를 따로 쓰고, 수정은 작업 파일의 `owns` 경로 안에서만 한다.
- 5시간 한도 95% 경고(`.claude/hooks/usage-guard.sh`)를 받으면 새 단계를 시작하지 않는다. 진행 기록 → 커밋 → push 후 멈춘다.
- 아래 RN 규칙(`src/`)은 R-01(RN 제거)까지 그대로 유효하다.

## 작업별 skill — 시작 전 반드시 읽을 것

- **UI 작업**(컴포넌트·리스트·폼·컨트롤·시트·메뉴·헤더·라우팅) → `.agents/skills/expo-ui/SKILL.md`. 진짜 네이티브가 hero. universal `@expo/ui` 1순위, 안 될 때만 RN으로 내려간다.
- **디자인**(색·타이포·간격/반경·리퀴드글라스·이미지/아이콘) → `.agents/skills/design-system/SKILL.md`. 모든 값은 `src/constants/theme.ts` 토큰만. hex·숫자 리터럴 하드코딩 금지.
- **데이터 변경**(`src/features/augments/data/`·`src/features/items/data/` 의 JSON 수정·추가·삭제) → `.agents/skills/augment-check/SKILL.md`. 변경 때마다 검수 페이지(`docs/index.html`)를 재생성하고 함께 커밋.

## 플랜 문서 저장

플랜모드로 작성한 계획 문서는 **매번** `docs/plans/<YYYY-MM-DD>-<주제>.md` 형식으로 저장할 것. 폴더가 없으면 생성.

## 검증 기록

런타임 동작이 바뀌는 변경(화면·라우팅·플랫폼 분기·네이티브 모듈)은 iOS 시뮬레이터에서 직접 굴려 확인하고, 결과를 `docs/verification/<YYYY-MM-DD>-<주제>.md`에 남길 것. 절차·규칙은 `.agents/skills/verify/SKILL.md`와 `docs/verification/README.md` 참고(`/verify` 로도 실행). 타입체크·lint 통과는 검증이 아니다 — 앱을 띄워 관찰한 것만 기록한다. 스크린샷은 커밋하지 않는다(글로 적고, 보여줄 땐 Artifact).

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

테스트 러너 미설정(RN).

네이티브 iOS(`native/ios`, SwiftUI — R-01 이후 이쪽만 남는다):

```bash
make -C native/ios build   # 시뮬레이터용 빌드(derivedData = 저장소 루트 .build/ios)
make -C native/ios test    # AugmentCore 단위 테스트(swift test, Swift Testing)
make -C native/ios clean   # 빌드 캐시 삭제(워크트리마다 5~7GB)
npm run data:refresh       # 패치 데이터 갱신 — RN·네이티브 공용 JSON(src/**/data)을 고친다
```

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
├── lib/                        # 외부 클라이언트 + 순수 유틸 (ddragon/i18n/hangul/orientation)
├── constants/theme.ts
└── styles/global.css
```

feature 는 두 종류다 — 이 구분이 아래 경계 규칙의 전제다:
- **데이터 도메인**(`augments`·`champions`·`headliners`·`items`): 로케일별 JSON + 조회 훅 + 타입. 누구나 읽는다.
- **화면 도메인**(`aram`·`custom`·`builds`·`tierlist`·`mypage`): 실제 화면. 데이터 도메인을 읽어 쓴다.

경계 규칙:
1. `src/app/` — 라우트 파일만. UI는 `features/*/screens`에서 import.
2. `features/<도메인>/` — **screens(화면)와 components(조각)를 분리**. 화면 도메인이 데이터 도메인을 import 하는 건 정상이다(그게 데이터 도메인의 용도). 금지되는 건 **화면 도메인끼리의 참조** — 공유가 필요하면 `components/ui`·`hooks/`·`lib/`로 승격한다.
3. `src/components/` — 두 개 이상 feature가 쓰는 공용 UI. 데이터 도메인의 **타입**은 import 해도 된다(`RarityCardFrame`이 `Augment`를 그린다). 화면 도메인은 import 하지 않는다.
4. `src/hooks/` — 여러 feature 공유 글로벌 훅만.
5. `src/lib/` — 외부 클라이언트 + 순수 유틸(React 훅 아님. `i18n.ts`의 `useTranslation`만 예외).
6. 공용 UI는 2개 이상 feature에서 쓰일 때 `components/ui`로 승격 — 단 그 UI가 특정 도메인 데이터에 매여 있으면(`ItemFilterBar`가 `FILTERS`를, `ItemStatPanel`이 `ItemStats`를 안다) 원래 feature에 두고 가져다 쓴다.
7. `src/types/` 폴더 만들지 말 것 — 타입은 사용처(feature)와 동거.

## 경로 별칭 / React Compiler

- `@/`→`src/`, `@/assets/`→`assets/`(`tsconfig.json`)
- React Compiler 자동 실행 — 프로파일링 없이 `useMemo`/`useCallback` 수동 추가 금지. **예외**: `useFocusEffect`(Expo Router)는 `useCallback` 필수.

## 네이티브 iOS 아키텍처 (`native/ios`)

```
native/ios/
├── AugmentCore/      # Swift 패키지 — UI 없는 순수 로직(데이터 모델·칼바람/커스텀 규칙·저장소·백업·이관). 테스트는 Tests/
├── AugmentLab/       # 앱 타깃(SwiftUI)
│   ├── App/          # 셸(탭·라우터)·부팅·드래프트 표시
│   ├── Features/     # 화면 단위 (RN features/<화면 도메인>/screens 대응)
│   ├── UI/           # 두 개 이상 화면이 쓰는 공용 UI (RN components/ 대응)
│   ├── Design/       # 토큰(Palette·Spacing·Radius 등) — RN theme.ts 대응. 숫자·색 리터럴 대신 이것만 쓴다
│   ├── Infra/        # 이미지 로딩·분석·설정 저장 연결
│   ├── Resources/    # 폰트·InfoPlist 번역
│   └── Assets.xcassets # 앱에 넣는 이미지(증강 로컬 아이콘 augments-*, 헤드라이너 등)
├── Scripts/          # 빌드 단계 스크립트(copy-data.sh 등)
└── Config/           # Info.plist
```

- **데이터는 RN과 공용이다.** 앱은 `src/features/*/data/*.json`·`src/lib/version.json`을 복사해 번들 `Data/`에 넣는다(빌드 단계 "Copy Data JSON" → `Scripts/copy-data.sh`). 목록은 `Scripts/data-files.xcfilelist`, 결과는 `data-outputs.xcfilelist` — JSON 파일을 새로 만들면 둘 다 고친다. 입력 목록에 있으니 JSON만 바뀌어도 다음 빌드에 다시 복사된다.
- 번역은 파일 상단 `L10n(ko:en:)` → `L.t(settings.locale)("키")`. 키 누락 시 en 폴백(위 i18n 원칙과 같다).
- 경계 규칙은 RN과 같다: 화면(`Features/`)끼리 참조 금지, 공유는 `UI/`·`AugmentCore`로 올린다. 앱은 모듈이 하나라 `private` 타입도 같은 이름의 `internal` 타입과 부딪힌다 — 새 internal 타입 이름엔 기능 접두어를 붙인다.
- 새 의존성(SPM 패키지)을 함부로 추가하지 않는다.
