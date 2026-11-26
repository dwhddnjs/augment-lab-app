---
id: I-14
title: 빌드 카드 공용
wave: W1
status: todo
depends: I-01, I-04a, I-05, I-12b
owns: native/ios/AugmentLab/UI/Builds/
spec: home-builds.md §2, design-system.md §4
rn: src/features/builds/components/build-card.tsx, src/features/builds/hooks/use-confirm-delete.ts, src/features/builds/utils/date.ts
---

# I-14 빌드 카드 공용

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
홈과 내 빌드가 함께 쓰는 빌드 카드를 만든다.

## 체크리스트
- [x] `BuildCard`(scrim 2종, 커스텀 accent, 눌림 0.92, 글로우 근사)
- [x] 삭제 확인 알림 헬퍼
- [x] `dayLabel`, `isWithinWeek`(로컬 자정 기준)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-14` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 카드를 RN과 나란히 비교(라이트·다크)
- [ ] 글로우(음수 spread 근사)가 눈에 띄게 다르지 않다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
