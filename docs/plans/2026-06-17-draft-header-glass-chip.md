# 드래프트 헤더 버튼 — 진짜 iOS 리퀴드글래스로 통일

## Context (왜 하는가)

`draft`(`src/app/draft.tsx` → `features/draft/components/draft-screen.tsx`)와
`draft-items`(`src/app/draft-items.tsx` → `features/items/components/item-select-screen.tsx`)는
몰입형 가로 풀스크린 플로우다. native 헤더는 이 화면에 부적합해서(사용자가 시도 → "개판"),
CLAUDE.md 헤더 정책상 `headerShown: false` + 커스텀 플로팅 헤더가 맞다. 이 방향은 유지한다.

문제는 **헤더 버튼이 튄다**는 것. 두 화면 모두 공용 `GlassChip`
(`src/components/ui/glass-chip.tsx`)을 쓰는데, 이 칩이 네이티브 리퀴드글래스 위에
인위적 장식을 **직접 덧칠**한다:

- `LinearGradient` sheen(상단 광택)
- 차등 림 라이트(상·좌·우·하 테두리 색을 다르게)
- 강한 드롭섀도 + `variant='accent'`의 민트 글로우(`shadowRadius 14`)

정작 `expo-glass-effect` `GlassView`의 진짜 버튼 효과(`isInteractive`, `tintColor`)는
안 쓰고 있다. 장식을 걷어내고 네이티브에 위임하면 **진짜 iOS 룩 + 미니멀 + 통일감**이 된다.

사용자 결정: **모든 헤더 버튼을 동일한 중성(무채색) 글래스로 통일**. 강조 글로우/민트 틴트 없이,
텍스트·아이콘 색으로만 의미를 구분한다.

## 변경 대상

### 1. `src/components/ui/glass-surface.tsx` — 네이티브 인터랙션 prop 추가
`GlassChip`이 직접 `GlassView`를 호출하지 않도록(CLAUDE.md 규칙: 직접 호출 금지),
`GlassSurface`에 prop을 추가해 네이티브 글래스 버튼 능력을 위임한다.

- `isInteractive?: boolean` 추가 → iOS 26+ 분기의 `<GlassView>`에 그대로 전달.
- `tintColor?: string` 추가 → `<GlassView tintColor={...}>`에 전달(이번엔 중성 통일이라
  실사용 안 하지만, 향후 확장 + API 완성도 위해 함께 둔다).
- BlurView/단색 폴백 분기는 두 prop을 무시(네이티브 전용 기능).

### 2. `src/components/ui/glass-chip.tsx` — 장식 제거 + 네이티브 위임
대폭 단순화. 핵심:

- **제거**: `LinearGradient` sheen, 차등 림 라이트(`borderTopColor` 등 4색 분기),
  `glow`/드롭섀도, `variant` 분기 전체, `expo-linear-gradient` import.
- iOS 26+: `<GlassSurface isInteractive glassStyle="regular" style={surface}>` 한 겹 +
  내부 `inner`(flex row, gap, 패딩)에 `children`. 인위 채움/광택 없음.
- 폴백(iOS<26 / Android): `GlassSurface`(BlurView)에 **헤어라인 테두리 하나만**
  (`colors.glass.rim` 또는 `colors.border.subtle`, `borderWidth` iOS 0.5 / 그 외 1).
- `Pressable` 눌림 피드백(`opacity`/`scale`)은 유지 — 미세 인터랙션이라 튀지 않음.
- `variant` prop 제거하므로 시그니처는 `{ children, onPress?, style? }`로 축소.
- 그림자가 필요하면 SKILL 규칙대로 `boxShadow` 한 줄(아주 옅게)만, 또는 생략.

### 3. 호출부 — `variant`/색 정리로 중성 통일
`variant="accent"`와 민트 텍스트/아이콘 색을 모두 중성으로 바꾼다.

- `draft-screen.tsx`
  - 나가기 칩: 그대로(이미 중성).
  - **Picks 칩**: `variant="accent"` 제거, 아이콘 `color`와 텍스트를
    `colors.accent.default` → `colors.text.secondary`로. 픽 개수는 그대로 표시.
- `item-select-screen.tsx`
  - 헤더의 큰 `ThemedText type="heading"`("아이템 선택")과 별도 민트 카운터(`n/6`)는
    **버튼 통일과 별개**로 draft 화면 헤더 톤과 어긋난다. 우선 카운터 색을
    `accent.default` → `text.secondary`로 낮춰 톤을 맞춘다(제목 유지).
  - **완료 칩**: `variant="accent"` 제거, 텍스트 `accent.default` → `text.secondary`.
  - 건너뛰기 칩: 그대로(이미 중성).

> 결과: 두 화면의 모든 칩이 같은 중성 리퀴드글래스 질감 + secondary 텍스트로 통일.
> `GlassChip` 한 곳만 고치고 호출부에서 색만 정리하면 양쪽이 자동 일치.

### 4. 잔여 토큰
`colors.glass.sheen`/`rimTop`은 단순화 후 미사용이 될 수 있음. **제거하지 않고 남겨둔다**
(theme 토큰 변경은 CLAUDE.md상 문서 동반 갱신이 필요한 별도 작업). 폴백 테두리에 `glass.rim`만 사용.

## 검증

1. `npm run ios`(iOS 26+ 시뮬레이터/기기)로 실행 → 홈에서 챔피언 선택 → 드래프트 진입.
2. 가로 헤더에서 **나가기 / Picks** 칩이 동일한 중성 리퀴드글래스로 보이는지,
   sheen·림·민트 글로우가 사라졌는지 확인. 누를 때 네이티브 글래스 인터랙션(`isInteractive`) 반응 확인.
3. 4픽 완료 → 아이템 선택 화면에서 **건너뛰기 / 완료** 칩이 드래프트 헤더와 동일 질감인지 확인.
4. 가능하면 iOS 26 미만 또는 Android에서 폴백(BlurView + 헤어라인) 렌더 확인.
5. `npm run lint`로 미사용 import(`LinearGradient`) 정리 확인.

## 메모
- 구현 시작 시 이 계획을 CLAUDE.md 규칙대로 `docs/plans/2026-06-17-draft-header-glass-chip.md`에도 저장할 것.
