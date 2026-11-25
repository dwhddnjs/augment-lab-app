---
id: I-02a
title: 데이터 모델·로더·URL
wave: W0
status: todo
depends: I-00
owns: native/ios/AugmentCore/Sources/AugmentCore/Data/, native/ios/AugmentCore/Tests/AugmentCoreTests/Data/
spec: data.md §1·§2·§3·§8
rn: src/features/*/hooks/use-*.ts, src/features/*/types.ts, src/lib/ddragon.ts, src/lib/arrays.ts, src/lib/i18n.ts, src/lib/version.json, scripts/check-augment-data.mjs
---

# I-02a 데이터 모델·로더·URL

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
번들 JSON을 읽는 모델과 조회 API를 만든다. 모든 화면이 이걸 쓴다.

## 체크리스트
- [ ] Codable 모델: Augment·Rarity, Champion·ChampionStats(20), ChampionSpells, Item(gold·stats), HeadlinerTexts, TierlistFile·TierRow(augments 튜플 배열), TierItem, Version
- [ ] `AppLocale` (ko/en)
- [ ] `GameData`
    - 현재 로케일 파일만 읽는다(앱: 번들 `Data/`, 테스트: 저장소 경로). 로케일이 바뀌면 다시 읽는다.
    - 인덱스: byId, aramPool, aramItemIds Set, itemPool, tierItemsById
- [ ] `augmentName(_:transmuted:)` 접두사, `resolveIds`
- [ ] DDragon·CDragon URL 빌더 전부, 로컬 증강 아이콘 10개 매핑, `augmentImageUrls` 체인
- [ ] `championTags` 순서와 ko/en 라벨
- [ ] 테스트: `check-augment-data.mjs`의 항목 전부 + URL 빌더 예시. 기대값은 RN 함수를 `npx tsx -e`로 직접 실행해 뽑은 골든 값으로 비교한다(손으로 계산하지 않는다).

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-02a` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
