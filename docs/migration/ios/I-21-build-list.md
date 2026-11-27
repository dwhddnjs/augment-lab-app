---
id: I-21
title: 내 빌드
wave: W2
status: done
depends: I-06a, I-14
owns: native/ios/AugmentLab/Features/BuildList/
spec: home-builds.md §3
rn: src/features/builds/screens/build-list-screen.tsx, src/features/builds/components/build-filter-bar.tsx
---

# I-21 내 빌드

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
내 빌드 목록과 필터를 만든다.

## 체크리스트
- [x] 2열 그리드(폭 공식), 세그먼트 필터 4종(빌드 있을 때만)
- [x] 빈 상태 2종
- [x] 누르기·길게 눌러 삭제

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-21` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 필터 4종 결과가 RN과 같다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `BuildListScreen` — 2열 `LazyVGrid`(카드 폭 = (화면폭 − 2·16 − 12) / 2, 간격 12), 세그먼트 필터 4종(전체·최근 7일·프리즘·커스텀, 빌드가 있을 때만, 높이 32, tint accent), 빈 상태 2종(로딩 중 nil이면 아무것도 안 보임), 누르면 `router.push(.build(id:))`, 길게 누르면 I-14 `.confirmDeleteBuild`. 패딩 위 8·좌우 16·아래 탭 inset+16. 처음 열 때 `store.load()`.
- 필터 규칙: 최근 7일 = I-14 `BuildDate.isWithinWeek`, 프리즘 = 전체 증강(풀이 아니라 조회용 전체, RN `useAugments`) 중 prismatic id가 하나라도, 커스텀 = `custom`.
- 주의점: 필터 바는 RN에서 별도 컴포넌트지만 이 화면만 써서 파일 안에 뒀다. `#93`(I-06a) + `#102`(I-14) 위에 쌓았다.
- 사용자가 볼 것: 아래 **사용자 확인** + 큰 제목이 스크롤에 맞춰 접히는지.
