---
id: I-41-04
title: 마이페이지·데이터 관리 행
wave: W3
status: todo
depends: I-41
owns: native/ios/AugmentLab/Features/MyPage/, native/ios/AugmentLab/Features/DataManage/
spec: mypage.md
rn: src/features/mypage/**
---

# I-41-04 마이페이지·데이터 관리 행

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
행 오른쪽 값(앱 버전·패치)과 쉐브론이 RN보다 흐리다(RN은 값 흰색·쉐브론 밝음). 테마·언어 행은 행 오른쪽 값만 눌러야 메뉴가 열린다(RN은 행 전체). 데이터 관리 제목이 RN은 가운데, 네이티브는 왼쪽.

## 체크리스트
- [ ] 값·쉐브론 색을 RN 토큰과 같게
- [ ] 테마·언어 행 어디를 눌러도 메뉴가 열림
- [ ] 데이터 관리 내비 제목 가운데

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-41-04` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 마이페이지 값·쉐브론 밝기가 RN과 같다
- [ ] 행 아무 데나 눌러도 메뉴가 뜬다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
