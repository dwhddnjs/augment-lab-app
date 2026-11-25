---
id: I-02d
title: 티어리스트 계산
wave: W0
status: done
depends: I-02a
owns: native/ios/AugmentCore/Sources/AugmentCore/Tierlist/, native/ios/AugmentCore/Tests/AugmentCoreTests/Tierlist/
spec: data.md §7·§8
rn: src/features/tierlist/tiers.ts, src/features/tierlist/hooks/use-augment-groups.ts, scripts/check-tierlist.ts
---

# I-02d 티어리스트 계산

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
티어 섹션과 증강 그룹 계산을 옮긴다.

## 체크리스트
- [x] `TIERS`, `augTierOf`, `pct`, `tierSections(match:)`, `findTierRow(key:)`
- [x] `augmentGroups(row:pool:)` — 희귀도 순서, 안정 정렬
- [x] 테스트: `check-tierlist.ts` 항목 전부

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-02d` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- **I-02c 후속**: `formatItemStats`의 `oneDecimal`(= `rounded()`)을 이 작업의 `jsToFixed(_:1)`로 바꾸면 반올림 동률까지 RN과 같아진다. 두 PR이 모두 머지된 뒤 한 줄만 고치면 된다(같은 모듈이라 호출만 하면 됨).

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-02d 완료
- **브랜치**: `native/I-02a` 위에 쌓았다(#76 → #77 → 이 PR).
- **만든 API** (`enum Tierlist`)
  - `augTier(_:)`, `pct(_:)`, `formatSource(_:_:)`
  - `sections(_:match:) -> [Section(tier, rows)]`, `findRow(_:key:)`
  - `augmentGroups(_:_:) -> [AugmentGroup(rarity, list: [TierAugment(augment, tier)])]`
- **JS 호환 `jsToFixed`** (모듈 내부)
  - JS `toFixed`는 이진 값의 정확한 십진 전개에서 반올림하고, 동률이면 큰 쪽을 고른다.
  - C `printf`는 동률을 짝수 쪽으로 보낸다(12.25 → JS "12.3", printf "12.2").
  - 픽률 데이터는 소수 넷째 자리라 실제로 걸릴 수 있다(0.1225 → "12.3%"). 그래서 정확한 전개(`%.80f`) 위에서 직접 반올림한다.
- **안정 정렬**: Swift `sorted`는 안정성을 보장하지 않는다. 그래서 그룹 정렬에 원래 위치를 함께 비교한다(같은 티어 안 승률순 유지).
- **확인**: `make -C native/ios test` 24개 통과(pct 골든 11개 + 동률 7개 + 원본 재계산 비교), iOS 빌드 통과
