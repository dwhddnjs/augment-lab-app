---
id: I-01
title: 디자인 토큰·텍스트·아이콘
wave: W0
status: todo
depends: I-00
owns: native/ios/AugmentLab/Design/
spec: design-system.md §1·§2.1·§5·§8
rn: src/constants/theme.ts, src/components/themed/*, src/hooks/use-theme.ts, src/hooks/use-rarity-colors.ts
---

# I-01 디자인 토큰·텍스트·아이콘

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
theme.ts를 그대로 Swift로 옮긴다. 이후 UI 작업은 숫자·hex를 직접 쓰지 않고 이 토큰만 쓴다.

## 체크리스트
- [ ] `Palette`(dark/light): §1.1 색 전부. 현재 모드 팔레트를 환경값으로 넘긴다(`@Environment(\.palette)`).
- [ ] 타이포 6종 + RN 줄높이 재현 modifier: 고정 lineHeight + 세로 가운데 정렬. 상속 규칙(§1.2)은 주석 한 줄로 남긴다.
- [ ] Spacing, Radius(continuous), Elevation.level1
- [ ] 희귀도·티어(+light), HeroOverlay, AugmentCardColors, HeadlinerColors, StageAlpha, StatTextColors, SkillCardColors, Brand
- [ ] hex 알파 접미사 헬퍼 (`color.alpha("4D")`), hairline = `1 / displayScale`
- [ ] `Icon` 헬퍼: `.sf(name)`, `.mci(name)`, `.mi(name)`. glyphmap JSON으로 코드포인트를 찾는다.
- [ ] ThemedText / ThemedView 대응 modifier
- [ ] 토큰 스와치 Preview 1개

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-01` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] (선택) Preview 스와치 색이 `theme.ts`와 같다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
