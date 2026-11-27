---
id: I-04a
title: 빌드 저장소
wave: W0
status: done
depends: I-02a, I-03
owns: native/ios/AugmentCore/Sources/AugmentCore/Storage/, native/ios/AugmentCore/Tests/AugmentCoreTests/Storage/
spec: storage.md §2
rn: src/lib/build-storage.ts, src/features/builds/hooks/use-builds.ts, scripts/check-build-storage.ts
---

# I-04a 빌드 저장소

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
SavedBuild 저장·조회를 RN과 똑같은 안전장치로 옮긴다.

## 체크리스트
- [x] `SavedBuild` + 쓸 때 선택 필드 생략. **모르는 필드 보존**: 원본 JSON 딕셔너리를 함께 들고 있다가 쓸 때 병합한다.
- [x] `parseBuildHeadliner`, `parseBuilds` 규칙 그대로
- [x] `generateId()`(base36 시간-랜덤 6자), ISO createdAt, 내림차순 정렬
- [x] `@Observable BuildStore`: 캐시(null = 로드 전), `readFailed`, `readForWrite`, save·remove 낙관적 갱신 + 실패 시 롤백, reload, get
- [x] 디스크: 앱 지원 폴더의 `builds:v1` 파일(원자적 쓰기)
- [x] 테스트: `check-build-storage.ts` 항목 전부(실패 주입 저장소 사용)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-04a` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `Storage/`에 `JSONValue`(느슨한 JSON 왕복), `SavedBuild`·`BuildHeadliner`·`GameMode`, `Builds.parse/stringify/sortedDesc/generateId/isoString`, `FileKeyValueStore`(키=파일, `.atomic` 쓰기, 기본 앱 지원 폴더), `@MainActor @Observable BuildStore`(builds nil=로드 전, readFailed, readForWrite, save·remove 낙관 갱신+롤백, reload, get).
- 테스트: `check-build-storage.ts` 1–10 전부 + 읽기 실패 시 쓰기 차단·모르는 필드 보존·선택 필드 생략·id/날짜 형식·파일 저장소(11개).
- 주의점
  - 저장소는 동기 API다(KeyValueStore가 동기, 파일이 작음). RN처럼 캐시 먼저 바꾸고 쓰고, 실패하면 되돌린 뒤 던진다.
  - 모르는 필드는 `extra`로 들고 있다가 쓸 때 병합한다. 배열(`augmentIds`·`itemIds`) 안의 비문자 원소는 문자열만 남겨 다음 저장에서 빠진다(깨진 데이터에서만 생김).
  - 쓸 때 JSON 키는 정렬 순서(RN은 삽입 순서 — 읽는 쪽은 순서를 보지 않음).
  - I-04b(백업): 원문은 `Builds.parse`·`Builds.stringify`, 적용 후 `BuildStore.reload()`. 들여쓰기 2칸 직렬화는 I-04b가 직접(JSONEncoder prettyPrinted는 `" : "` 형식이라 JS와 다름).
  - I-04c(이관): `FileKeyValueStore().set(BuildStore.key, …)`로 쓰면 된다.
- 사용자가 볼 것: 없음(단위 테스트로 검증).
