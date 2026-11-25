---
id: I-10
title: Glass 표면·버튼
wave: W1
status: done
depends: I-01
owns: native/ios/AugmentLab/UI/Glass/
spec: design-system.md §2.2~§2.4·§4
rn: src/components/ui/{glass-surface,glass-button,glass-button-fallback}.tsx
---

# I-10 Glass 표면·버튼

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
드래프트 헤더와 여러 표면이 쓰는 glass 계열을 만든다.

## 체크리스트
- [x] `GlassSurface`(26+ glass regular / 26 미만 blur 20, `edge`)
- [x] `GlassButton`(아이콘·라벨, tint, destructive, 26+ glassEffect / 26 미만 §2.4 폴백)
- [x] Preview: 26 / 26 미만 비교

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-10` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] iOS 26과 iOS 18 시뮬레이터에서 X·✓·목록 버튼 모양이 RN과 같다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-10 완료
- **브랜치**: dev 위 `native/fix-merge`(#86)에 쌓았다. #86 다음에 머지한다.
- **만든 API** (`UI/Glass/`)
  - `GlassSurface(cornerRadius:edge:) { … }`
    - 26+: `.glassEffect(.regular, in:)` + 클립
    - 26 미만: `BlurBackground` + 선택적 hairline 테두리
  - `GlassButton(_ label:systemImage:fallbackIcon:tint:role:accessibilityLabel:action:)`
    - 라벨이 없으면 44 원(glass interactive), 있으면 `.buttonStyle(.glass)` pill
    - @expo/ui 수정자 순서를 그대로 지켰다(padding이 glass 바깥 여백이 된다)
  - 폴백(26 미만, Android 기준): 단색 원·pill, `tint`면 accent로 채움, destructive는 danger 색, 눌림 0.7, hitSlop 8, elevation level1
  - `PressedOpacityStyle(opacity:)` — RN 눌림 opacity 표(spec §3.11)용 공용 스타일
  - `BlurBackground(scheme:intensity:)` — expo-blur와 같은 구현(UIBlurEffect + 애니메이터 `fractionComplete = intensity / 100`)이라 농도가 RN과 같다
- **재사용**: I-15의 `NoFeedbackButtonStyle`, `.hitSlop(_:)`
- **확인**: `make -C native/ios build` 통과(경고 0). 시각 확인은 사용자 몫이다.
