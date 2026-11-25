---
id: I-07
title: 분석·크래시
wave: W0
status: done
depends: I-00
owns: native/ios/AugmentLab/Infra/Analytics/
spec: app-shell.md §7
rn: src/lib/analytics.ts, src/app/_layout.tsx
---

# I-07 분석·크래시

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
PostHog·Sentry를 RN과 같은 설정·같은 화면 이름으로 연결한다.

## 체크리스트
- [x] PostHog: key·host, DEBUG에서 끔, 세션 리플레이(마스킹 끔), 생명주기 자동 수집
- [x] Sentry: dsn, DEBUG에서 끔, 스크린샷 첨부
- [x] `Analytics.trackScreen(_ name: String)`: `$screen` + Sentry 태그·breadcrumb + 이전 화면 `screen_left {screen, duration_s}`
- [x] `Analytics.appDidEnterBackground()` / `appDidBecomeActive()`: 백그라운드 시간 제외, active에서 타이머 재시작

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-07` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] (선택) Release 빌드 실행 후 PostHog에 `$screen`이 RN과 같은 이름으로 찍힌다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-07 완료
- **한 일**: `Infra/Analytics/Analytics.swift` 하나. `@MainActor enum Analytics` — `start()`·`trackScreen(_:)`·`appDidEnterBackground()`·`appDidBecomeActive()`.
  - PostHog 4.0.11: 세션 리플레이 켬(텍스트 입력·이미지 마스킹 끔), 생명주기 수집은 기본값(켬), 에러 수집은 기본값(끔).
  - **`captureScreenViews = false`**: 자동 화면 수집이 `UIHostingController` 같은 이름을 보내서 RN 화면 이름과 섞인다. 화면 이름은 `trackScreen`으로만 보낸다.
  - Sentry 9.35: dsn, `attachScreenshot`. 화면마다 태그 `screen`과 breadcrumb `navigation`.
  - `screen_left {screen, duration_s}`: 화면이 바뀔 때·백그라운드로 갈 때. `duration_s`는 초 반올림. active가 되면 타이머 재시작.
  - DEBUG(`SWIFT_ACTIVE_COMPILATION_CONDITIONS`)에선 SDK를 만들지 않고 모든 함수가 아무것도 안 한다.
- **확인**: `make build`·`make test` 통과. Release 경로도 런타임 `guard`라 Debug 빌드에서 같이 타입 검사된다.
- **주의점**: `native/I-00`(PR #76, 미머지) 위에서 갈라졌다. I-00 대비 변경은 owns 안 파일 1개. `status.sh diff`는 I-00 머지 후 깨끗해진다.
- **다음 작업이 알아야 할 것 (I-06a)**
  - 앱 `init`에서 `Analytics.start()`.
  - `scenePhase`가 `.background`면 `Analytics.appDidEnterBackground()`, `.active`면 `appDidBecomeActive()`.
  - 화면이 바뀔 때 `Analytics.trackScreen("<RN 라우트 문자열>")` — 목록은 app-shell §7.
- **사용자가 볼 것**: DEBUG에선 꺼져 있어 시뮬레이터로는 볼 게 없다. Release(TestFlight)에서 PostHog `$screen`·`screen_left`와 Sentry 태그가 RN 때와 같은 이름으로 들어오는지 확인한다.

