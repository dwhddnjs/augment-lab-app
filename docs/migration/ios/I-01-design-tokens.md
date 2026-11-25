---
id: I-01
title: 디자인 토큰·텍스트·아이콘
wave: W0
status: done
depends: I-00, I-02a
owns: native/ios/AugmentLab/Design/, native/ios/AugmentCore/Sources/AugmentCore/Design/, native/ios/AugmentCore/Tests/AugmentCoreTests/Design/
spec: design-system.md §1·§2.1·§5·§8
rn: src/constants/theme.ts, src/components/themed/*, src/hooks/use-theme.ts, src/hooks/use-rarity-colors.ts
---

# I-01 디자인 토큰·텍스트·아이콘

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
theme.ts를 그대로 Swift로 옮긴다. 이후 UI 작업은 숫자·hex를 직접 쓰지 않고 이 토큰만 쓴다.

## 체크리스트
- [x] `Palette`(dark/light): §1.1 색 전부. 현재 모드 팔레트를 환경값으로 넘긴다(`@Environment(\.palette)`).
- [x] 타이포 6종 + RN 줄높이 재현 modifier: 고정 lineHeight + 세로 가운데 정렬. 상속 규칙(§1.2)은 주석 한 줄로 남긴다.
- [x] Spacing, Radius(continuous), Elevation.level1
- [x] 희귀도·티어(+light), HeroOverlay, AugmentCardColors, HeadlinerColors, StageAlpha, StatTextColors, SkillCardColors, Brand
- [x] hex 알파 접미사 헬퍼 (`color.alpha("4D")`), hairline = `1 / displayScale`
- [x] `Icon` 헬퍼: `.sf(name)`, `.mci(name)`, `.mi(name)`. glyphmap JSON으로 코드포인트를 찾는다.
- [x] ThemedText / ThemedView 대응 modifier
- [x] 토큰 스와치 Preview 1개

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-01` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] (선택) Xcode Canvas에서 `Design/TokenPreview.swift`의 스와치 색이 `theme.ts`와 같다
- [ ] (선택) 같은 문구를 RN과 나란히 놓았을 때 글자 줄높이·굵기가 같다(`rnText`)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-01 완료
- **브랜치**: 처음엔 `native/I-00`에서 시작했다. 그런데 희귀도·티어 색 표를 `Rarity`·`Tier` 타입(I-02a)으로 묶으려고 `native/I-02a` 위로 옮겼다. 그래서 frontmatter `depends`에 I-02a를 더했다(#76 → #77 → 이 PR).
- **owns 추가**: 색 문자열 파서를 시뮬레이터 없이 테스트하려고 Core `Design/` 영역을 만들었다. 다른 작업이 소유하지 않던 경로다.
- **만든 API** (다음 UI 작업용)
  - **색 생성**
    - `Color(token:)` — "#RRGGBB" / "#RRGGBBAA" / "rgba()" (오타면 개발 중에 바로 터진다)
    - `Color(hex:alpha:)` — RN의 `color + "4D"`
  - **팔레트**
    - `Palette.dark` / `.light` / `.of(scheme)` — `surface.*`, `text.*`, `border.default/subtle/strong`, `accent.default/subtle/onAccent`, `status.danger/dangerSubtle`, `glassFill`
    - 뷰에서는 `@Environment(\.palette)`. 루트(I-06a)와 시트·풀스크린 안에서 `.providesPalette()`를 건다.
  - **고정 색 묶음**
    - `RarityColors.color(_:_:)` / `.hex` / `.glyph`
    - `TierColors.hex(_:_:)` + `edge` / `center` / `border` 알파
    - `HeroOverlay.*`, `AugmentCardColors.*`, `HeadlinerColors[id]`, `StageAlpha.*`
    - `StatTextColors.color(key, scheme)`, `SkillCardColors.*` (`.mark(key)`), `Brand.splashBg`
  - **치수·글자**
    - `Spacing.*`, `Radius.*` + `Radius.shape(r)`(continuous), `bottomTabInset`, `hairline(displayScale)`, `.elevationLevel1()`
    - `.rnText(.body)` / `.rnText(size:lineHeight:weight:scales:)` — RN 줄높이(줄마다 고정 높이, 글자 가운데) + Dynamic Type 배율. 카드 텍스트는 `scales: false`.
    - `fontWeight(600)`, `.surfaceBackground(\.raised)`
  - **아이콘**: `IconView(.sf / .mci / .mi(name), size:)`
    - MCI 폰트 PostScript 이름은 `MaterialDesignIcons`, MI는 `MaterialIcons-Regular`(TTF name 테이블에서 확인)
    - 명세의 MCI 24개·MI 4개가 glyphmap에 전부 있다.
  - Preview `TokenSwatches`(다크·라이트) — Xcode Canvas에서 RN과 눈으로 비교할 때 쓴다.
- **판단**: 쓰지 않는 토큰은 옮기지 않았다(`status.success/warning/info`, `Elevation.level2`, `scrimLight`, spec §1.1).
- **확인 필요(사용자)**: RN 줄높이 재현이 1px 안쪽으로 맞는지는 실기기 비교가 필요하다. spec §8 "픽셀 함정"
- **확인**: `make -C native/ios test` 19개 통과, `make -C native/ios build` 통과(경고 0)
