---
id: I-04b
title: 백업 형식
wave: W0
status: todo
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
- [ ] 직렬화(2칸 들여쓰기), 내보낼 때 정리된 빌드 목록으로 교체
- [ ] 파일 이름 = 로컬 날짜 `augment-lab-YYYY-MM-DD.alab`
- [ ] `parseBackup` 검증 7단계 + 오류 코드 enum
- [ ] 적용(파일 키 쓰기 → 빠진 키 지우기 → 저장소 다시 불러오기), 초기화
- [ ] 테스트: `check-backup.ts` 항목 전부

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-04b` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
