---
id: I-06b
title: 드래프트 표시·회전·닫기 계약
wave: W0
status: done
depends: I-06a
owns: native/ios/AugmentLab/App/Draft/
spec: app-shell.md §3
rn: src/hooks/use-close-draft.ts, src/lib/orientation.ts, src/app/_layout.tsx, docs/verification/2026-11-21-드래프트-회전-전환.md
---

# I-06b 드래프트 표시·회전·닫기 계약

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
RN에서 가장 오래 고생한 회전·전환을 네이티브 방식으로 다시 짠다. 목표는 "회전은 진행 중인 전환이 없을 때 한 번만"이다.

## 체크리스트
- [x] `AppDelegate`: `supportedInterfaceOrientationsFor` = 현재 잠금 마스크(기본 세로)
- [x] `OrientationLock`: `setNeedsUpdateOfSupportedInterfaceOrientations` + `requestGeometryUpdate`, `hold(.landscape)` / `release()` + 1.5초 안전 타이머
- [x] `DraftPresenter`: 챔피언 시트 위에 풀스크린 표시(페이드, 스와이프 닫기 없음), 안쪽 스택으로 칼바람 → 아이템을 쌓는다. SwiftUI만으로 페이드가 안 되면 UIKit 프레젠터(crossDissolve)를 감싸 쓴다.
- [x] `CloseDraft.openBuild(id)`: 가로 유지 → 시트·드래프트를 한 번에 닫기(전환 없음) + 빌드 상세 push(전환 없음) → 상세가 나타나면 세로 해제
- [x] `CloseDraft.confirmExit(message)`: 확인창 → 페이드로 닫기 → 세로. 가로 홈이 0.5초 보이는 RN 한계를 전환 코디네이터로 줄여 본다.
- [x] 빌드 상세에 `saved`로 들어온 뒤에도 스와이프 뒤로가기가 손가락을 따라간다

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-06b` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 진입: 시트에서 바로 가로 드래프트로 바뀌고, 회전하는 빈 화면이 없다
- [ ] 저장(임시 버튼): 세로 빌드 상세로 **한 번만** 돈다. 세로→가로→세로 흔들림이 없다
- [ ] 나가기: 페이드로 닫히고 홈이 세로다. 가로 홈이 보이는 시간을 적는다
- [ ] 홈에서 기기를 가로로 돌려도 홈은 세로로 남는다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- **I-00 `native/ios/Makefile`**: 워크트리마다 `.build/ios`(SPM checkout + derivedData, 약 4.7GB)가 새로 생긴다. 4세션 병렬 작업 중 디스크가 가득 차(ENOSPC) 모든 세션이 멈췄다.
  - 제안: `-clonedSourcePackagesDirPath`를 메인 저장소의 공용 경로(예: `$(git rev-parse --git-common-dir)/../.build/spm`)로 둔다.
  - 당장은 우회하고 있다: `make build DERIVED=<이미 빌드한 워크트리>/.build/ios`로 세션마다 캐시 하나만 쓴다.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 드래프트 표시·회전·닫기 완료 (세션 5d)
**한 일** (`App/Draft/` 4개, `make -C native/ios build` 통과·경고 0)
- `OrientationLock`
  - `mask`(기본 세로)
  - `set(_:)`: 마스크만 바꾼다. 다음 전환이 그 값으로 회전한다.
  - `hold()`: 1.5초 안전 타이머
  - `release()`: 세로 + `setNeedsUpdateOfSupportedInterfaceOrientations` + `requestGeometryUpdate`
- `AppDelegate`: `supportedInterfaceOrientationsFor` = `OrientationLock.mask`
- `DraftPresenter`
  - 맨 위 컨트롤러(챔피언 시트) 위에 UIKit `fullScreen` + `crossDissolve`로 띄운다. 띄우기 직전에 마스크를 가로로 바꾸고, 컨트롤러는 가로만 지원한다 → 회전이 띄우는 전환과 한 동작이다.
  - 칼바람 → 아이템은 같은 컨트롤러 안 ZStack에서 0.3초 페이드로 쌓는다. 아래 화면은 살아 있고, 모달을 갈아 끼우지 않으니 회전도 없다.
  - ✓ 연타 가드: 이미 떠 있으면 `start`를 무시한다.
  - 딥링크로 아이템만 들어오면 아이템만 띄운다.
  - `close(animated:)`: 창 루트에서 dismiss해 시트·드래프트를 한 묶음으로 닫는다. SwiftUI의 `router.sheet`는 닫힘이 끝난 뒤 전환 없이 nil로 맞춘다.
  - 컨트롤러가 사라지면(`viewDidDisappear`) 상태를 비우고 `OrientationLock.release()`
- `CloseDraft`
  - `openBuild`: `hold` → 전환 없이 닫기 + 빌드 상세(`saved`) 전환 없이 push → 드래프트가 사라지면 `release` → 한 번만 돈다.
  - `confirmExit`: UIAlertController(취소 = cancel, 확인 = destructive) → 확인이면 마스크를 세로로 바꾸고 페이드로 닫는다.

**RN과 다른 점 / 개선 시도**
- 나가기: RN은 닫힘이 끝난 뒤 돌아서 가로 홈이 0.5초 보였다. 닫기 **전에** 세로 마스크로 바꿔 회전이 닫는 전환과 함께 일어나게 했다. 실제로 줄었는지는 사용자 확인 3번에 시간을 적는다. 결과는 I-40에 기록할 것.
- RN `close=cut|fade` 시트 파라미터는 필요 없다. 닫을 때 `animated`로 바로 정한다.

**주의점**
- **브랜치**: `native/I-06a`(#93) 위에 쌓았다. 머지 순서: #88 → #93 → 이 PR. `status.sh diff I-06b`는 지금 I-04a·I-06a 파일까지 잡는다. I-06a 대비로는 `App/Draft/` 4개와 이 파일뿐이다.
- 시트를 UIKit이 먼저 닫고 SwiftUI 상태는 나중에 맞춘다. 반대로 하면 SwiftUI가 진행 중인 페이드 닫힘에 dismiss를 다시 건다.
- 위에 확인창 말고 다른 풀스크린을 띄우면 `viewDidDisappear` = 닫힘이라는 가정이 깨진다.
- 시트를 전환 없이 닫을 때 RN에서 0.25초 빈 화면이 있었다(pageSheet). 네이티브에서도 재현되는지 사용자 확인 2번에서 본다.

**사용자가 볼 것**: 위 **사용자 확인** 4줄. 스텁 경로: `+` → 칼바람 → 챔피언 시트 "시작(Ahri)" → 칼바람 스텁 → "아이템으로" / "저장(가짜 id)" / "나가기".
