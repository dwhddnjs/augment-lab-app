---
id: I-14
title: 빌드 카드 공용
wave: W1
status: done
depends: I-01, I-04a, I-05, I-12b
owns: native/ios/AugmentLab/UI/Builds/
spec: home-builds.md §2, design-system.md §4
rn: src/features/builds/components/build-card.tsx, src/features/builds/hooks/use-confirm-delete.ts, src/features/builds/utils/date.ts
---

# I-14 빌드 카드 공용

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
홈과 내 빌드가 함께 쓰는 빌드 카드를 만든다.

## 체크리스트
- [x] `BuildCard`(scrim 2종, 커스텀 accent, 눌림 0.92, 글로우 근사)
- [x] 삭제 확인 알림 헬퍼
- [x] `dayLabel`, `isWithinWeek`(로컬 자정 기준)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-14` → 소유 경로 밖 변경 없음 (I-04a·I-05·I-11·I-12b 위에 쌓아서 지금은 그 파일이 함께 잡힌다. 쌓은 브랜치 대비로는 `UI/Builds/`와 이 파일만)
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 카드를 RN과 나란히 비교(라이트·다크)
- [ ] 글로우(음수 spread 근사)가 눈에 띄게 다르지 않다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- `BuildDate.dayLabel`·`isWithinWeek`는 순수 로직인데 owns가 앱 타깃(`UI/Builds/`)뿐이라 여기 뒀다. AugmentCore로 옮기면 `swift test`로 RN 골든 값 테스트를 붙일 수 있다(지금은 테스트 없음).
- 의존 목록에 없는 I-11(`AugmentTile`)을 RN처럼 그대로 쓴다 → `depends`에 I-11 추가 필요(작업 파일 frontmatter는 상태판이 읽으니 사용자가 반영).

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 완료
- 한 일: `UI/Builds/`에 `BuildCard(build:width:onPress:onLongPress:)`(+`BuildCard.aspect` 0.7), `.confirmDeleteBuild($deleting)`(알림 → `BuildStore.remove(id:)`, 실패는 조용히), `BuildDate.dayLabel(_:_:)`·`isWithinWeek(_:)`(로컬 자정, `Calendar.startOfDay`). `make build` 통과(경고 0).
- 기반: #88(I-04a)·#89(I-05)·#96(I-11)·#90(I-12b) 위에 쌓았다. **그 넷을 먼저 머지**해야 diff가 I-14 것만 남는다.
- 주의점
  - 글로우 `0 6px 14px -8px C4D`: SwiftUI 그림자엔 spread가 없어 카드에서 8씩 들인 모양(반경 16−8)을 아래로 6 내리고 blur 7(=14÷2)로 직접 그린다. 카드가 불투명해 바깥으로 나온 것만 보인다(CSS와 같은 원리).
  - 눌림·길게 누르기: `onTapGesture` + `onLongPressGesture(0.5s, onPressingChanged:)`. Button을 쓰면 길게 누른 뒤 손을 뗄 때 탭도 같이 불려 RN과 달라진다.
  - 챔피언 그림은 RN처럼 RemoteImage가 아니라 WebImage 직접(전환 0, raised 바탕 없음).
  - 글자 그림자: RN `textShadowRadius 6`(CG blur) ≈ SwiftUI radius 3.
  - 조명색 알파는 `Color.opacity(hex2/255)` — 커스텀은 `Palette.dark.accent.default`(hex 리터럴 없이).
  - 환경: `GameDataStore`·`AppSettings`(카드), `BuildStore`(삭제 확인) — I-06a가 루트에서 넣는다.
- 사용자 볼 것: Xcode 프리뷰 `BuildCard.swift`(K/DA 오늘·증강 8개 → +n, 커스텀 어제, bees 다른 해 날짜, 헤드라이너 없는 빌드)를 RN과 라이트·다크로 나란히, 글로우가 눈에 띄게 다르지 않은지.
