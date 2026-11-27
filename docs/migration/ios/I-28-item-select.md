---
id: I-28
title: 아이템 선택
wave: W2
status: done
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
- [x] 파라미터 방어 파싱, 가로 준비 가드(한 번 준비되면 유지)
- [x] 헤더(X·제목·n/6·✓)
- [x] 필터 바 + 8열 그리드 + 슬롯 트레이(6)
- [x] 상세 패널(챔피언·스탯·헤드라이너 compact·증강 카드)
- [x] 저장(0개 허용, 실패 알림, alive 확인, `openBuild`), 나가기 확인, 스텁의 임시 버튼 제거
- [x] 진입 시 아이템 아이콘 prefetch

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-28` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 저장 → 세로 빌드 상세(회전 1회)
- [ ] 6개 제한
- [ ] 스탯 패널 실시간 변화

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · wip (5시간 한도 98%에서 멈춤)
- 마친 줄: 체크리스트 6줄 전부 구현 + `make build` 통과(경고 0). I-06a 스텁 `ItemSelectScreen(params:)`을 채우고 임시 버튼을 지웠다. `ItemSelectParts.swift`(ItemGrid·ItemSlotTray·ItemDetailPanel·ItemAugmentCard).
- 진행 중이던 줄: 없음. 남은 것은 완료 기준 2줄(`status.sh diff` 확인 → frontmatter `status: done`)과 PR.
- 다음에 할 첫 행동: 이 워크트리에서 `git diff --name-only origin/native/I-06b..HEAD`로 owns 밖 변경이 없는지 확인 → `status: done` → `gh pr create --base dev`(본문에 #97·#96·#90·#98 위에 쌓았다고 적기).
- 기반: #97(I-06b, #93·#88 포함)·#96(I-11, #89 포함)·#90(I-12b)·#98(I-13) 위에 쌓았다.
- 주의점
  - 파라미터 방어 파싱은 I-06a `Route(url:)`이 이미 한다(깨진 picked → [], headliner → nil). 화면은 `ItemSelectParams`만 받는다.
  - 가로 준비 가드: GeometryReader에서 가로 + (좌 inset > 0 또는 아래 inset 0)이면 `ready = true`, 0.5초 상한. 한 번 true면 유지.
  - 저장은 `BuildStore.save`가 동기라 RN `useAlive` 확인이 필요 없다. `mode`는 GameMode가 aram뿐이라 save에 인자가 없다.
  - 점선 빈 칸은 dash [3, 3] 근사(`ponytail:` 표시).
  - prefetch는 `SDWebImagePrefetcher.prefetchURLs`(RN `Image.prefetch(urls)`와 같은 일괄 받기).

### 2026-11-27 · 완료 (세션 5d가 c1의 wip를 이어받음)
- 코드는 바꾸지 않았다. 다시 빌드해 통과를 확인했다(I-06a 캐시를 `DERIVED=`로 재사용).
- 이 작업 고유의 변경(`f17dada`)은 `Features/ItemSelect/` 두 파일과 이 작업 파일뿐이다. `status.sh diff`의 나머지 항목은 의존 브랜치 몫이다.
- **머지 순서**: #97(I-06b), #96(I-11), #90(I-12b), #98(I-13)이 머지된 뒤 이 PR을 머지한다.
