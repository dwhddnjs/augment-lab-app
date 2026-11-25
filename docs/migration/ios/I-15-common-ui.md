---
id: I-15
title: 소형 공용 (MoreLink·SettingsRow·TierMark)
wave: W1
status: done
depends: I-01
owns: native/ios/AugmentLab/UI/Common/
spec: design-system.md §2.9
rn: src/components/ui/{more-link,settings-row}.tsx, src/features/tierlist/components/tier-mark.tsx
---

# I-15 소형 공용 (MoreLink·SettingsRow·TierMark)

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
여러 피처가 쓰는 작은 조각 3개를 만든다.

## 체크리스트
- [x] `MoreLink`
- [x] `SettingsRow`
- [x] `TierMark`(heading·label 크기)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-15` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] (선택) Xcode Canvas에서 `UI/Common/TierMark.swift` Preview — S~D 배너 그라데이션·테두리가 RN 티어리스트와 같다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-15 완료
- **브랜치**: `native/I-01` 위에 쌓았다(#76 → #77 → #84 → 이 PR).
- **만든 API** (`UI/Common/`)
  - `MoreLink(_:action:)` — label 토큰 + chevron 12, gap 2, accent, hitSlop 8, 눌림 표시 없음
  - `SettingsRow(_:value:description:icon:iconColor:labelColor:rowBackground:action:)` — RN이 이미 SwiftUI(@expo/ui)였어서 구조를 1:1로 옮겼다. `action`이 있을 때만 chevron.
  - `TierMark(_:size:cornerRadius:)` — 모양은 `cornerRadius`(배너는 `Radius.full`), 크기는 호출부 frame으로 정한다. 글자색은 `text.primary`(RN ThemedText 기본).
  - 공용 도우미: `NoFeedbackButtonStyle`(RN `Pressable` 기본 = 눌림 표시 없음), `.hitSlop(_:)`(보이는 크기는 그대로, 터치 영역만 넓힘)
- **확인**: `make -C native/ios build` 통과(경고 0). 순수 로직이 없어 단위 테스트는 없다.
