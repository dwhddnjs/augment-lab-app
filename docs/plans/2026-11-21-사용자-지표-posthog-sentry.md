# 사용자 지표(PostHog) + 크래시 리포트(Sentry) 도입

## Context

다운로드가 늘고 있는데 앱 안에서 무슨 일이 일어나는지 볼 수단이 하나도 없다(분석·크래시 SDK 0개,
`app.json` 개인정보 매니페스트도 "수집 없음"). 알고 싶은 것은 세 가지다.
1. 어느 화면에 오래 머무는가 2. 어디서 이탈하는가(퍼널·경로) 3. 어디서 크래시·에러가 나는가.

→ PostHog(행동 분석 + 세션 리플레이)와 Sentry(크래시·에러)를 넣는다. 키가 아직 없으니
**키가 비어 있으면 두 SDK 모두 꺼진 채로 동작**하게 만들고, 로컬 가짜 서버로 이벤트가 실제로
나가는지까지 시뮬레이터에서 검증한다. 키를 받으면 한 파일에 붙여넣기만 하면 켜진다.

첫 단계로 이 문서를 `docs/plans/2026-11-21-사용자-지표-posthog-sentry.md` 로 저장한다(CLAUDE.md 규칙).

## 조사 결과 — 추천 조합

| 도구 | 하는 일 | 무료 한도 | 판단 |
|---|---|---|---|
| **App Store Connect 분석** | 다운로드·세션·D1/7/14/28 리텐션·크래시율 | 무료, 설치 0 | **지금 바로 볼 것.** 단 데이터 공유에 동의한 사용자만, 화면 단위 없음 |
| **PostHog** ✅ | 화면 이동·퍼널·경로(이탈)·리텐션·**세션 리플레이**·설문·피처플래그 | 이벤트 100만/월, 모바일 리플레이 2,500/월 | **채택.** 한 SDK로 "어디 머물고 어디서 나가는지"+실제 화면 녹화. Expo 공식 가이드 있음 |
| **Sentry** ✅ | 크래시·JS 에러 스택, 직전 행동(브레드크럼), 에러 순간 스크린샷 | 에러 5천/월 | **채택.** 크래시 업계 표준, Expo SDK 56 번들 버전(`~7.11.0`) 있음 |
| Firebase Analytics + Crashlytics | 분석·크래시 | 사실상 무제한 | 리플레이 없음, RN Firebase는 네이티브 설정이 무겁다 |
| Mixpanel | 퍼널·리텐션 강함 | 이벤트 100만/월 | PostHog와 겹침. 리플레이는 있지만 별도 크래시 없음 |
| Amplitude | 엔터프라이즈급 분석 | 이벤트 200만/월(MTU 1만) | 1인 개발엔 과함 |
| Aptabase | 개인정보 친화 단순 카운트 | 이벤트 2만/월 | 퍼널·리플레이 없음, RN SDK 2024년 이후 정체 |
| UXCam·Smartlook | 리플레이·히트맵 전문 | 유료 위주 | 지금 규모엔 비용 대비 과함 |

PostHog에도 에러 트래킹이 있지만 사용자가 Sentry를 원했고 크래시 기호화(심볼리케이션)가 더 성숙하므로
PostHog 에러 수집은 끄고 역할을 나눈다: **PostHog=행동, Sentry=크래시.**

## 구현

### 1. 의존성 (`npx expo install`)
- `posthog-react-native`(4.87.x) `expo-application expo-device expo-localization @posthog/react-native-plugin`(2.13.x)
  (`expo-file-system`은 이미 있음. `@posthog/react-native-plugin` = 세션 리플레이 네이티브 모듈,
  podspec만 있는 autolink 패키지라 config plugin 불필요 — tarball로 확인함)
- `@sentry/react-native` (Expo SDK 56 번들 버전 ~7.11.0)
- **`posthog-react-native/expo` config plugin은 넣지 않는다.** 확인해 보니 PostHog 에러 트래킹용
  (dSYM 업로드 + Xcode 번들 스크립트 수정)인데, Sentry 플러그인도 같은 번들 스크립트를 감싼다 →
  둘이 충돌할 수 있고 우리는 PostHog 에러 트래킹을 안 쓴다.

### 1-1. 확인된 위험: Sentry 토큰 없으면 배포 빌드가 깨진다
`@sentry/react-native@7.11.0/scripts/sentry-xcode.sh` 를 읽어 보니 Release 빌드의 JS 번들 단계에서
소스맵 업로드가 실패하면 `exitCode=1` 로 **빌드 자체를 실패**시킨다(dSYM 업로드는 실패해도 경고만).
사용자가 Sentry 토큰을 EAS에 넣기 전에 배포하면 1.6.x 다음 빌드가 바로 깨진다.
→ `eas.json` 의 `production`·`preview` 프로필 `env` 에 `SENTRY_DISABLE_AUTO_UPLOAD=true`.

