---
id: I-33
title: 데이터 관리
wave: W2
status: todo
depends: I-04b, I-06a, I-15
owns: native/ios/AugmentLab/Features/DataManage/
spec: mypage.md §2, storage.md §3
rn: src/features/mypage/screens/data-manage-screen.tsx, src/lib/backup.ts
---

# I-33 데이터 관리

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
백업·복원·초기화 UI를 만든다.

## 체크리스트
- [ ] 백업: 캐시 폴더에 쓰기 → 공유 시트
- [ ] 복원: fileImporter(필터 없음) → parse → 개수 확인 → 적용 → 다시 불러오기, 오류 코드별 알림
- [ ] 초기화(destructive 확인)
- [ ] busy 가드(적용 끝까지)

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-33` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] RN 1.6.2에서 만든 .alab 파일이 네이티브 앱에서 복원된다
- [ ] 네이티브에서 만든 .alab이 RN 앱에서도 복원된다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
