---
id: I-25a
title: 칼바람 카드·애니메이션
wave: W2
status: todo
depends: I-11, I-12b
owns: native/ios/AugmentLab/Features/Aram/Cards/
spec: aram.md §3·§4, design-system.md §2.5·§3.5
rn: src/components/ui/{pick-card,reroll-button}.tsx, src/hooks/use-card-pick-anim.ts, src/features/aram/components/{aram-card,skill-card,card-marks}.tsx
---

# I-25a 칼바람 카드·애니메이션

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
카드 한 장의 모양과 움직임을 완성한다. 엔진과는 값만 주고받는다(입력: 카드 데이터·상태, 출력: 탭·리롤 콜백).

## 체크리스트
- [x] `PickCard`: 뒤집기 등장(index×90), 페이드 등장, 선택·비선택·리롤 퇴장 수치 그대로, rotateY 0일 때만 탭
- [x] 선택 확정 380ms, 리롤 교체 220ms 타이밍 헬퍼
- [x] `RerollButton` + 해킹 점멸(1300ms 주기)
- [x] `AramCard`, `SkillCard`, `CardMarks`(KDA·Worlds 배지, 스티커)
- [ ] Preview: 카드 3장 행에서 등장·선택 재생

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-25a` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 뒤집기·선택 애니메이션이 RN과 같은 속도·궤적이다
- [ ] 해킹 점멸 주기
- [ ] 라이트 모드 리롤 아이콘

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
