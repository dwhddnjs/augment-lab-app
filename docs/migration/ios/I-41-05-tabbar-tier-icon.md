---
id: I-41-05
title: 탭바 티어리스트 아이콘
wave: W3
status: done
depends: I-41
owns: native/ios/AugmentLab/App/Shell/
spec: app-shell.md §4
rn: src/components/navigation/custom-tabs.tsx
---

# I-41-05 탭바 티어리스트 아이콘

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
티어리스트 탭 아이콘이 RN은 외곽선 막대(비활성)인데 네이티브는 채운 막대다(4가지 설정 모두).

## 체크리스트
- [x] 비활성·활성 아이콘을 RN과 같은 글리프로

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-41-05` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 탭바 아이콘 세 개가 RN과 같다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · c1
- 원인: 같은 SF 심볼 `chart.bar`인데 SwiftUI 탭바는 심볼을 자동으로 `.fill` 변형으로 바꾼다. RN NativeTabs(UIKit)는 외곽선 그대로.
- 한 일: iOS 26 `TabView`의 티어리스트 `Tab`만 label 클로저로 바꾸고 `.environment(\.symbolVariants, .none)`. 26 미만 `CustomTabBar`는 RN과 같은 MaterialIcons `bar-chart`라 그대로.
- 검증: `make -C native/ios build` 통과. 시뮬레이터는 c1 규칙상 안 돌림 → **사용자 확인 필요**(fd 비교에서 집·사람 아이콘은 이미 같다고 해서 그 둘은 안 건드림).
