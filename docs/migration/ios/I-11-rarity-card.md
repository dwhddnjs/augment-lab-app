---
id: I-11
title: 증강 카드 프레임·타일
wave: W1
status: done
depends: I-01, I-02b, I-05
owns: native/ios/AugmentLab/UI/Cards/
spec: design-system.md §2.6~§2.8
rn: src/components/ui/{rarity-card-frame,augment-tile,augment-image}.tsx
---

# I-11 증강 카드 프레임·타일

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
앱의 얼굴인 증강 카드를 픽셀 단위로 옮긴다.

## 체크리스트
- [x] `RarityCardFrame`: 14:9, 모서리, 아트 2겹, 배치 비율, 글자 크기(일반·compact), 설명 줄 수 계산, 골드 수치 강조, 그림자·글로우(라이트·다크), 카드 텍스트 Dynamic Type 끔
- [x] 카드 폭 계산 헬퍼(§2.6)
- [x] `AugmentTile`
- [x] Preview: 희귀도 3종 × 라이트·다크 × 일반·compact

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-11` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 카드 3장을 RN 스크린샷과 겹쳐 보면 1px 안쪽으로 맞는다(테두리·그림자는 네 변 가장자리를 확인)
- [ ] 라이트 모드 그림자, 다크 모드 글로우

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `UI/Cards/` 3개
  - `RarityCardFrame(augment:cardWidth:compact:)` + `CardArt(rarity:width:)` + `.cardShadow(_:width:scheme:)` + `CardLayout`(aspect 14/9, corner 0.07, rowPad·gap 24, heightRatio 0.56, `cardWidth(screenWidth:screenHeight:gap:heightRatio:count:)`, `shape(width:)`)
  - `CardLabel` — 카드 글자를 UILabel로 그린다. RN iOS `<Text>`와 같은 문단 속성(min=max 줄높이, `RCTApplyBaselineOffset` 기준선 보정, 이름만 `hangulWordPriority`, 설명은 줄바꿈 전략 none, 꼬리 말줄임, Dynamic Type 끔). SwiftUI `Text`는 한글 줄바꿈 전략을 고를 수 없어서 줄 수·잘림이 RN과 어긋날 수 있다.
  - `AugmentTile(iconPath:rarity:size:background:)`
- 검증: `make build` 통과. 이 브랜치는 **native/I-05(#89) 위에 쌓았다** → #89가 머지되기 전 `status.sh diff I-11`은 I-05 파일을 owns 밖으로 잡는다. `git diff --name-only native/I-05...HEAD`는 `UI/Cards/` 3개와 이 파일뿐.
- 주의점
  - 그림자는 spec대로 SwiftUI `radius = CSS blur / 2`. 두 겹은 각자 그린다(체인으로 걸면 두 번째가 첫 번째 그림자까지 번진다).
  - 모서리는 `Radius.shape`(continuous) — I-01 규칙을 따랐다.
  - 이름 줄 수는 `NSAttributedString.boundingRect`로 잰다(RN `onTextLayout` 대신, 상태 없이 한 번에).
  - 펜타킬 스킬 카드(I-25a)는 `CardArt(rarity: .gold, width:)` + `.cardShadow(.gold, …)`를 쓰면 된다.
- 사용자가 볼 것: 아래 **사용자 확인** 두 줄(RN 스크린샷과 1px 겹쳐 보기, 라이트 그림자·다크 글로우). Preview `카드 3종 × 일반·compact`에 둘 다 있다.

