---
id: I-28
title: 아이템 선택
wave: W2
status: todo
depends: I-04a, I-06b, I-11, I-12b, I-13
owns: native/ios/AugmentLab/Features/ItemSelect/
spec: item-select.md
rn: src/features/items/screens/item-select-screen.tsx, src/features/items/hooks/use-item-select.ts, src/features/items/components/{item-grid,item-slot-grid,item-detail-panel,augment-card}.tsx
---

# I-28 아이템 선택

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
아이템 선택과 빌드 저장을 완성한다.

## 체크리스트
- [ ] 파라미터 방어 파싱, 가로 준비 가드(한 번 준비되면 유지)
- [ ] 헤더(X·제목·n/6·✓)
- [ ] 필터 바 + 8열 그리드 + 슬롯 트레이(6)
- [ ] 상세 패널(챔피언·스탯·헤드라이너 compact·증강 카드)
- [ ] 저장(0개 허용, 실패 알림, alive 확인, `openBuild`), 나가기 확인, 스텁의 임시 버튼 제거
- [ ] 진입 시 아이템 아이콘 prefetch

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-28` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 저장 → 세로 빌드 상세(회전 1회)
- [ ] 6개 제한
- [ ] 스탯 패널 실시간 변화

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
