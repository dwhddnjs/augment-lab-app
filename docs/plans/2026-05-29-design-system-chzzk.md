# 디자인 시스템 구축 — 치지직(Chzzk) 톤

## Context

현재 `src/constants/theme.ts`의 `Colors`는 6키(`text`, `background`, `backgroundElement`, `backgroundSelected`, `textSecondary`, `accent: #3c87f7`)만 보유. `ThemedText`는 폰트 사이즈가 하드코딩되어 있고 `linkPrimary`는 `#3c87f7`를 하드코딩, `ThemedView`는 죽은 `lightColor`/`darkColor` prop 보유. radius/elevation 토큰 부재로 `Spacing.two`(8) 같은 값이 borderRadius로 오용 중.

본 작업은 **치지직 느낌의 다운된 민트(~#1ED7A0)** 를 액센트로 한 시맨틱 디자인 시스템을 도입하고, 기존 키를 전면 시맨틱으로 리네이밍해 모든 consumer를 한 번에 마이그레이션. 라이트/다크 모두 지원하되 **다크모드가 hero**. 웹 미지원 원칙은 유지(`.web.tsx` 생성 금지).

스코프: **색상 + 타이포 스케일 + radius + elevation/shadow**. motion/z-index/opacity 스케일은 이번 범위 외.

---

## 1. 토큰 구조 (`src/constants/theme.ts` 전면 재작성)

기존 `Fonts`, `Spacing`, `BottomTabInset`, `MaxContentWidth`는 유지.

### Color — Dark (hero)

| Group | Key | Value |
|---|---|---|
| surface | `base` | `#0E0F12` |
| | `raised` | `#16181C` |
| | `sunken` | `#0A0B0D` |
| | `overlay` | `rgba(0,0,0,0.6)` |
| text | `primary` | `#F2F4F7` |
| | `secondary` | `#B0B4BA` |
| | `tertiary` | `#7A7F87` |
| | `disabled` | `#4A4E55` |
| | `inverse` | `#0E0F12` |
| | `onAccent` | `#04231A` |
| border | `default` | `#26292F` |
| | `subtle` | `#1B1E22` |
| | `strong` | `#3A3F47` |
| accent | `default` | `#1ED7A0` |
| | `hover` | `#2FE3AE` |
| | `pressed` | `#17B689` |
| | `subtle` | `rgba(30,215,160,0.14)` |
| | `onAccent` | `#04231A` |
| status.success | `default` / `subtle` | `#1ED7A0` / `rgba(30,215,160,0.14)` |
| status.warning | `default` / `subtle` | `#F2B33D` / `rgba(242,179,61,0.16)` |
| status.danger | `default` / `subtle` | `#F26D6D` / `rgba(242,109,109,0.16)` |
| status.info | `default` / `subtle` | `#5BA8FF` / `rgba(91,168,255,0.16)` |

### Color — Light

| Group | Key | Value |
|---|---|---|
| surface | `base` / `raised` / `sunken` / `overlay` | `#FAFBFC` / `#F0F2F5` / `#E6E8EC` / `rgba(15,17,21,0.45)` |
| text | `primary` / `secondary` / `tertiary` / `disabled` | `#0E0F12` / `#5A6068` / `#878D96` / `#B4B8BE` |
| | `inverse` / `onAccent` | `#FAFBFC` / `#04231A` |
| border | `default` / `subtle` / `strong` | `#D7DAE0` / `#E6E8EC` / `#B4B8BE` |
| accent | `default` / `hover` / `pressed` | `#10B187` / `#0E9F79` / `#0A8466` (라이트에서 AA 대비 확보) |
| | `subtle` / `onAccent` | `rgba(16,177,135,0.12)` / `#FFFFFF` |
| status | success/warning/danger/info `default` | `#0E9F79` / `#C98712` / `#D0463F` / `#2E78D6` (subtle은 다크와 동일 알파 패턴) |

### Typography

`Typography` 객체로 export. 기본 family는 `Fonts.sans`, `code`만 `Fonts.mono`.

| Variant | size | lineHeight | weight |
|---|---|---|---|
| `display` | 48 | 52 | 700 |
| `title` | 32 | 40 | 700 |
| `heading` | 22 | 28 | 600 |
| `body` | 16 | 24 | 500 |
| `label` | 14 | 20 | 600 |
| `caption` | 12 | 16 | 500 |
| `code` | 13 | 18 | 500 (Android 700) |

### Radius
`{ none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 }`

### Elevation
`level0/1/2/3` — `Platform.select`로 iOS는 `shadowColor/Opacity/Offset/Radius`, Android는 `elevation`. 레벨별 opacity `0 / 0.08 / 0.14 / 0.22`, radius `0 / 4 / 10 / 18`, elevation `0 / 1 / 4 / 8`. **다크모드는 surface 명도 차로 깊이 표현** — 새도우는 거의 보이지 않으니 의존 X.

### 최종 export
```ts
export const Theme = { light: {...}, dark: {...} }
export type ThemeColors = typeof Theme.light
export const Typography = { display, title, heading, body, label, caption, code }
export const Radius = {...}
export const Elevation = {...}
export { Fonts, Spacing, BottomTabInset, MaxContentWidth } // 변경 없음
```
기존 `ThemeColor` 타입은 제거.

---

## 2. 파일 변경

### `src/hooks/use-theme.ts`
```ts
return { mode, colors: Theme[mode], typography: Typography, radius: Radius, elevation: Elevation }
```
한 번의 훅 호출로 모든 토큰 접근.

### `src/components/themed-text.tsx`
- `type` 유니온: `'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'code' | 'link'`
- `StyleSheet.create` 제거, `Typography[type]` 스프레드
- `themeColor` → `color?: 'primary'|'secondary'|'tertiary'|'disabled'|'inverse'|'onAccent'|'accent'` (기본 `'primary'`)
- `link` variant는 `body` + `colors.accent.default` (하드코딩 `#3c87f7` 제거)
- 미사용 variant(`smallBold`, `linkPrimary`) 삭제

### `src/components/themed-view.tsx`
- 죽은 `lightColor`/`darkColor` prop 제거
- `type` → `surface?: 'base'|'raised'|'sunken'|'overlay'` (기본 `'base'`)
- `elevation?: 0 | 1 | 2 | 3` 옵션 추가

### Consumer 마이그레이션 매핑

| 파일 | 변경 |
|---|---|
| `src/app/select-champion-modal.tsx` | `theme.accent` → `colors.accent.default`; Start 버튼 텍스트 `#ffffff` → `colors.accent.onAccent`; `borderRadius: Spacing.two` → `Radius.md`; `borderRadius: Spacing.three` → `Radius.lg` |
| `src/app/(tabs)/index.tsx` | `<ThemedView type="backgroundElement">` → `surface="raised"`; `borderRadius: Spacing.four` → `Radius.xl`; `type="small"` → `type="label"` |
| `src/app/(tabs)/mypage.tsx` | `type="title"` 유지 |
| `src/app/(tabs)/community.tsx` | `type="title"` 유지 |
| `src/components/hint-row.tsx` | `type="backgroundSelected"` → `surface="sunken"`; `themeColor="textSecondary"` → `color="secondary"`; `type="small"` → `type="label"`; `borderRadius: Spacing.two` → `Radius.md` |
| `src/components/web-badge.tsx` | `themeColor="textSecondary"` → `color="secondary"`; `type="code"` 유지 |
| `src/components/app-tabs.tsx` + `.ios.tsx` + `.android.tsx` | `Colors[scheme]` → `Theme[scheme]`; `background` → `surface.base`; 인디케이터/선택 배경 → `surface.raised`; **선택 라벨 색을 `accent.default`로 변경 → 치지직 느낌 강화** |
| `src/components/ui/collapsible.tsx` | `type="backgroundElement"` → `surface="raised"`; `tintColor={theme.text}` → `colors.text.primary`; `borderRadius: 12` 및 `Spacing.three` → `Radius.lg`; `type="small"` → `type="label"` |

### 타이포 매핑 요약

| 기존 | 신규 |
|---|---|
| `default` | `body` |
| `title` (48/52/600) | `display` (48/52/700) |
| `subtitle` (32/44/600) | `title` (32/40/700) |
| `small` | `label` |
| `smallBold` | (미사용 — 제거) |
| `link` / `linkPrimary` | `link` 단일화 |
| `code` | `code` (사이즈 12→13) |

---

## 3. Critical Files
- `src/constants/theme.ts`
- `src/hooks/use-theme.ts`
- `src/components/themed-text.tsx`
- `src/components/themed-view.tsx`
- `src/app/select-champion-modal.tsx`
- `src/app/(tabs)/index.tsx`, `mypage.tsx`, `community.tsx`
- `src/components/hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx`
- `src/components/app-tabs.tsx` + `.ios.tsx` + `.android.tsx`

## 4. Verification

1. `npx tsc --noEmit` — 모든 미마이그레이션 잔재 타입 에러로 강제 검출
2. `npm run ios` — Home/Community/MyPage 탭 순회. 선택 라벨이 민트(#1ED7A0)로 강조되는지 확인. select-champion 모달: 선택 시 3px 민트 보더, Start 버튼 민트 배경 + 어두운 텍스트
3. iOS 시뮬레이터 `Cmd+Shift+A`로 라이트/다크 토글 — 양쪽 모두 텍스트 대비 4.5:1 이상 확보 확인
4. `npm run android` — 동일 시나리오 반복. raised surface에서 안드로이드 elevation으로 그림자 살짝 확인, 모노 폰트 폴백(`monospace`) 확인
5. `npm run lint` 통과

## 5. Risks / Open Considerations

- **NativeTabs**: `expo-router/unstable-native-tabs`는 `backgroundColor`/`indicatorColor`/`labelStyle`만 받음. 민트 selected는 `labelStyle.selected.color`로 적용 가능 — 안전
- **Spacing-as-radius**: `Spacing.four`(24)를 radius로 쓰던 곳은 직접 매칭 없음 → `Radius.xl`(16)로 다운 제안 (치지직은 라운드가 과하지 않음)
- **다크 그림자 무용성**: 다크에서 검정 그림자는 거의 안 보이므로 깊이 표현은 `surface.raised`의 명도 차에 의존 (문서화 필요)
- **`ThemedText.themeColor` API 변경은 breaking** — 동일 커밋에서 모든 caller 일괄 수정, alias 두지 않음
- **미사용 variant 제거**(`smallBold`, `linkPrimary`): grep 확인 결과 호출처 없음 → 안전 제거

## 6. 후속 (이번 범위 외)
- motion/duration/easing 토큰
- opacity 상태 스케일(pressed/disabled/hover)
- z-index 스케일
- `web-badge.tsx`의 `useColorScheme` → `useTheme().mode` 통일 정리

## 7. 플랜 문서 보관
CLAUDE.md 규칙에 따라 승인 후 본 문서를 `docs/plans/2026-05-29-design-system-chzzk.md`로도 복사 저장.
