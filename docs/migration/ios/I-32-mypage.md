---
id: I-32
title: 마이페이지
wave: W2
status: todo
depends: I-03, I-06a, I-15
owns: native/ios/AugmentLab/Features/MyPage/
spec: mypage.md §1
rn: src/features/mypage/screens/mypage-screen.tsx
---

# I-32 마이페이지

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
설정 화면을 만든다.

## 체크리스트
- [ ] List insetGrouped 스타일
- [ ] 테마·언어 Picker
- [ ] 데이터 관리 행
- [ ] 정보: 버전·패치·GitHub(SFSafariViewController)·메일(RN 원본 주소)·Riot 고지

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-32` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 테마를 바꾸면 즉시 전체 반영
- [ ] 언어를 바꾸면 재시작 없이 전체 반영

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
