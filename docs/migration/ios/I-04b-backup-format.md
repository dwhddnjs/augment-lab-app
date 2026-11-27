---
id: I-04b
title: 백업 형식
wave: W0
status: done
depends: I-04a
owns: native/ios/AugmentCore/Sources/AugmentCore/Backup/, native/ios/AugmentCore/Tests/AugmentCoreTests/Backup/
spec: storage.md §3
rn: src/lib/backup.ts, src/lib/backup-format.ts, scripts/check-backup.ts
---

# I-04b 백업 형식

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
.alab 백업·복원·초기화의 순수 로직을 옮긴다. UI는 I-33.

## 체크리스트
- [x] 직렬화(2칸 들여쓰기), 내보낼 때 정리된 빌드 목록으로 교체
- [x] 파일 이름 = 로컬 날짜 `augment-lab-YYYY-MM-DD.alab`
- [x] `parseBackup` 검증 7단계 + 오류 코드 enum
- [x] 적용(파일 키 쓰기 → 빠진 키 지우기 → 저장소 다시 불러오기), 초기화
- [x] 테스트: `check-backup.ts` 항목 전부

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-04b` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `Backup/Backup.swift` — `Backup.keys`·`serialize`(RN `JSON.stringify(file, null, 2)`와 바이트 동일)·`fileName`(로컬 날짜)·`parse`(검증 7단계, `Backup.Failure` 6코드 = RN 오류 문자열), `BackupFile`, `@MainActor BackupStorage(buildFile:settingsStore:builds:settings:)` — `exportText(now:)`·`apply(_:)`·`reset()`.
- 테스트: `check-backup.ts` 1–5 전부 + RN 골든 직렬화 + 적용(교체·플래그 보존·저장소 재로드)·초기화·내보내기 정리(12종 거부 포함).
- 주의점
  - `native/I-04a`(#88) 위에 쌓았다. #88이 먼저 머지돼야 한다. 그 전에는 `status.sh diff I-04b`가 Storage/ 파일을 owns 밖으로 잡는다(I-04a 것).
  - 빌드는 파일 저장소(`FileKeyValueStore`), 테마·언어는 `UserDefaultsStore`에 있어서 `BackupStorage`가 키별로 나눠 쓴다. 앱 루트(I-06c/I-33)에서 같은 인스턴스를 넘길 것.
  - 내보내기의 빌드 정리는 RN의 `listBuilds()` 캐시 대신 방금 읽은 원문을 같은 규칙(parse→정렬)으로 정리한다. 정상일 때 결과가 같고, 지난 읽기 실패로 캐시가 비어 있어도 빈 목록을 내보내지 않는다.
  - 파일 쓰기·공유 시트·파일 선택기는 UI(I-33) 몫이다. `Backup.fileName(Date())`으로 이름을 정하고 캐시 폴더에 덮어쓴다.
- 사용자가 볼 것: 없음(단위 테스트로 검증).
