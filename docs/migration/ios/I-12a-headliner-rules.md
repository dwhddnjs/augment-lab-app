---
id: I-12a
title: 헤드라이너 규칙
wave: W1
status: done
depends: I-02a
owns: native/ios/AugmentCore/Sources/AugmentCore/Headliners/, native/ios/AugmentCore/Tests/AugmentCoreTests/Headliners/
spec: aram.md §2.1
rn: src/features/headliners/rules.ts, scripts/check-headliners.ts
---

# I-12a 헤드라이너 규칙

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
헤드라이너 13종의 규칙을 순수 함수로 옮긴다. 난수 생성기를 주입할 수 있게 해 테스트를 결정적으로 만든다.

## 체크리스트
- [x] ID 목록, `cardsFor`, `roundsFor`, `nextRarity`, `skillChoices`, `needsSkillPick`, `rollHeadliner`, `rollRoundStickers`, `rerollSlotSticker`, `anvilCount`
- [x] 테스트: `check-headliners.ts` 항목 전부. 통계 검사는 20만 번 ±1%.

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-12a` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-12a 완료
- **브랜치**: `native/I-02a` 위에 쌓았다(#76 → #77 → 이 PR).
- **만든 API**
  - 타입: `HeadlinerId`(13개, rawValue = RN id), `StickerId`(6개), `SkillKey`(q/w/e/r)
  - `HeadlinerRules`
    - `aramRounds`, `draftEventIds`
    - `rollHeadliner(using:)`, `cardsFor(_:)`, `roundsFor(_:)`, `nextRarity(_:)`, `skillChoices(_:)`
    - `rollRoundStickers(using:)`, `rerollSlotSticker(_:_:using:)`, `anvilCount(_:)`
  - `cardsFor`·`roundsFor`·`anvilCount`는 String을 받는다. 저장된 빌드에 모르는 id가 있어도 동작해야 해서다.
- **난수 주입**: `using: inout some RandomNumberGenerator`. I-24(엔진)도 같은 방식으로 받는다.
  - 테스트용 `SplitMix64`가 `Tests/.../Headliners/`에 있다. 다른 테스트도 가져다 쓸 수 있다.
  - 난수를 부르는 순서도 RN과 같다(빈칸 위치 → 멤버 뽑기, 빈칸이 아닐 때는 리롤 확률을 부르지 않음).
- **확인**
  - `check-headliners.ts` 항목을 옮겼다: 순수 규칙, ko/en 텍스트 키 일치, 통계(20만 회 ±1% — 헤드라이너 균등, 스티커 2명·빈칸 균등, 리롤 50%)
  - `make -C native/ios test` 23개 통과, iOS 빌드 통과
  - 마크 짝 검사는 I-02b 테스트에 있다.