**실측 결과(2026-11-21, Release 시뮬레이터 빌드)**
- 설정 없음 → `An organization ID or slug is required` 로 **BUILD FAILED** (위험 재현)
- `SENTRY_ALLOW_FAILURE=true` → BUILD SUCCEEDED 지만 **`main.jsbundle` 이 빠진 앱**이 나온다
  (sentry-cli가 번들링 전에 org 검사로 죽고 0으로 끝남). 그대로 배포하면 실행 즉시 죽는 앱 → 탈락.
- `SENTRY_DISABLE_AUTO_UPLOAD=true` → BUILD SUCCEEDED + `main.jsbundle` 6.8MB 포함 + 정상 부팅 → 채택.

Sentry org/project 슬러그를 `app.json` 에 넣고 `SENTRY_AUTH_TOKEN` 을 EAS에 등록할 때 이 줄을 지운다
(그래야 소스맵이 올라가 크래시 스택이 원본 코드 줄로 보인다).

### 2. 새 파일 `src/lib/analytics.ts` (외부 클라이언트 → lib 규칙)
- 상수 `POSTHOG_KEY = ''`, `POSTHOG_HOST = 'https://us.i.posthog.com'`, `SENTRY_DSN = ''`
  (둘 다 앱에 들어가도 되는 **공개용 값**이라 env 대신 코드 상수 — 로컬·EAS 둘 다 한 곳에서 끝)
- `Sentry.init({ dsn, enabled: !__DEV__ && !!SENTRY_DSN, attachScreenshot: true })`
  — tracing·Sentry 리플레이는 안 켠다(리플레이는 PostHog 담당).
- `posthog = POSTHOG_KEY && !__DEV__ ? new PostHog(KEY, { host, enableSessionReplay: true, sessionReplayConfig: { maskAllTextInputs: false, maskAllImages: false } }) : undefined`
  — 빈 키면 생성자가 throw 하므로 아예 안 만든다. 개발 중 내 사용 기록이 섞이지 않게 `__DEV__` 제외.
  텍스트·이미지 마스킹 모두 끈다 — `maskAllTextInputs` 기본값은 입력칸뿐 아니라 **모든 텍스트**를 가린다(타입 정의 확인). 화면에 개인정보가 없어 가리면 리플레이가 빈 상자뿐이다.
  앱 열림/백그라운드 이벤트(`captureAppLifecycleEvents`)는 기본 켜짐 → 리텐션·세션 길이용.
- `trackScreen(name)`:
  - 직전 화면이 있으면 `posthog.capture('screen_left', { screen, duration_s })` — **화면별 체류 시간**
    (PostHog 모바일엔 체류시간 지표가 없어서 웹의 time-on-page 방식을 그대로 만든다)
  - `posthog.screen(name)` — 퍼널·경로(이탈)용 `$screen`
  - `Sentry.setTag('screen', name)` + `Sentry.addBreadcrumb({ category: 'navigation', message: name })`
    — 크래시가 **어느 화면에서** 났고 직전에 어디를 거쳤는지
- `AppState` 리스너 1개: `background` → 현재 화면 `screen_left` 전송, `active` → 타이머 재시작
  (백그라운드에 있던 시간이 체류시간에 섞이지 않게)

### 3. `src/app/_layout.tsx`
- `useSegments()` 로 화면 이름 = `'/' + segments.join('/')` (라우트 파일 경로 그대로:
  `/(tabs)/(home)`, `/(tabs)/(tierlist)`, `/mode-select`, `/select-champion-modal`, `/aram`, `/aram-items`,
  `/build/[id]` …). `usePathname` 은 그룹 index가 전부 `/` 로 뭉치고 `/build/abc123` 처럼 id가 섞여서 안 씀.
- `useEffect(() => trackScreen(screen), [screen])`
- `export default Sentry.wrap(RootLayout)` (터치 브레드크럼 + 렌더 에러 경계)

### 4. 새 파일 `metro.config.js`
`getSentryExpoConfig(__dirname)` — 소스맵 디버그 ID 주입(없으면 크래시 스택이 난독화된 줄 번호로 나옴).

### 5. `eas.json` — 1-1의 `SENTRY_DISABLE_AUTO_UPLOAD=true` (production·preview env)

### 6. `app.json`
- plugins에 `"@sentry/react-native/expo"` (org/project는 사용자가 슬러그를 주면 채움. 그 전엔 env
  `SENTRY_ORG`/`SENTRY_PROJECT` 폴백)
- `ios.privacyManifests.NSPrivacyCollectedDataTypes`: ProductInteraction(Analytics),
  CrashData·PerformanceData·OtherDiagnosticData(AppFunctionality) — 모두 Linked false, Tracking false.
  `NSPrivacyTracking: false` 유지(광고·타 앱 추적 없음 → ATT 팝업 불필요).

