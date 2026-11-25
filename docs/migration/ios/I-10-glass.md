---
id: I-10
title: Glass 표면·버튼
wave: W1
status: todo
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
- [ ] `GlassSurface`(26+ glass regular / 26 미만 blur 20, `edge`)
- [ ] `GlassButton`(아이콘·라벨, tint, destructive, 26+ glassEffect / 26 미만 §2.4 폴백)
- [ ] Preview: 26 / 26 미만 비교

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-10` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] iOS 26과 iOS 18 시뮬레이터에서 X·✓·목록 버튼 모양이 RN과 같다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
