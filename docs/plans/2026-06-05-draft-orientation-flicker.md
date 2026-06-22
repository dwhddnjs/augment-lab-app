# 드래프트 진입/이탈 화면 방향(orientation) 전환 정리

## Context

챔피언 선택 모달에서 "시작하기" → 드래프트 화면 진입 시 화면 방향 전환이 불안정하다:

1. 드래프트 진입 시 카드 3장이 세로 레이아웃으로 잠깐 보였다가 가로로 reflow됨
2. 드래프트 나가기 → 메인으로 돌아올 때 가로→세로 전환 (정상)
3. **다시 챔피언 선택 → 시작하기 시 "가로→세로→가로" 깜빡임 발생**

원하는 동작: 시작하기 → 모달이 닫히고 드래프트로 이동 → **가로모드 전환이 끝난 뒤에 카드 3장 렌더**. 나가면 다시 세로모드. 재진입해도 동일하게 깔끔하게 동작.

## 근본 원인

- **깜빡임**: `champion-select-modal.tsx`의 `handleStart`가 `router.dismiss()` 직후 `router.push('/draft')`를 호출한다. `_layout.tsx`(48~55행)는 `pathname`을 single source of truth로 삼아 orientation을 lock하는데, `dismiss()`가 pathname을 잠깐 `/`(tabs)로 되돌려 **PORTRAIT lock**을 트리거하고, 직후 `/draft`가 **LANDSCAPE lock**을 트리거한다. 이 중간 portrait 단계가 "가로→세로→가로"의 정체다.
- **세로 카드 깜빡임**: `draft-screen.tsx` 164~169행의 `if (!isLandscape) return ...` 가드가 주석처리되어 있어, 가로 전환이 끝나기 전 portrait 상태에서 카드가 먼저 렌더된 뒤 reflow된다.

## 변경 사항

### 1. `src/features/champions/components/champion-select-modal.tsx` — `handleStart` (62~69행)
`router.dismiss()` 호출을 제거하고 `router.push`만 남긴다.

```ts
const handleStart = () => {
  if (!selectedId) return;
  // 모달을 dismiss하지 않고 draft를 그 위에 push한다. dismiss를 함께 호출하면
  // pathname이 잠깐 '/'(tabs)로 돌아가 _layout이 PORTRAIT lock을 걸었다가
  // 곧바로 LANDSCAPE lock을 걸어 가로↔세로 깜빡임이 발생한다. push만 하면
  // pathname이 modal → '/draft'로 직접 전환되어 LANDSCAPE lock이 한 번만 걸린다.
  // 모달은 draft 뒤 스택에 남고, 드래프트의 dismissTo('/')가 한 번에 정리한다.
  router.push({ pathname: '/draft', params: { championId: selectedId } });
};
```

- 모달은 fade로 진입하는 draft 화면(`_layout.tsx` 63행 `animation: 'fade'`) 뒤에 가려지므로 시각적 노출 문제 없음.
- 나가기(`draft-screen.tsx`의 `handleExit` → `router.dismissTo('/')`)와 결과 화면의 `handleHome`(`draft-result-screen.tsx` 45행)은 `dismissTo('/')`라 스택의 modal까지 한 번에 정리된다.

### 2. `src/features/draft/components/draft-screen.tsx` — landscape 가드 활성화 (164~169행)
주석처리된 가드를 살려, 가로 전환이 끝나기 전에는 빈 컨테이너만 렌더한다.

```tsx
// 화면은 portrait로 mount되고 _layout의 pathname lock이 landscape로 회전시킨다.
// 회전이 끝날 때까지 카드 렌더를 보류해, 카드가 portrait 레이아웃으로 먼저
// 떴다가 reflow되는 일을 막는다.
if (!isLandscape) {
  return <ThemedView style={styles.container} />;
}
```

(`ThemedView`, `styles.container`는 이미 import/정의되어 있어 추가 변경 불필요.)

## 재진입 시나리오 검증 (의도된 동작)

- 첫 진입: modal(`/select-champion-modal`, portrait) → push → `/draft`(landscape). lock 1회.
- 나가기: `dismissTo('/')` → modal·draft 모두 dismiss → pathname `/` → portrait. lock 1회.
- 재진입: 모달 open(portrait, 변화 없음) → 시작하기 → push `/draft`(landscape). lock 1회. **중간 portrait 단계 없음 → 깜빡임 없음.**
- 카드는 항상 `isLandscape === true`가 된 뒤에만 렌더됨.

## 검증 방법

1. `npm run ios` (또는 `npm start` 후 시뮬레이터)로 실행
2. 챔피언 선택 → 시작하기 → 드래프트가 **세로 깜빡임 없이** 가로로 전환된 뒤 카드 3장이 뜨는지 확인
3. 나가기 → 메인이 세로로 복귀하는지 확인
4. **다시 챔피언 선택 → 시작하기를 반복**하며 "가로→세로→가로" 깜빡임이 사라졌는지 확인
5. 픽 4회 완료 → 결과 화면(가로 유지) → 홈으로(세로 복귀) 흐름도 정상인지 확인

## 마무리

- 이 plan 문서를 `docs/plans/2026-06-05-draft-orientation-flicker.md`로도 저장한다 (CLAUDE.md 규칙).
