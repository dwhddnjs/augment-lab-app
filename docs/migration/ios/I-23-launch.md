---
id: I-23
title: 모드 선택·챔피언 선택
wave: W2
status: todo
depends: I-05, I-06b
owns: native/ios/AugmentLab/Features/Launch/
spec: launch.md, design-system.md §3.3
rn: src/components/navigation/mode-select-overlay.tsx, src/features/champions/**
---

# I-23 모드 선택·챔피언 선택

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
드래프트로 들어가는 두 화면을 만든다.

## 체크리스트
- [ ] 모드 선택 오버레이: 딤, 버튼 2개 시차 등장, 오버레이를 교체하며 시트 열기
- [ ] 챔피언 선택: 검색(초성), 스크롤 시 검색 취소·키보드 내림, 역할 칩(재탭 해제), 4열 그리드, ✓ 비활성 40%
- [ ] 시작: 연타 가드 → `Router.startDraft`
- [ ] 진입 시 챔피언·역할 아이콘 prefetch

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-23` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 초성 `ㅇㅌㄹㅅ` → 아트록스
- [ ] 버튼 등장 시차가 RN과 같다
- [ ] ✓ 누르면 가로 드래프트로 바로 전환된다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
