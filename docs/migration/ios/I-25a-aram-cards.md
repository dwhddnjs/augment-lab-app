---
id: I-25a
title: 칼바람 카드·애니메이션
wave: W2
status: done
depends: I-11, I-12b
owns: native/ios/AugmentLab/Features/Aram/Cards/
spec: aram.md §3·§4, design-system.md §2.5·§3.5
rn: src/components/ui/{pick-card,reroll-button}.tsx, src/hooks/use-card-pick-anim.ts, src/features/aram/components/{aram-card,skill-card,card-marks}.tsx
---

# I-25a 칼바람 카드·애니메이션

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
카드 한 장의 모양과 움직임을 완성한다. 엔진과는 값만 주고받는다(입력: 카드 데이터·상태, 출력: 탭·리롤 콜백).

## 체크리스트
- [x] `PickCard`: 뒤집기 등장(index×90), 페이드 등장, 선택·비선택·리롤 퇴장 수치 그대로, rotateY 0일 때만 탭
- [x] 선택 확정 380ms, 리롤 교체 220ms 타이밍 헬퍼
- [x] `RerollButton` + 해킹 점멸(1300ms 주기)
- [x] `AramCard`, `SkillCard`, `CardMarks`(KDA·Worlds 배지, 스티커)
- [x] Preview: 카드 3장 행에서 등장·선택 재생

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-25a` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 뒤집기·선택 애니메이션이 RN과 같은 속도·궤적이다
- [ ] 해킹 점멸 주기
- [ ] 라이트 모드 리롤 아이콘

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- `CardEasing` / `Animation.cardEase(_:ms:)`(`PickCard.swift`) — Reanimated 곡선(inOutQuad·outQuad·outCubic)을 그대로 쓰는 `CustomAnimation`. I-26 `HeadlinerReveal`의 private `RNEasing`과 같은 것 → `UI/`나 `Design/`로 올려 하나로 합치기.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `Features/Aram/Cards/` 4개
  - `PickCard.swift`: `CardExitMode`·`CardEntryMode`, `@Observable CardPickAnim(count:)`(`pick(_:commit:)` 380ms · `reroll(_:swap:)` 220ms · busy 가드 · `cancel()`), `PickCard`(perspective 900 → rotateY → scale, 수치 spec §3.5 그대로, 회전이 0에 닿은 뒤에만 탭), `CardRow(topOffset:)`, `CardEasing`
  - `RerollButton(used:hacked:disabled:onPress:)` — 36 원, 사용 후 sunken/subtle, 흐림 0.35·눌림 0.65, 해킹 아트 50(라이트 `-light`), 점멸 140/460/700ms, 동작 줄이기면 점멸 없음
  - `AramCard(…, badge: CardBadge?, stickerLine: StickerLine?)`, `StickerMark`, `StickerLabel`, `SkillCard`, `markedParagraph`
- 검증: `make build` 통과. **native/I-11(#96, #89 포함) + native/I-12b(#90) 위에 쌓았다** → 둘이 머지되기 전 `status.sh diff`는 그 파일들을 owns 밖으로 잡는다. 이 작업이 바꾼 것은 `Features/Aram/Cards/` 4개와 이 파일뿐(`git diff --name-only native/I-11...HEAD`에서 I-12b 파일 제외).
- I-25b가 알아야 할 것
  - 카드 id는 `.id("\(anim.roundKey)-\(augment.id)")`(스킬 카드는 `-\(skill)`) — 라운드마다 새로 만들어야 flip 등장이 돈다.
  - 화면을 떠날 때 `anim.cancel()`.
  - 표식: kda 보너스 → `.kda`, worlds → `.worlds`, 그 밖에 슬롯 스티커가 있으면 `.sticker(id)`. HEARTSTEEL 라운드면 모든 카드에 `StickerLine(sticker: slotStickers[i])`.
  - `StickerLabel`·`SkillCard`는 `@Environment(GameDataStore.self)`를 읽는다.
- 주의점
  - 탭 가드는 RN의 "애니메이션 값이 0인가" 대신 "flip 애니메이션 완료 콜백이 왔는가"로 한다(SwiftUI 상태는 목표값이라 현재값을 읽을 수 없다). 결과는 같다.
  - perspective는 SwiftUI `rotation3DEffect`의 상대값 대신 `m34 = -1/900` 행렬을 직접 건다(RN iOS와 같은 행렬).
  - 카드 글자는 I-11 `CardLabel`(RN 문단 속성 그대로) 재사용.
- 사용자가 볼 것: 아래 **사용자 확인** 세 줄. Preview `카드 3장 — 등장·선택·리롤`에서 카드 탭 = 선택, 리롤 버튼, 해킹 토글, 표식 선택.

