---
id: I-31
title: 티어리스트 챔피언 모달
wave: W2
status: todo
depends: I-02d, I-06a, I-11, I-15
owns: native/ios/AugmentLab/Features/Tierlist/Champion/
spec: tierlist.md §2, design-system.md §3.7
rn: src/features/tierlist/screens/tierlist-champion-screen.tsx, src/features/tierlist/components/*, src/features/tierlist/hooks/{use-staged-expand,use-scroll-top-anchor,use-tierlist-items}.ts
---

# I-31 티어리스트 챔피언 모달

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
챔피언 상세 모달을 만든다.

## 체크리스트
- [ ] 헤더, 증강 그룹(6개 미리보기 → 맨 위로 스크롤 → 50ms마다 12개씩 펼치기, FadeIn 220, 다시 접기)
- [ ] 스펠 pill, 빌드 순서·상황별 아이템
- [ ] 닫기: 뒤로 갈 곳이 없으면 티어리스트 탭
- [ ] 없음 안내

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-31` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 펼치기 중 스크롤이 튀지 않는다
- [ ] 딥링크로 열고 닫기

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
