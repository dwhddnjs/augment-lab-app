# 홈(빌드 목록) 라이트모드 카드 수정 + plus 버튼 아이콘 + CLAUDE.md 규칙

## Context (왜 하는가)

홈 탭(`(home)/index.tsx` → `BuildListScreen`)은 `FlatList` + 커스텀 splash 히어로 카드(`BuildCard`)다. 다크모드는 자연스럽지만 라이트모드에서 부자연스러웠다:
- 카드 하단 LinearGradient가 `surface.base`(라이트=`#F2F2F7`)로 페이드 → splash 위에 흰 베일
- 증강·아이템 타일 배경이 `surface.sunken`(`#E5E5EA`)로 배경과 거의 같아 아이콘이 묻힘
- 날짜 칩 가독성 저하, 챔피언 이름 weight 약함
- 하단 plus(+) 탭 아이콘이 얇고 `disabled`라 색이 흐려짐

결정(사용자 확정): 홈은 **FlatList 유지**(expo-ui 마이그레이션 안 함) · 카드 내부를 **라이트/다크 공통 어두운 오버레이로 통일** · plus는 **iOS=SF / Android=Material 심볼** + accent 색 · 탭 아이콘 규칙을 CLAUDE.md에 기입.

## 변경 내역

1. **`src/constants/theme.ts`** — `HeroOverlay` 토큰 그룹 추가(모드 공통 고정 어두운 톤: scrim0~3, cardBase, tileBg, tileBorder, chipBg, textPrimary/Secondary). 카드 내부 색의 유일한 출처.
2. **`src/features/builds/components/build-card.tsx`** — LinearGradient를 `HeroOverlay.scrim0~3`으로, cardInner 배경/테두리·날짜 칩·아이템 타일을 `HeroOverlay`로, 챔피언 이름은 `textPrimary`+`fontWeight:'700'`, 부제/날짜는 `textSecondary`로.
3. **`src/features/builds/components/augment-tile.tsx`** — 타일 배경 `surface.sunken` → `HeroOverlay.tileBg`(어두운 배경 위 rarity border+밝은 아이콘 대비). `useTheme` 제거.
4. **`src/components/navigation/app-tabs.ios.tsx` + `app-tabs.tsx`** — plus Icon을 `sf="plus.circle.fill" md="add_circle" selectedColor={colors.accent.default}`로.
5. **`CLAUDE.md`** — 이미지·아이콘 섹션에 탭 아이콘 규칙(iOS=`sf`/Android=`md`, SF는 weight 불가→fill variant, 색은 `selectedColor`/`tintColor` 토큰) 추가.

## 검증

- `npx tsc --noEmit` + eslint 통과(완료).
- 시뮬레이터: 라이트모드 카드 하단 흰끼 제거·증강/아이템 아이콘 또렷·날짜 보임·챔피언 이름 굵게, 다크모드 회귀 없음, plus 아이콘 두껍고 accent 색.
- 주의: plus 탭이 `disabled`라 `selectedColor`가 시스템 dimming에 밀리면 색 강제가 안 될 수 있음 → 시뮬레이터 확인 후 필요 시 후속 조치.
