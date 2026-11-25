---
id: I-02c
title: 아이템 스탯·필터 계산
wave: W0
status: done
depends: I-02a
owns: native/ios/AugmentCore/Sources/AugmentCore/Items/, native/ios/AugmentCore/Tests/AugmentCoreTests/Items/
spec: data.md §6
rn: src/features/items/stats.ts, src/features/items/item-filters.ts
---

# I-02c 아이템 스탯·필터 계산

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
빌드 상세·아이템 선택·커스텀이 함께 쓰는 아이템 계산을 옮긴다.

## 체크리스트
- [x] `computeStats(base, items)` — `{base, added, total}`, 규칙 표 그대로
- [x] `STAT_DISPLAY_ORDER`(핵심 13 + 추가), `STAT_LABELS`(라벨·단위·자릿수, ko/en)
- [x] `formatItemStats`
- [x] `ITEM_CATEGORIES` 오버라이드 32개 + 카테고리 판정 7종(79~208행 그대로) + `filter(category)`
- [x] 테스트: 챔피언 3명 × 아이템 조합 계산, 카테고리별 아이템 개수. 기대값은 RN 함수를 `npx tsx -e`로 직접 실행해 뽑은 골든 값으로 비교한다(손으로 계산하지 않는다).

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-02c` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-02c 완료
- **브랜치**: `native/I-02a`(스탯 키 순서 보강 c490760 포함) 위에 쌓았다. #76 → #77 → 이 PR 순서로 머지한다.
- **만든 API**
  - `StatKey` — `allCases` 순서가 곧 표시 순서. `.meta`에 라벨 ko/en·단위·core·소수 자릿수가 있다.
  - `computeStats(_ base: ChampionStats, _ items: [[String: Double]]) -> [StatKey: StatValue(base, added, total)]`
  - `formatItemStats(_ item: Item, _ locale:)` — 원본 키 순서 사용
  - `formatItemStats(_ stats:order:_:)`
  - `ItemFilter.all` — 8개, 표시 순서. `.matches(_:)`, `.label(_:)`, `.icon`(.mci / .classTag)
- **발견하고 고친 것**: RN 출력 순서가 JSON 키 순서에 달려 있어서, I-02a에 `Item.statOrder`를 보강했다(I-02a 진행 기록 참고).
- **확인**
  - 입력을 고정한 골든 값: 치명타 100% 상한, 이동 속도 flat·%, 0 값 제외, 모르는 키 제외, 신발·오버라이드 우선순위
  - 부동소수점이 RN과 끝자리까지 같다(합산 순서를 같게 했다).
  - `make -C native/ios test` 21개 통과(I-02b와는 별도 브랜치라 그 테스트는 빠짐), iOS 빌드 통과
