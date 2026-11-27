---
id: I-29d
title: 커스텀 화면 조립
wave: W2
status: done
depends: I-06b, I-10, I-29b, I-29c
owns: native/ios/AugmentLab/Features/Custom/Screen/
spec: custom.md §1·§2, design-system.md §3.6
rn: src/features/custom/screens/custom-screen.tsx, src/features/custom/components/{augment-search-field,pick-target-toggle,custom-settings-drawer}.tsx
---

# I-29d 커스텀 화면 조립

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
커스텀을 완성한다.

## 체크리스트
- [x] 가로 준비 가드, 6.5:4.5 배치
- [x] 헤더: X(확인), 검색 필드, `PickTargetToggle`(180ms·햅틱), ✓, ⚙
- [x] 설정 서랍(스와이프 끔): 빠른 모드, 정렬
- [x] 저장(검증 알림 → `openBuild`)
- [x] 스텁의 임시 버튼 제거

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-29d` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 증강 1개 담고 저장 → 최근 빌드 맨 앞
- [ ] 토글 노브 움직임
- [ ] 드래그 중 서랍이 열리지 않는다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- `CloseDraft.confirmExit(title:message:cancel:ok:)` — RN 확인창은 메시지 "담은 증강과 아이템은 저장되지 않습니다."도 띄우는데 지금 계약(I-06b)엔 message가 없어 제목만 띄운다. 생기면 `CustomScreen` header의 `promote:` 줄에 넣는다.
- `SideDrawer`(I-27 `Features/Aram/Drawer/`) → `UI/`. 지금은 스와이프만 뺀 복사본 `SettingsDrawer`(`Screen/CustomSettingsDrawer.swift`).

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- `Screen/` 3개: `CustomScreen`(가로 준비 가드 = I-28과 같은 방식, 6.5:4.5, `PickDrag` 경계·고스트, 오버레이 2개, 저장), `CustomHeader`(`AugmentSearchField`·`PickTargetToggle`), `CustomSettingsDrawer`(`SettingsDrawer` 껍데기 + `CustomSettingsPanel` List).
- 쌓은 곳: native/I-29b(#113, #111·#92·#98·#96·#89 포함) + native/I-06b(#97, #93·#88 포함).
- 저장: `draft.savePayload`가 nil이면 "저장할 내용이 없어요", 던지면 "빌드 저장에 실패했어요", 아니면 `builds.save(..., custom: true)` → `router.closeDraft.openBuild(id)`. 두 번 눌림은 `saving`으로 막는다.
- 주의점: 검색 키보드가 본문을 밀지 않게 `.ignoresSafeArea(.keyboard)`. 드래그 경계는 본문 GeometryReader의 global minX + 왼쪽 폭.
