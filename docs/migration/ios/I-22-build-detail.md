---
id: I-22
title: 빌드 상세
wave: W2
status: done
depends: I-04a, I-11, I-12b, I-13
owns: native/ios/AugmentLab/Features/BuildDetail/
spec: home-builds.md §4, design-system.md §3.8, storage.md §6
rn: src/features/builds/screens/build-detail-screen.tsx, src/features/builds/components/{build-augment-list,build-champion-header,build-item-row}.tsx, src/lib/review.ts
---

# I-22 빌드 상세

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
빌드 상세 화면과 리뷰 요청을 만든다.

## 체크리스트
- [x] 배너: 높이 보간, 당기면 확대, 그라데이션 6단
- [x] 투명 헤더 → glass 배경·제목 페이드(124.2~220.8)
- [x] 시트: 겹침 24, 모서리 24, 구성 5블록
- [x] 휴지통(확인 → 삭제 완료 → 뒤로)
- [x] `saved`면 1초 뒤 리뷰 요청(조건 3개, 평생 1회)
- [x] 없는 빌드 안내

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-22` → 소유 경로 밖 변경 없음 (의존 PR들 위에 쌓아서 지금은 그 파일이 함께 잡힌다. 쌓은 브랜치 대비로는 `Features/BuildDetail/`와 이 파일만)
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 스크롤 접힘·확대가 RN과 같은 속도로 따라온다
- [ ] 전환 증강에 '전환:' 접두사
- [ ] 삭제 후 목록에서 사라진다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- 리뷰 키 `review:requested`는 `UserDefaultsStore()`(설정과 같은 저장소)에 둔다. I-04c 이관이 이 키를 같은 곳으로 옮기는지 확인 필요(storage.md §1 표엔 백업 제외 키로만 나온다).
- 스텁 계약 밖 의존: 화면이 `Router`(I-06a) 환경을 쓰므로 I-06a(#93)도 쌓았다 → `depends`에 I-06a 추가 후보.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 완료
- 한 일: `Features/BuildDetail/` — I-06a 스텁 `BuildDetailScreen(id:saved:)`을 채웠다. 배너(스플래시 300, scrollY [-140,0,276] → [440,300,0], `surface.base` 6단 그라데이션), 투명 내비게이션 바 + 접힘 [124.2, 220.8]에서 GlassSurface 배경·제목(17/28/600) 페이드, 시트(겹침 24, 위 모서리 24 continuous, 위·좌·우 hairline, padding 24/16, gap 32, 5블록), 휴지통 → 확인 → `BuildStore.remove` → `router.back()`, 없는 빌드 안내(cards-outline 56). `BuildDetailSections.swift`(BuildChampionHeader·BuildAugmentList·BuildItemRow), `ReviewRequest.swift`. `make build` 통과(경고 0).
- 기반: #88(I-04a)·#93(I-06a)·#96(I-11, #89 포함)·#90(I-12b)·#98(I-13) 위에 쌓았다. 그 PR들이 먼저 머지돼야 diff가 I-22 것만 남는다.
- 주의점
  - 스크롤 값은 `onGeometryChange`(iOS 16+ 역배포)로 콘텐츠 minY를 ScrollView 좌표계에서 읽는다(`onScrollGeometryChange`는 18+). 화면 전체가 `ignoresSafeArea(.top)`이라 RN처럼 콘텐츠가 화면 맨 위(0)에서 시작한다. 헤더 glass 높이는 바깥 GeometryReader의 `safeAreaInsets.top`(상태 표시줄 + 바).
  - RN처럼 빌드를 처음 한 번 읽어 `@State`에 둔다 → 삭제 후 뒤로 가는 동안 "없음"으로 깜빡이지 않는다.
  - 시트 아래 변 hairline은 그리지 않는다(stroke를 아래로 밀고 clip). RN `borderBottomWidth` 없음과 같다.
  - 날짜: `toLocaleDateString('ko-KR'|'en-US')` = 템플릿 yMd → "2026. 11. 27." / "11/27/2026".
  - 리뷰: SwiftUI `\.requestReview`. iOS는 `isAvailableAsync`가 늘 true라 그 단계는 없다. 1초 타이머는 `.task`라 화면을 떠나면 취소된다.
- 사용자 볼 것: 내 빌드 → 카드 → 상세. 스크롤 접힘·당김 확대 속도, 전환 증강 "전환:" 접두사, 휴지통 삭제 후 목록에서 사라지는지, 드래프트 저장 직후(2개째) 리뷰 창.
