# 드래프트/아이템 헤더 버튼 — expo-ui SwiftUI 네이티브 glass 버튼으로 전환

## Context (왜 하는가)

`draft`(`src/app/draft.tsx` → `features/draft/components/draft-screen.tsx`)와
`draft-items`(`src/app/draft-items.tsx` → `features/items/components/item-select-screen.tsx`)는
몰입형 가로 풀스크린 화면. 지금까지 헤더 버튼을 자체 `GlassChip`
(`expo-glass-effect` GlassView + 직접 그린 fill/sheen)으로 만들었는데,
어두운 배경 위에서 광택·blur가 제대로 살지 않고 인위적으로 보였다.

사용자 결정: **`@expo/ui/swift-ui`의 진짜 SwiftUI `Button` + `buttonStyle('glass')`
모디파이어**로 헤더 버튼을 다시 만든다. 네이티브 리퀴드글래스 버튼이라 광택/blur가 OS에서
제대로 렌더된다.

### 확정 사항(질문 답변)
- **완료 vs 건너뛰기 구분**: 둘 다 `buttonStyle('glass')`, **완료에만 `tint(민트)`**.
- **폴백**: glass 버튼은 iOS 26+ & Xcode 26 dev build 전용이고 `swift-ui`는 iOS 전용이므로,
  Android·구형 iOS·Expo Go에서는 **기존 `GlassChip`으로 폴백**.

### 전제(실행 환경)
- `@expo/ui ~56.0.14` 설치됨(코드베이스 첫 사용). `swift-ui` glass는 **dev build 필요**
  (`npx expo run:ios`, Xcode 26, iOS 26 시뮬레이터/기기). Expo Go에서는 폴백으로 렌더된다.

## 변경 대상

### 1. 새 공용 컴포넌트 — `src/components/ui/glass-button.*` (플랫폼 분기)
통일 인터페이스로 헤더 글래스 버튼을 캡슐화한다.

```ts
interface GlassButtonProps {
  label: string;
  systemImage?: string;   // iOS SF Symbol (expo-ui Button systemImage)
  fallbackIcon?: string;  // 폴백 GlassChip용 MaterialCommunityIcons 이름
  tint?: string;          // 민트 강조 (완료 버튼). 없으면 중성.
  role?: 'default' | 'cancel' | 'destructive';
  onPress: () => void;
}
```

- **`glass-button-fallback.tsx`** — 기존 `GlassChip`(`src/components/ui/glass-chip.tsx`) 래퍼.
  `label`→`ThemedText`, `fallbackIcon`→`SynergyIcon`(`features/draft/.../synergy-icon.tsx`,
  MaterialCommunityIcons), `tint` 있으면 `variant="accent"`. 두 플랫폼 파일이 공유.
- **`glass-button.tsx`** (Android·기본) — `glass-button-fallback`의 구현을 `GlassButton`으로 재노출.
- **`glass-button.ios.tsx`** — `isLiquidGlassAvailable()`(expo-glass-effect)로 분기:
  - true → `@expo/ui/swift-ui`의 `<Host matchContents><Button .../></Host>`.
    `Button`에 `label`, `systemImage`, `role`, `onPress`,
    `modifiers={ tint ? [buttonStyle('glass'), tint(색)] : [buttonStyle('glass')] }`.
    import: `{ Host, Button } from '@expo/ui/swift-ui'`,
    `{ buttonStyle, tint } from '@expo/ui/swift-ui/modifiers'`.
  - false(iOS 26 미만) → `glass-button-fallback`의 폴백 렌더.

> `GlassChip`은 폴백 경로로만 남기고 그대로 유지(삭제하지 않음).

### 2. `draft-screen.tsx` — 헤더 버튼 교체
- 나가기: `<GlassButton label={translate('exit')} systemImage="xmark" fallbackIcon="close" role="cancel" onPress={handleExit} />`
- Picks: `<GlassButton label={`${translate('picks')} ${picked.length}/4`} systemImage="list.bullet" fallbackIcon="format-list-bulleted" onPress={() => setDrawerOpen(true)} />`
- 가운데 라운드 인디케이터(`RoundIndicator`)·라벨은 **RN 유지**(동적 커스텀 UI라 expo-ui 부적합).
- 기존 `GlassChip` import 제거.

### 3. `item-select-screen.tsx` — 헤더 버튼 교체
- 건너뛰기: `<GlassButton label={translate('skip')} onPress={() => saveAndOpenBuild([])} />` (중성)
- 완료: `<GlassButton label={translate('done')} tint={colors.accent.default} onPress={() => saveAndOpenBuild(selectedIds)} />` (민트 tint)
- 제목("아이템 선택")·카운터(`n/6`)는 ThemedText 유지(카운터 색은 직전 작업대로 secondary).
- 기존 `GlassChip` import 제거.

## 주의/리스크
- `Host`는 SwiftUI 아일랜드 — `matchContents`로 콘텐츠 크기에 맞춰 RN 헤더 row 안에 인라인 배치.
  가로모드 레이아웃에서 버튼 정렬/높이가 기존과 다를 수 있어 실기기 확인 필요.
- `tint` 모디파이어는 라벨 색까지 민트로 물들임(SwiftUI `.tint` 동작) — 완료 버튼이 민트 글자가 됨(의도됨).
- glass 스타일은 Xcode 26 빌드에서만 적용. 빌드 환경이 아니면 일반 버튼/폴백으로 보임.

## 검증
1. `npx expo run:ios`(iOS 26 시뮬레이터/Xcode 26)로 dev build 실행.
2. 홈 → 챔피언 선택 → 드래프트: 가로 헤더의 **나가기/Picks**가 네이티브 SwiftUI glass 버튼으로
   광택·blur와 함께 렌더되는지, 누름 반응·SF Symbol 아이콘 확인.
3. 4픽 완료 → 아이템 선택: **건너뛰기(중성)/완료(민트 tint)** 구분 확인.
4. Expo Go(`npm start`) 또는 Android에서 **GlassChip 폴백**이 뜨는지 확인.
5. `npm run lint` — 미사용 `GlassChip` import 정리 확인.

## 메모
- 구현 시작 시 이 계획을 `docs/plans/2026-06-17-draft-header-expo-ui-glass.md`에도 저장(CLAUDE.md 규칙).
