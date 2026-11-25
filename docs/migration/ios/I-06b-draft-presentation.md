---
id: I-06b
title: 드래프트 표시·회전·닫기 계약
wave: W0
status: todo
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
- [ ] `AppDelegate`: `supportedInterfaceOrientationsFor` = 현재 잠금 마스크(기본 세로)
- [ ] `OrientationLock`: `setNeedsUpdateOfSupportedInterfaceOrientations` + `requestGeometryUpdate`, `hold(.landscape)` / `release()` + 1.5초 안전 타이머
- [ ] `DraftPresenter`: 챔피언 시트 위에 풀스크린 표시(페이드, 스와이프 닫기 없음), 안쪽 스택으로 칼바람 → 아이템을 쌓는다. SwiftUI만으로 페이드가 안 되면 UIKit 프레젠터(crossDissolve)를 감싸 쓴다.
- [ ] `CloseDraft.openBuild(id)`: 가로 유지 → 시트·드래프트를 한 번에 닫기(전환 없음) + 빌드 상세 push(전환 없음) → 상세가 나타나면 세로 해제
- [ ] `CloseDraft.confirmExit(message)`: 확인창 → 페이드로 닫기 → 세로. 가로 홈이 0.5초 보이는 RN 한계를 전환 코디네이터로 줄여 본다.
- [ ] 빌드 상세에 `saved`로 들어온 뒤에도 스와이프 뒤로가기가 손가락을 따라간다

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-06b` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 진입: 시트에서 바로 가로 드래프트로 바뀌고, 회전하는 빈 화면이 없다
- [ ] 저장(임시 버튼): 세로 빌드 상세로 **한 번만** 돈다. 세로→가로→세로 흔들림이 없다
- [ ] 나가기: 페이드로 닫히고 홈이 세로다. 가로 홈이 보이는 시간을 적는다
- [ ] 홈에서 기기를 가로로 돌려도 홈은 세로로 남는다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
