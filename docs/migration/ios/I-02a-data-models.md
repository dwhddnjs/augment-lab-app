---
id: I-02a
title: 데이터 모델·로더·URL
wave: W0
status: done
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
- [x] Codable 모델: Augment·Rarity, Champion·ChampionStats(20), ChampionSpells, Item(gold·stats), HeadlinerTexts, TierlistFile·TierRow(augments 튜플 배열), TierItem, Version
- [x] `AppLocale` (ko/en)
- [x] `GameData`
    - 현재 로케일 파일만 읽는다(앱: 번들 `Data/`, 테스트: 저장소 경로). 로케일이 바뀌면 다시 읽는다.
    - 인덱스: byId, aramPool, aramItemIds Set, itemPool, tierItemsById
- [x] `augmentName(_:transmuted:)` 접두사, `resolveIds`
- [x] DDragon·CDragon URL 빌더 전부, 로컬 증강 아이콘 10개 매핑, `augmentImageUrls` 체인
- [x] `championTags` 순서와 ko/en 라벨
- [x] 테스트: 로더 결과를 원본 JSON에서 따로 다시 계산한 값과 비교 + URL 빌더 골든 값. (데이터 스냅샷 검사는 바꿈 — 진행 기록 참고) 기대값은 RN 함수를 `npx tsx -e`로 직접 실행해 뽑은 골든 값으로 비교한다(손으로 계산하지 않는다).

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-02a` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-02a 완료
- **브랜치**: I-00(#76)이 아직 머지되지 않은 상태에서 사용자 지시("계속 작업해")로 `native/I-00` 위에 쌓았다. **#76을 먼저 머지해야** 이 PR의 diff가 깔끔해진다.
  - `status.sh diff`는 dev와 비교하므로 지금은 I-00 파일까지 잡힌다. `git diff --name-only native/I-00`으로 확인하니 변경 9개가 전부 `Data/` 안이다.
- **만든 API** (다음 작업용)
  - `AppLocale`(.ko/.en) — I-03은 이 타입을 쓴다(새로 만들지 않는다)
  - `GameData(locale:url:)` / `GameData.bundled(locale:)`
    - 전체 목록·byId: `augments`, `champions`(+`championsByKey`), `items`
    - 칼바람 풀: `augmentPool`, `itemPool`
    - 그 밖: `championSpells`, `headlinerTexts`, `tierlist`, `tierItemsById`, `version`, `cdn`
    - `displayName(_:)` — 전환 접두사
  - `GameDataStore`(@Observable): `data`, `setLocale(_:)` — 실패하면 지금 데이터를 유지한다
  - `resolveIds(_:in:)` — 사라진 id는 버린다
  - `CDN`
    - 인스턴스(버전 필요): `championSquareURL`, `itemImageURL`, `spellImageURL`
    - static: `championSplashURL`, `championCenteredURL`, `cdragonIconURL`, `augmentImageURLs`(large → base → small, 로컬 아이콘이면 `[]`), `localAugmentIcon`(→ 에셋 이름 `augments-<이름>`), `championClassIconURL`
  - `championTags`, `championTagLabel(_:_:)`
  - 모듈 내부 `regexReplace(_:_:_:ignoreCase:)` — JS `replace(/…/g, '$1')`와 같다. I-02b가 텍스트 정리에 그대로 쓴다.
  - 테스트 도우미 `RepoData.gameData(_:)` / `RepoData.raw(_:)` — 다른 영역 테스트가 저장소 JSON을 읽을 때 쓴다(파일 목록은 I-00의 `data-files.xcfilelist`)
- **모델 결정**
  - `Item.stats`는 `[String: Double]`이다. RN에서도 맵으로 순회해서 이렇게 했고, I-02c는 키 문자열로 접근한다.
  - `HeadlinerTexts`의 키는 String이다. 헤드라이너 ID 타입은 I-12a가 정한다.
  - `Tier` enum은 `TierRow` 디코딩에 필요해서 여기에 두었다. I-02d가 이걸 쓴다.
- **바꾼 판단**: 개수 스냅샷(323/233/90)·설명 길이 같은 **데이터 내용 검사는 Swift로 복제하지 않았다**.
  - 이유: 패치 때마다 Node 스크립트와 Swift 테스트 두 곳을 고쳐야 해서.
  - 데이터 내용은 지금처럼 `scripts/check-augment-data.mjs`가 지킨다.
  - Swift 테스트는 로더가 RN 훅과 같은 결과를 내는지 본다(풀 필터·아이템 순서·ko/en 정렬·티어 join).
- **확인**: `make -C native/ios test` 16개 통과(2 suites), `make -C native/ios build` 통과(경고 0)
