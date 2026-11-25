---
id: I-06c
title: 부팅 연출·프리웜 연결
wave: W0
status: todo
depends: I-06a, I-05, I-04c
owns: native/ios/AugmentLab/App/Boot/
spec: app-shell.md §5·§6, design-system.md §2.11·§3.1·§3.2
rn: src/components/navigation/{animated-splash-overlay,setup-screen}.tsx, src/hooks/use-image-prewarm.ts
---

# I-06c 부팅 연출·프리웜 연결

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
부팅 순서와 첫 화면 연출을 RN과 같게 한다.

## 체크리스트
- [ ] `Boot.start()`: AsyncStorage 이관(I-04c) → 설정 로드 → 프리웜 시작. 이관 결과는 Sentry breadcrumb로 남긴다.
- [ ] `AnimatedSplashOverlay`: 600ms 키프레임(§3.1), 끝나면 제거
- [ ] `SetupScreen`: 첫 실행만, 진행률, 100%가 되면 450ms 페이드. 플래그 확인 중에는 메인 UI를 아래에 그린다.

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-06c` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 첫 설치: 셋업 진행률 → 100% → 페이드 후 홈
- [ ] 두 번째 실행: 셋업 없이 바로 홈
- [ ] 스플래시 페이드가 RN과 같은 느낌이다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
