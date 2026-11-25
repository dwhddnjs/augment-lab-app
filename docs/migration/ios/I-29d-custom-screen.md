---
id: I-29d
title: 커스텀 화면 조립
wave: W2
status: todo
depends: I-06b, I-10, I-29b, I-29c
owns: native/ios/AugmentLab/Features/Custom/Screen/
spec: custom.md §1·§2, design-system.md §3.6
rn: src/features/custom/screens/custom-screen.tsx, src/features/custom/components/{augment-search-field,pick-target-toggle,custom-settings-drawer}.tsx
---

# I-29d 커스텀 화면 조립

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
커스텀을 완성한다.

## 체크리스트
- [ ] 가로 준비 가드, 6.5:4.5 배치
- [ ] 헤더: X(확인), 검색 필드, `PickTargetToggle`(180ms·햅틱), ✓, ⚙
- [ ] 설정 서랍(스와이프 끔): 빠른 모드, 정렬
- [ ] 저장(검증 알림 → `openBuild`)
- [ ] 스텁의 임시 버튼 제거

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-29d` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 증강 1개 담고 저장 → 최근 빌드 맨 앞
- [ ] 토글 노브 움직임
- [ ] 드래그 중 서랍이 열리지 않는다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
