---
id: I-04a
title: 빌드 저장소
wave: W0
status: todo
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
- [ ] `SavedBuild` + 쓸 때 선택 필드 생략. **모르는 필드 보존**: 원본 JSON 딕셔너리를 함께 들고 있다가 쓸 때 병합한다.
- [ ] `parseBuildHeadliner`, `parseBuilds` 규칙 그대로
- [ ] `generateId()`(base36 시간-랜덤 6자), ISO createdAt, 내림차순 정렬
- [ ] `@Observable BuildStore`: 캐시(null = 로드 전), `readFailed`, `readForWrite`, save·remove 낙관적 갱신 + 실패 시 롤백, reload, get
- [ ] 디스크: 앱 지원 폴더의 `builds:v1` 파일(원자적 쓰기)
- [ ] 테스트: `check-build-storage.ts` 항목 전부(실패 주입 저장소 사용)

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-04a` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
