---
id: I-26
title: 헤드라이너 등장 연출
wave: W2
status: todo
depends: I-12b
owns: native/ios/AugmentLab/Features/Aram/Reveal/
spec: design-system.md §3.4
rn: src/features/aram/components/headliner-reveal.tsx
---

# I-26 헤드라이너 등장 연출

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
드래프트 시작 연출을 수치 그대로 옮긴다.

## 체크리스트
- [ ] 무대, wash, 로고(+aura, heartsteel 0.78), 세로선, 문구 3줄 지연
- [ ] 2600ms 자동 닫기, 탭으로 건너뛰기, 300ms 페이드 → `onDone`
- [ ] Reduce Motion 무시

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-26` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 13종 모두 RN과 같은 타이밍으로 나타난다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
