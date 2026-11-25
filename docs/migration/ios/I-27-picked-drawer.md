---
id: I-27
title: 픽 현황 서랍
wave: W2
status: todo
depends: I-11, I-12b
owns: native/ios/AugmentLab/Features/Aram/Drawer/
spec: aram.md §3, design-system.md §3.10
rn: src/features/aram/components/{picked-drawer,champion-summary}.tsx
---

# I-27 픽 현황 서랍

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
오른쪽 서랍과 내용을 만든다.

## 체크리스트
- [ ] 서랍: 오른쪽 front, 폭 min(340, 38%), 스프링 수치, 딤 0.5, 가장자리 스와이프 규칙, 스와이프 허용 여부를 바깥에서 받음
- [ ] `ChampionSummary`, `HeadlinerSummary compact`, 3열 증강 그리드(`max(6, n)` 칸, "n/6")
- [ ] 라이트 모드 이름 색 규칙

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-27` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 열고 닫는 속도가 RN과 같다
- [ ] 가장자리 스와이프

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
