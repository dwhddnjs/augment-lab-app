---
id: I-25b
title: 칼바람 화면 조립
wave: W2
status: todo
depends: I-06b, I-10, I-24, I-25a, I-26, I-27
owns: native/ios/AugmentLab/Features/Aram/Screen/
spec: aram.md §1·§3
rn: src/features/aram/screens/aram-screen.tsx, src/features/aram/components/round-indicator.tsx, src/hooks/use-landscape-size.ts
---

# I-25b 칼바람 화면 조립

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
엔진·카드·연출·서랍을 붙여 드래프트를 완성한다.

## 체크리스트
- [ ] 파라미터 검증(헤드라이너 무작위 폴백)
- [ ] 헤더: X(종료 확인), 로고 + 라운드 pill(펜타킬 "스킬 강화"), 목록 버튼
- [ ] 등장 연출 → 카드 마운트, busy 가드
- [ ] 마지막 라운드: 고른 카드 그대로 멈춘 채 아이템 화면으로(쌓기)
- [ ] 현재 카드·펜타킬 스펠 prefetch
- [ ] 스텁의 임시 버튼 제거

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-25b` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 13종 헤드라이너로 한 판씩: 라운드 수·카드 수·스티커·스킬 선택
- [ ] 리롤 1회 제한
- [ ] 종료 확인 → 홈 세로

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
