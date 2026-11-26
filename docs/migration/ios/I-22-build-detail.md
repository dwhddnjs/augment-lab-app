---
id: I-22
title: 빌드 상세
wave: W2
status: todo
depends: I-04a, I-11, I-12b, I-13
owns: native/ios/AugmentLab/Features/BuildDetail/
spec: home-builds.md §4, design-system.md §3.8, storage.md §6
rn: src/features/builds/screens/build-detail-screen.tsx, src/features/builds/components/{build-augment-list,build-champion-header,build-item-row}.tsx, src/lib/review.ts
---

# I-22 빌드 상세

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
빌드 상세 화면과 리뷰 요청을 만든다.

## 체크리스트
- [x] 배너: 높이 보간, 당기면 확대, 그라데이션 6단
- [x] 투명 헤더 → glass 배경·제목 페이드(124.2~220.8)
- [x] 시트: 겹침 24, 모서리 24, 구성 5블록
- [x] 휴지통(확인 → 삭제 완료 → 뒤로)
- [x] `saved`면 1초 뒤 리뷰 요청(조건 3개, 평생 1회)
- [x] 없는 빌드 안내

## 완료 기준
- [x] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-22` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 스크롤 접힘·확대가 RN과 같은 속도로 따라온다
- [ ] 전환 증강에 '전환:' 접두사
- [ ] 삭제 후 목록에서 사라진다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
