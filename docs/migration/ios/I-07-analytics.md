---
id: I-07
title: 분석·크래시
wave: W0
status: todo
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
- [ ] PostHog: key·host, DEBUG에서 끔, 세션 리플레이(마스킹 끔), 생명주기 자동 수집
- [ ] Sentry: dsn, DEBUG에서 끔, 스크린샷 첨부
- [ ] `Analytics.trackScreen(_ name: String)`: `$screen` + Sentry 태그·breadcrumb + 이전 화면 `screen_left {screen, duration_s}`
- [ ] `Analytics.appDidEnterBackground()` / `appDidBecomeActive()`: 백그라운드 시간 제외, active에서 타이머 재시작

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-07` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] (선택) Release 빌드 실행 후 PostHog에 `$screen`이 RN과 같은 이름으로 찍힌다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
