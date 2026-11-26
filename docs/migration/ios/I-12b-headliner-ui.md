---
id: I-12b
title: 헤드라이너 공용 UI
wave: W1
status: todo
depends: I-01, I-02b, I-12a
owns: native/ios/AugmentLab/UI/Headliner/
spec: design-system.md §2.9·§6·§7, aram.md §2.1
rn: src/features/headliners/{assets.ts,components/*}, src/components/ui/detail-card-row.tsx
---

# I-12b 헤드라이너 공용 UI

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
빌드 상세·드래프트·아이템 선택이 함께 쓰는 헤드라이너 조각을 만든다.

## 체크리스트
- [x] `HeadlinerAssets`(로고·잉크 메타)
- [x] `HeadlinerLogo`(plain·light·흰 로고 틴트 규칙)
- [x] `SkillIcon`
- [ ] `MarkedText`(색 키 → StatTextColors·SkillCardColors)
- [ ] `DetailCardRow`
- [ ] `HeadlinerSummary`(+compact)

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-12b` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 13종 로고가 잉크 기준으로 정렬돼 보인다
- [ ] 라이트 모드에서 흰 로고가 틴트된다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
