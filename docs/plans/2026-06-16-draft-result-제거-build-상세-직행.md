# draft-result 화면 제거 및 build 상세로 직행

## 배경

드래프트 완료 후 결과를 보여주는 `draft-result` 화면과, 저장된 빌드를 보여주는
`build/[id]` 상세 화면은 보여주는 내용(챔피언/증강/아이템/합산 스탯)이 사실상 동일했다.
두 화면을 유지할 이유가 없으므로 `draft-result`를 제거하고, 아이템 선택(`draft-items`)이
끝나면 곧바로 빌드를 저장한 뒤 그 빌드의 `build/[id]` 상세로 이동시킨다. 그 상세 화면에서
뒤로가기를 누르면 메인(홈)으로 돌아간다.

핵심 제약: 기존에 **빌드 저장 로직(`saveBuild`) + 세로모드 lock**이 `draft-result`의
`handleConfirm`에 있었다. 화면을 제거하므로 이 로직을 `item-select-screen`의 완료
핸들러로 옮겨 빌드 저장을 유지했다.

## 변경 사항

### 1. 저장 + 네비게이션 로직을 item-select로 이동
`src/features/items/components/item-select-screen.tsx`

- 기존 `navigateToResult(itemIds)`(→ `/draft-result`로 `router.replace`)를
  `saveAndOpenBuild(itemIds)`로 교체:
  - `saveBuild({ championId, augmentIds: pickedAugments.map(a => a.id), itemIds })` 호출
    (내부 컴포넌트가 이미 `pickedAugments`를 prop으로 받으므로 그대로 사용).
  - 저장 실패 시 `Alert.alert(translate('saveError'))` 후 중단.
  - 성공 시 세로 lock 후 이동:
    `ScreenOrientation.lockAsync(PORTRAIT_UP)` → `router.dismissTo('/')` →
    `router.push({ pathname: '/build/[id]', params: { id: build.id } })`.
    `dismissTo('/') + push` 패턴으로 draft 플로우 스택(draft/draft-items)이 정리되고
    `build/[id]`가 탭(홈) 위에 단독으로 쌓여, 네이티브 뒤로가기가 자동으로 홈으로 간다.
  - `saving` state 가드로 중복 호출(완료/건너뛰기 두 번 누름) 방지.
- import 추가: `saveBuild`(`@/lib/build-storage`), `Alert`(react-native).
  `ScreenOrientation`은 기존 import 재사용.
- i18n dictionary(`t`)에 `saveError` 키 추가(ko/en).
- 미사용이 된 `pickedJson` prop을 내부 컴포넌트에서 제거(외부 컴포넌트는 `pickedAugments`
  생성에 계속 사용).

### 2. draft-result 라우트/화면 제거
- 삭제: `src/app/draft-result.tsx`
- 삭제: `src/features/draft/components/draft-result-screen.tsx`
- `src/app/_layout.tsx`의 `<Stack.Screen name="draft-result" ... />` 제거.

### 3. 잔여 참조 정리
- `src/features/draft/hooks/use-draft.ts`의 주석을 `/draft-items`로 갱신.
- `src/` 내 다른 코드 참조 없음 확인(docs/plans의 과거 문서는 기록이므로 미수정).

## 영향 없음
- `build-list-screen.tsx`의 `router.push('/build/[id]')` 진입 경로는 그대로 동작.
- `build-detail-screen.tsx`는 수정 불필요(id로 `getBuild` 조회,
  `useFocusEffect`의 PORTRAIT lock 안전망 보유).

## 검증
- `npm run lint` 통과(미사용 import/잔여 참조 없음).
- 수동 확인(예정): 챔피언 선택 → 드래프트 → 아이템 선택 → 완료/건너뛰기 →
  build 상세 직행(세로모드) → 뒤로가기 시 홈 복귀 → 홈 목록에 저장된 빌드 노출.
