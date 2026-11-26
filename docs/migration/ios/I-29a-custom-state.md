---
id: I-29a
title: 커스텀 상태 로직
wave: W2
status: done
depends: I-02a, I-02b
owns: native/ios/AugmentCore/Sources/AugmentCore/Custom/, native/ios/AugmentCore/Tests/AugmentCoreTests/Custom/
spec: custom.md §3
rn: src/features/custom/hooks/use-custom-draft.ts
---

# I-29a 커스텀 상태 로직

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
커스텀 화면의 상태와 규칙을 UI 없이 만든다.

## 체크리스트
- [x] 필터(티어 + matchName), 정렬 3종(`RARITY_RANK` → 이름)
- [x] `toggleTarget`(질의 비움), `add`/`addItem` 결과 3종(이전 값 기준 판정), 한도 5/6, 제거, `clear`, `setChampionId`(담은 것 유지)
- [x] 저장 검증과 저장 페이로드
- [x] 테스트: 빠른 연타(연속 add) 시 한도·중복이 정확한지

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-29a` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `AugmentCore/Custom/CustomDraft.swift` — `@Observable CustomDraft(data:championId:)`
  - 상태: `championId`(바꿔도 담은 것 유지), `target`, `tier`, `itemFilter`(기본 `ItemFilter.all[0]` = 전체), `query`, `sort`(.default/.name/.rarity), `quickMode`, `picked`, `items`, `data`(로케일 바뀌면 화면이 새로 넣는다)
  - 계산: `champion`, `list`, `itemList`, `pickedIds`, `itemIds`, `savePayload`
  - 동작: `toggleTarget()`, `add(_:)`/`addItem(_:)` → `.added/.duplicate/.full`, `remove(_:)`, `removeItem(_:)`, `clear()`
- 검증: `make test`·`make build` 통과. 정렬(ko·en × 이름/티어/희귀도+검색)과 아이템 필터+검색 결과를 RN 식(tsx)과 비교 → 전부 일치. 연타(같은 것 3번, 정원 초과 7번) 테스트 포함.
- 주의점
  - Swift는 상태를 바로 바꾸므로 RN의 "스냅샷 반환 + prev 갱신" 이중 판정이 필요 없다. 반환값도 실제 결과 기준이라 RN보다 정확하다(연타 두 번째는 `duplicate`).
  - 이름 정렬은 `String.compare(_:locale:)` + 안정 정렬. ko·en 모두 JS `localeCompare` 결과와 같았다.
  - 저장 중 플래그(`saving`)·`saveBuild` 호출·`openBuild` 이동·나간 뒤 이동 막기는 화면(I-29d) 몫. `savePayload == nil`이면 "저장할 내용이 없어요", 저장이 throw하면 실패 문구.
  - `SavePayload` → I-04a `BuildStore.save(championId:augmentIds:itemIds:transmutedIds: [], headliner: nil, custom: true)`로 넘기면 된다.
- 사용자가 볼 것: 없음(단위 테스트로 검증). 화면은 I-29b~d.

