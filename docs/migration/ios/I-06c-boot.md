---
id: I-06c
title: 부팅 연출·프리웜 연결
wave: W0
status: done
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
- [x] `Boot.start()`: AsyncStorage 이관(I-04c) → 설정 로드 → 프리웜 시작. 이관 결과는 Sentry breadcrumb로 남긴다.
- [x] `AnimatedSplashOverlay`: 600ms 키프레임(§3.1), 끝나면 제거
- [x] `SetupScreen`: 첫 실행만, 진행률, 100%가 되면 450ms 페이드. 플래그 확인 중에는 메인 UI를 아래에 그린다.

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-06c` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 첫 설치: 셋업 진행률 → 100% → 페이드 후 홈
- [ ] 두 번째 실행: 셋업 없이 바로 홈
- [ ] 스플래시 페이드가 RN과 같은 느낌이다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `App/Boot/Boot.swift` 하나에 전부.
  - `Boot.start(settings:)`: `AsyncStorageImport.run()`(I-04c) → 결과를 Sentry breadcrumb(`migration.asyncstorage`, 건너뛴 경우 제외) → `settings.reload()`. 프리웜 플래그 키용 ddragon 버전은 번들 `Data/version.json`만 읽는다(GameDataStore보다 먼저 돈다).
  - `BootOverlay`: 첫 화면에서 `PrewarmService(data:)`(I-05)를 만들고 `.imagePrewarm`으로 시작·포그라운드 보충. 이관이 먼저 돌아 RN 사용자의 프리웜 플래그가 옮겨지므로 업데이트 사용자는 설치 화면을 다시 보지 않는다.
  - `AnimatedSplashOverlay`: `#0E0F12` 판, 600ms. opacity를 Reanimated `Easing.elastic(0.7)` 식 그대로 `TimelineView`로 계산(0–20% 1, 20–70% 1→0), 600ms 뒤 제거. 터치는 막는다(RN 오버레이도 막음).
  - `SetupScreen`: 로고 120, 진행 바 240×6(트랙 raised, 채움 accent + 그림자 radius 5, 폭 애니메이션 없음), 퍼센트 tabular, 안내 caption 바닥 64. `showSetup`이 꺼지면 450ms 페이드(inOut quad).
- 주의점
  - 스플래시 키프레임의 scale(화면높이/90 → 1)은 단색 판이라 보이지 않아 생략했다.
  - RN의 "플래그 확인 중" 상태는 네이티브에선 없다(플래그를 init에서 동기로 읽음). 메인 UI는 항상 아래에 그려진다.
  - `#93`(I-06a, #88 포함) + `#89`(I-05) + `#99`(I-04c) 위에 쌓았다.
- 사용자가 볼 것: 아래 **사용자 확인** 세 항목. 특히 1.6.2 → 네이티브 업데이트 시 설치 화면이 다시 뜨지 않아야 한다(I-42).
