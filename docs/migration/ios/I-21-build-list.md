---
id: I-21
title: 내 빌드
wave: W2
status: todo
depends: I-06a, I-14
owns: native/ios/AugmentLab/Features/BuildList/
spec: home-builds.md §3
rn: src/features/builds/screens/build-list-screen.tsx, src/features/builds/components/build-filter-bar.tsx
---

# I-21 내 빌드

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
내 빌드 목록과 필터를 만든다.

## 체크리스트
- [ ] 2열 그리드(폭 공식), 세그먼트 필터 4종(빌드 있을 때만)
- [ ] 빈 상태 2종
- [ ] 누르기·길게 눌러 삭제

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-21` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 필터 4종 결과가 RN과 같다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
