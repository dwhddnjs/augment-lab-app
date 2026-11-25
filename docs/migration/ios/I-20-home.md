---
id: I-20
title: 홈
wave: W2
status: todo
depends: I-06a, I-12b, I-14, I-15
owns: native/ios/AugmentLab/Features/Home/
spec: home-builds.md §1
rn: src/features/builds/screens/home-screen.tsx, src/features/builds/components/{start-card,empty-build-card}.tsx, src/app/(tabs)/(home)/index.tsx
---

# I-20 홈

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
홈 화면을 완성한다. TopTierSection은 스텁을 그대로 끼워 둔다(I-30이 채운다).

## 체크리스트
- [ ] StartCard: 무대 조명 4겹, 타일 순서(`DRAFT_EVENT_IDS` → `LINEUP`), 연타 방지
- [ ] 최근 빌드 캐러셀(최대 8, 폭 148), 길게 눌러 삭제, 전체 보기
- [ ] EmptyBuildCard → 모드 선택
- [ ] TopTierSection 자리

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-20` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 타일을 누르면 챔피언 시트가 열리고 헤드라이너가 넘어간다
- [ ] 빈 상태·빌드 있는 상태 모두 RN과 같다
- [ ] 큰 제목 접힘

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
