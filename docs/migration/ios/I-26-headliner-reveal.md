---
id: I-26
title: 헤드라이너 등장 연출
wave: W2
status: done
depends: I-12b
owns: native/ios/AugmentLab/Features/Aram/Reveal/
spec: design-system.md §3.4
rn: src/features/aram/components/headliner-reveal.tsx
---

# I-26 헤드라이너 등장 연출

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
드래프트 시작 연출을 수치 그대로 옮긴다.

## 체크리스트
- [x] 무대, wash, 로고(+aura, heartsteel 0.78), 세로선, 문구 3줄 지연
- [x] 2600ms 자동 닫기, 탭으로 건너뛰기, 300ms 페이드 → `onDone`
- [x] Reduce Motion 무시

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-26` → 소유 경로 밖 변경 없음 (I-12b 위에 쌓아서 지금은 I-12b 파일이 함께 잡힌다. `git diff native/I-12b..` 기준 I-26 파일만. #90 머지 후엔 깨끗)
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 13종 모두 RN과 같은 타이밍으로 나타난다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- Reanimated `Easing`을 그대로 쓰는 `RNEasing`(CustomAnimation, out(cubic)·inOut(quad)) + `Animation.rn(_:ms:)` — 지금 `HeadlinerReveal.swift` 안 `private`. I-25a·I-27·I-06c 연출도 같은 이징을 쓰니 `Design/`(I-01 소유)로 승격 후보. 그 전에 다른 피처가 따로 만들면 이름이 겹치지 않게 `private`로 둘 것.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 완료
- 한 일: `Features/Aram/Reveal/HeadlinerReveal.swift` — `HeadlinerReveal(id:onDone:)`. 무대 #0A0B0D, wash(타원 70%×90% at 28% 0%, Canvas 변환으로 CSS 그대로), 로고 260×180(+aura 460 farthest-corner, heartsteel 0.78), 세로선 2×hairline×148, 문구 3줄(560/620/700ms), 2600ms 자동 닫기·탭 건너뛰기·300ms 페이드 후 `onDone`. `make build` 통과.
- 기반: I-12b(PR #90) 위에 쌓았다(`HeadlinerAssets` 사용). **#90을 먼저 머지**해야 이 PR diff가 I-26 것만 남는다.
- 주의점
  - 타이머는 `.task(id: closing)` 하나: 닫기 전 2600ms → close, 닫는 중 300ms → onDone. 화면에서 빠지면 취소돼 RN 타이머 정리처럼 onDone이 안 불린다.
  - 이징은 근사 베지어가 아니라 Reanimated 함수 그대로(`RNEasing`). wash FadeIn은 Reanimated withTiming 기본값 inOut(quad).
  - 등장은 `.animation(_:value: appeared)`를 요소마다 따로 걸어 지연을 준다. Reduce Motion은 SwiftUI가 알아서 줄이지 않으므로 따로 하는 일이 없다.
  - 설명 줄바꿈은 SwiftUI 기본(standard) 전략 = 한글 어절 단위(RN `lineBreakStrategyIOS="hangul-word"`).
  - 무대는 `ignoresSafeArea()` — 칼바람 화면(I-25b)이 위에 덮어 씌우면 된다.
- 사용자 볼 것: Xcode 프리뷰 `HeadlinerReveal.swift`(가로) — 피커로 13종을 바꿔 가며 RN과 같은 타이밍(로고 120ms → 세로선 460 → 문구 560/620/700 → 2.6초 뒤 0.3초 페이드)인지, 탭하면 바로 닫히는지.
