# 드래프트/아이템 선택 화면 헤더 리디자인 — 플로팅 글라스 칩

## Context

`draft.tsx`(→ `draft-screen.tsx`)와 `draft-items.tsx`(→ `item-select-screen.tsx`)는
둘 다 가로모드 게임 드래프트 화면이다. 그런데 헤더가:

- **draft**: 배경·구분선 없이 휑한 `space-between` row (나가기 / "라운드"+점 / 픽현황)
- **draft-items**: 하단 1px 선만 있는 평범한 row (제목+카운터 / 건너뛰기·완료)

서로 디자인 언어가 다르고 밋밋해 "허접해 보인다"는 피드백. 두 헤더를
**통일된 플로팅 글라스 칩(pill)** 언어로 다듬어 게임 HUD 느낌의 완성도를 준다.
배경 위에 둥근 글라스 칩들이 떠 있는 형태 — 좌/중/우 요소를 각각 칩으로.

## 접근

### 1) 공용 칩 컴포넌트 신설 — `src/components/ui/glass-chip.tsx`

두 feature(draft, items)가 공유하므로 CLAUDE.md 폴더 경계 규칙(2개 이상 사용 →
`components/ui` 승격)에 따라 공용 프리미티브로 만든다.

- `@/components/ui/glass-surface`의 `GlassSurface`로 감싼 **pill**(`borderRadius: Radius.full`)
- `Pressable`로 감싸 눌림 시 `opacity`/`scale` 피드백 (onPress 없으면 정적 칩)
- props: `onPress?`, `variant?: 'glass' | 'accent'`, `children`
  - `glass`(기본): `GlassSurface glassStyle="clear"` + 얇은 `border.subtle` 테두리
  - `accent`: 글라스 대신 `colors.accent.subtle` 배경 + `accent.default` 테두리(강조용 — 완료/픽현황)
- 내부는 아이콘+텍스트를 담을 수 있게 `flexDirection: row`, `gap: Spacing.one`,
  패딩 `paddingVertical: Spacing.two`, `paddingHorizontal: Spacing.three`
- 색상·반경·간격 전부 theme 토큰만 사용(하드코딩 금지). `Elevation.level2`로 살짝 띄움.
- iOS 26 글라스 / 구버전·안드로이드 BlurView 폴백은 `GlassSurface`가 이미 처리.

### 2) `draft-screen.tsx` 헤더 교체 (현재 206–238, styles 281–296)

- 좌: `<GlassChip onPress={handleExit}>` — close 아이콘 + "나가기"
- 중앙: `<GlassChip>`(정적) — `RoundIndicator` + "라운드" 라벨을 칩 안에 배치
- 우: `<GlassChip variant="accent" onPress={openDrawer}>` — 리스트 아이콘 + "픽 N/4"
- 헤더 컨테이너는 `space-between` 유지하되 `paddingVertical`만 살짝 조정.
  배경은 칩이 떠 보이도록 투명 유지(기존 화면 배경 위에 칩).

### 3) `RoundIndicator` 소폭 정돈 — `round-indicator.tsx`

- 칩 안에 들어가도 어색하지 않게: 채워진 점은 `accent.default`, 빈 점은
  `border.strong`(현재 `border.default`보다 또렷). 점 크기/간격은 유지.
- "라운드" 텍스트 라벨은 칩 쪽에서 넣으므로 인디케이터는 점+`N/4`만.

### 4) `item-select-screen.tsx` 헤더 교체 (현재 494–528, styles 767–779)

- 좌: `<GlassChip>`(정적) — 제목 "아이템 선택" + `N/6` 카운터(칩 안 2단 또는 라벨+caption)
- 우: `<GlassChip onPress={skip}>` "건너뛰기" + `<GlassChip variant="accent" onPress={done}>` "완료"
- 기존 `styles.btn`(직접 만든 pill 버튼) 제거 → `GlassChip`로 대체.
- 하단 `borderBottom` 구분선 제거(칩이 떠 있으므로 불필요).

## 재사용 대상

- `@/components/ui/glass-surface` `GlassSurface` — 글라스/블러/폴백 일괄 처리
- `@/constants/theme` `Radius`, `Spacing`, `Elevation`, `useTheme().colors`
- `SynergyIcon`(draft), `MaterialCommunityIcons`(items) — 기존 아이콘 그대로
- `ThemedText` — 라벨/카운터 텍스트
- i18n `t` dictionary — 기존 키 그대로 유지(텍스트 신규 추가 없음)

## 변경 파일

- 신규: `src/components/ui/glass-chip.tsx`
- 수정: `src/features/draft/components/draft-screen.tsx`
- 수정: `src/features/draft/components/round-indicator.tsx`
- 수정: `src/features/items/components/item-select-screen.tsx`
- 플랜 사본: `docs/plans/2026-06-09-draft-header-redesign.md` (CLAUDE.md 규칙)

## 검증

1. `npm run lint` 통과
2. `npm start` → Expo Go(iOS/Android)에서 두 화면 진입(가로모드):
   - draft: 좌/중/우 글라스 칩이 떠 보이고, 나가기·픽현황 탭 동작·라운드 점 갱신 확인
   - draft-items: 제목/카운터 칩, 건너뛰기·완료 칩 동작, 아이템 선택 카운트 반영 확인
   - 라이트/다크 모드 둘 다 칩 가독성·테두리 확인 (글라스 폴백 포함)
3. iOS 26 시뮬레이터(가능 시) 네이티브 글라스, 그 외 BlurView 폴백 외관 확인
