---
id: I-13
title: 아이템 공용 UI
wave: W1
status: done
depends: I-01, I-02c, I-05
owns: native/ios/AugmentLab/UI/Items/
spec: item-select.md §3, data.md §6
rn: src/features/items/components/{item-stat-panel,item-filter-bar,filter-icon}.tsx
---

# I-13 아이템 공용 UI

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
아이템 화면 3곳이 쓰는 패널과 필터 바를 만든다.

## 체크리스트
- [x] `ItemStatPanel`(핵심 13 + 0이 아닌 추가 스탯, base·added·total 표시)
- [x] `ItemFilterBar`(세로 44, 탭 8, 재탭 해제)
- [x] `FilterIcon`

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-13` → 소유 경로 밖 변경 없음 (I-05 위에 쌓아서 지금은 I-05 파일이 함께 잡힌다. `git diff origin/native/I-05..` 기준 I-13 파일만. #89 머지 후엔 깨끗)
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 스탯 패널 숫자가 RN과 같다(같은 챔피언·아이템으로 비교)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- AugmentCore `jsToFixed`(Tierlist.swift, I-02d)·`jsNumber`(ItemStats.swift, I-02c)가 `internal`이라 앱에서 못 쓴다 → `ItemStatPanel.swift`에 `private`로 베꼈다(`ponytail:` 표시). 둘을 `public`으로 바꾸면 복사본을 지운다.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 완료
- 한 일: `UI/Items/`에 `ItemStatPanel(baseStats:itemStats:)`(GlassSurface lg + 1pt `border.subtle`, 패딩 8+테두리 1, 행 caption 라벨 secondary / 값 primary + accent " (+추가분)", 공격 속도 추가분은 %), `ItemFilterBar(active:onChange:)`(폭 44, 탭 8, 아이콘 20, 점 4, 간격 3·12, hitSlop 10, 활성/전체 재탭 → nil), `FilterIcon(filter:color:size:)`(CDragon 역할 아이콘 template 틴트, 모르는 역할은 MCI sword). `make build` 통과(경고 0).
- 기반: I-05(PR #89) 위에 쌓았다. **#89를 먼저 머지**해야 diff가 I-13 것만 남는다.
- 주의점
  - 숫자 표기는 RN `formatNumber` 그대로: 0자리 `Math.round`(floor(x+0.5)), 나머지 `parseFloat(toFixed(d))`(정확한 십진 전개 반올림).
  - `ItemFilterBar.active`는 `ItemFilter?`(nil = 전체). RN `FilterKey | null`과 같다.
  - 필터 버튼에 VoiceOver 라벨(필터 이름)·선택 상태를 붙였다(RN엔 없음, 시각 변화 없음).
  - `formatNumber`·`jsToFixed`는 파일 `private` — 앱 모듈 전역 이름 충돌 방지.
- 사용자 볼 것: Xcode 프리뷰 `ItemStatPanel.swift`(징크스 + 3031·3006·3046 / 가렌 빈 빌드)를 RN 같은 조합과 숫자 비교, `ItemFilterBar.swift`(탭·재탭 해제).
