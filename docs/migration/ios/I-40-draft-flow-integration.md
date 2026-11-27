---
id: I-40
title: 드래프트 흐름 통합
wave: W3
status: todo
depends: I-23, I-25b, I-28, I-29d
owns: (직렬 — 이 작업 중에는 다른 iOS 작업을 돌리지 않는다)
spec: app-shell.md §3
rn: docs/verification/2026-11-21-드래프트-회전-전환.md
---

# I-40 드래프트 흐름 통합

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
진입·쌓기·저장·나가기 전체 흐름을 실제 화면으로 맞춘다. RN 검증 문서의 표를 그대로 다시 채운다.

## 체크리스트
- [x] RN 검증 문서의 경로 표 10개를 네이티브로 재현할 수 있게 정리(사용자 측정용)
- [ ] 사용자가 찾은 흔들림·빈 화면을 고친다(App/Draft 중심)
- [ ] RN에만 있던 우회(홈 스택 재생성 등)가 필요 없는지 결론을 기록

## 완료 기준
- [ ] 체크리스트 전부 완료, 사용자 확인 결과 기록
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] RN 검증 문서의 10개 경로를 전부 통과한다
- [ ] 가로 홈 노출 시간이 RN(0.5초)보다 같거나 짧다


## 측정표 (사용자 측정용 — RN 검증 문서 2026-11-21의 10개 경로를 네이티브로)

**준비**
- 모든 열린 PR이 dev에 머지된 빌드(또는 c1의 `trial/integration`)를 쓴다. 드래프트 흐름은 I-06b·I-23·I-25b·I-28·I-29d가 다 있어야 끝까지 돈다.
- **Release로 잰다.** Debug는 도구 창이 회전을 좌우해 가짜 증상이 난다(RN 때 겪음): `xcodebuild -project native/ios/AugmentLab.xcodeproj -scheme AugmentLab -configuration Release -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath .build/ios-release build` (analytics는 잠깐 끈다 — 실제 지표 오염 방지).
- 빈 화면 길이 = `simctl io recordVideo` 프레임 밝기(회전 구간의 모습은 믿지 말고 밝기·타이밍만). 실제 모습 = `simctl io screenshot` 연속(장당 ≈0.5초).
- 빈 화면 색으로 원인을 가른다: `#0E0F12` = 앱 surface.base, `#1C1C1E` = iOS 기본(앱 뷰가 아직 안 붙음).
- 회전 횟수는 "세로→가로→세로 흔들림"이 있는지로 센다. 영상으로 애매하면 `OrientationLock.release`·`DraftHostingController.viewDidDisappear`에 임시 `NSLog("[ORI] …")` → `xcrun simctl spawn <UDID> log show --last 2m --predicate 'eventMessage CONTAINS "[ORI]"'`.

| # | 경로 | RN 결과(기준) | 네이티브 통과 기준 | 볼 곳(코드) | 결과 |
|---|---|---|---|---|---|
| 1 | 홈 K/DA 타일 → 챔피언 시트 → 시작 | 시트에서 바로 가로 드래프트. 회전 빈 화면 없음 | 빈 프레임 0, 회전 1회 | `DraftPresenter.present`(fullScreen + crossDissolve, `OrientationLock.set(.landscape)`) | |
| 2 | 칼바람 4+1 라운드 → 아이템 선택 | 고른 카드만 남은 채 아이템 화면이 페이드로 덮음. 카드 재회전 없음 | 같음 + 회전 0회(쌓기) | `DraftPresenter.pushItems`(같은 컨트롤러 안 ZStack 페이드 0.3) | |
| 3 | 아이템 → 저장 | 곧바로 세로 빌드 상세. 가로 멈춤 없음 | 빈 프레임 0, 흔들림 없음(회전 1회) | `CloseDraft.openBuild` | |
| 4 | 아이템 → 나가기 / 칼바람 → 종료 | 페이드로 닫히며 가로 홈이 0.5초 보인 뒤 세로 | 빈 화면 0, **가로 홈 ≤ 0.5초**(목표: 0 — 닫기 전에 세로 마스크로 바꿔 둠) | `CloseDraft.confirmExit` | |
| 5 | 탭바 + → 커스텀 → 시트 → 시작 | 시트 → 빈 화면 ≈0.25초 → 커스텀 | ≤ 0.25초, 세로 배치·설정 서랍이 비치지 않음 | `CustomScreen` 가로 준비 가드(상한 0.5초) | |
| 6 | 커스텀 → 증강 1개 담고 저장 | 세로 빌드 상세, 최근 빌드 맨 앞 | 같음 | `CustomContent.save` → `openBuild` | |
| 7 | 빌드 상세 → 스와이프 뒤로 | 손가락을 따라감. 홈 큰 제목 정상 | 같음 | 저장 때 `disablesAnimations`로 쌓은 push가 이후 뒤로가기에 남지 않는지 | |
| 8 | 홈에서 기기를 가로로 | 홈은 세로로 남음 | 같음 | `AppDelegate` 마스크 = `OrientationLock.mask`(.portrait) | |
| 9 | 기기를 가로로 둔 채 칼바람 → 저장 → 빌드 상세 → 뒤로 | 아이템(가로) → 빌드 상세(세로) 한 번만 돈다. 뒤로 가도 홈 세로 | 같음 | `OrientationLock.hold`(1.5초 상한) → `release` | |
| 10 | 칼바람 픽 현황 서랍 | 정상 | 열기·닫기·스와이프(등장 연출 뒤) 정상 | `SideDrawer`(I-27) | |

**측정 전에 의심해 둘 곳(코드를 읽고 짚은 것 — 확인 전엔 고치지 않는다)**
- #3·#6: `openBuild`는 시트가 낀 묶음을 `dismiss(animated: false)`로 닫는다. RN에선 이 컷 닫기가 "진행 중인 push"가 없으면 #1C1C1E 빈 화면 ≈0.25초를 냈다. 네이티브 push는 `disablesAnimations` 트랜잭션이라 "진행 중인 전환"으로 잡히지 않을 수 있다 → 빈 프레임을 꼭 잰다.
- #3·#9: 세로 해제는 드래프트 `viewDidDisappear` 때다(RN은 빌드 상세 push 끝). push가 그보다 늦게 끝나면 RN과 같은 세로→가로→세로가 날 수 있다 → 부하를 줘서(빌드 상세가 무거울 때) 몇 번 반복한다.
- #4: 목표는 RN보다 짧게. 마스크를 먼저 세로로 바꿔 두지만, 닫힘 전환이 회전을 같이 받아 주는지는 실측해야 안다.

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