참고 위험: PostHog iOS SDK는 2026-12-02부터 새 버전을 CocoaPods에 안 올린다(SPM 전용). 지금 설치하는 버전은
영향 없고, 나중에 PostHog를 올릴 때 Expo의 SPM 지원 여부를 봐야 한다 — 보고서에 한 줄로 남긴다.

건너뛴 것: 사용자 식별(identify), 커스텀 비즈니스 이벤트, 수집 끄기 토글, 성능 트레이싱 — 화면 이벤트만으로
핵심 퍼널(홈→모드선택→챔피언선택→증강→아이템→빌드상세)이 그려지므로 데이터 보고 필요해지면 추가.

## 검증 (사용자가 명시적으로 테스트·보고를 요청 → 이번엔 시뮬레이터 검증 수행)

1. `npx tsc --noEmit`, `npm run lint`
2. 스크래치패드에 가짜 수집 서버(Python, gzip 해제·요청 경로/본문 로그) 실행.
   PostHog `/batch/`·`/flags/`(리플레이 켜진 설정 응답)·`/s/`, Sentry `/api/<id>/envelope/` 수신.
3. **임시** 편집(검증 후 원복): 키를 가짜 값, host·DSN을 `http://localhost:<port>` 로(Release의 ATS가
   localhost http를 막으면 gitignore된 `ios/` Info.plist에만 임시 예외 — 커밋 대상 아님), 시작 시
   `Sentry.captureException(new Error('smoke: handled'))` + 몇 초 뒤 잡히지 않은 throw.
4. prebuild → pod install → **Release** 시뮬레이터 빌드(`__DEV__=false` 실경로 + EAS와 같은 Sentry 업로드
   빌드 단계를 함께 검증). 세 가지를 실측:
   (a) 토큰·env 없이 → 빌드 실패하는지(위험 재현)
   (b) `SENTRY_ALLOW_FAILURE=true` → 빌드 성공 + `.app` 안에 `main.jsbundle` 존재 + 앱 부팅
   (c) (b)가 안 되면 `SENTRY_DISABLE_AUTO_UPLOAD=true` 로 같은 확인 → 이긴 쪽을 `eas.json` 에 넣는다.
   사용자가 시뮬레이터를 쓰는 중이면 별도 기기로(`orca emulator attach --device <UDID>`, 내 헬퍼 PID만 정리).
5. `orca emulator` 로 홈 → 티어리스트 → 마이페이지 → + → 모드 선택 → 챔피언 선택 → 드래프트까지 이동,
   백그라운드 전환 후 복귀. 서버 로그에서 확인:
   `$screen` 이름 순서, `screen_left.duration_s` 가 실제 머문 시간과 맞는지, Application Opened/Backgrounded,
   리플레이 스냅샷 수신 여부, Sentry 에러 2건(handled + 크래시 후 재실행 시 전송)·`screen` 태그·브레드크럼.
6. 키를 빈 값으로 되돌린 상태로도 앱이 정상 부팅하는지(SDK off 경로) 확인.
7. 임시 편집 원복 → `git diff` 로 남은 게 의도한 변경뿐인지 확인.
8. `docs/verification/2026-11-21-posthog-sentry.md` 작성 + README 표에 한 줄. 스크린샷 커밋 안 함.
   커밋은 요청이 없으므로 하지 않는다.

## 최종 보고에 담을 "사용자가 할 일" (쉽게, 단계별)

0. 지금 바로: App Store Connect → 앱 → 분석에서 다운로드·리텐션·크래시 확인(코드 무관)
1. PostHog 가입(US 리전) → Project API key(`phc_…`) 복사, Session replay "Record user sessions" ON
2. Sentry 가입 → React Native 프로젝트 생성 → DSN 복사, org/project 슬러그 확인
3. Sentry Organization Auth Token 발급 → expo.dev 프로젝트 Environment variables에
   `SENTRY_AUTH_TOKEN`(Sensitive, production) 등록 (CLI 명령도 함께)
4. 키·DSN·슬러그를 나에게 전달(토큰은 비밀이라 전달 X) → 내가 채우고 커밋
5. App Store Connect 앱 개인정보(App Privacy) 라벨 수정 — 항목·체크값 그대로 안내
6. 개인정보 처리방침에 PostHog·Sentry 수집 내용 추가(문안 초안 제공)
7. 네이티브 모듈 추가라 **다음 스토어 버전부터** 수집 시작 → EAS 빌드·제출
8. 배포 후 보는 법: 화면별 체류(Trends `screen_left` 평균 duration_s by screen), 이탈 퍼널(Funnels
   `$screen` 단계), 경로(Paths), 리텐션, 리플레이, Sentry Issues — 화면 이름 ↔ 실제 화면 매핑 표 포함
