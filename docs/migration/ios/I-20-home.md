---
id: I-20
title: 홈
wave: W2
status: done
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
- [x] StartCard: 무대 조명 4겹, 타일 순서(`DRAFT_EVENT_IDS` → `LINEUP`), 연타 방지
- [x] 최근 빌드 캐러셀(최대 8, 폭 148), 길게 눌러 삭제, 전체 보기
- [x] EmptyBuildCard → 모드 선택
- [x] TopTierSection 자리

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-20` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 타일을 누르면 챔피언 시트가 열리고 헤드라이너가 넘어간다
- [ ] 빈 상태·빌드 있는 상태 모두 RN과 같다
- [ ] 큰 제목 접힘

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- 없음. 눌림 0.7은 I-10의 공용 `PressedOpacityStyle`을 썼다.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · wip (한도 95%로 중단 — 코드는 아직 없음)
- 마친 줄: 없음. 진행 중이던 줄: StartCard(조사 끝, 코드 작성 전).
- 스택: `native/I-06a`(#93) + `native/I-14`(#102, #88·#89·#96·#90 포함)를 merge해 둠.
- 다음에 할 첫 행동: `Features/Home/HomeScreen.swift`에 아래 설계대로 작성 → `make -C native/ios build`.
- 설계 메모(RN `home-screen.tsx`·`start-card.tsx`·`empty-build-card.tsx` 읽음)
  - Home: ScrollView 루트, VStack spacing 28(five−one), 패딩 위 8·좌우 16·아래 `bottomTabInset`+24, bg surface.base. 순서 StartCard → 최근 빌드 → `TopTierSection()`(I-30 스텁 그대로).
  - 최근 빌드: 머리 HStack(firstTextBaseline) heading 800 "최근 빌드"/"Recent Builds" + 빌드 있을 때 `MoreLink("전체 보기"/"See All") { router.push(.builds) }`. 최대 8개 `BuildCard(width: 148)` 가로 스크롤(바깥 −16 좌우·−16 아래, 안쪽 패딩 16 좌우·16 아래, gap 12). 길게 누르면 `deleting = b` + `.confirmDeleteBuild($deleting)`. `store.builds != nil && 비었음` → EmptyBuildCard(148, 높이 = 148/`BuildCard.aspect`(0.7), radius xl, 1pt 점선 `border.strong`, bg surface.raised, MCI plus 28 tertiary + caption tertiary 가운데 "빌드를 완료하면\n여기에 쌓여요", gap 8, padding 16, 눌림 0.7) → `router.showModeSelect()`. 처음에 `store.load()`.
  - 연타 방지: `guard router.sheet == nil` (presentChampionSelect가 sheet를 동기로 세팅) → `router.presentChampionSelect(.aram, headliner: id)`.
  - StartCard: radius xxl continuous clip, padding 18(좌우·아래)/12(위), gap 8, bg `HeroOverlay.cardBase`, hairline `HeroOverlay.tileBorder`. 제목 16/24 800 `HeroOverlay.textPrimary` "헤드라이너 선택"/"Choose a headliner". 무대 조명 = LINEUP 앞 4개(kda·pentakill·heartsteel·command-line) 색 + `StageAlpha.light`, CSS `radial-gradient(34% 70% at x% -14%)`, x = 13/38/63/88(JS Math.round). SwiftUI는 RadialGradient(endRadius rx) + scaleEffect(y: ry/rx) + position으로 타원 재현.
  - LINEUP = `HeadlinerId.allCases` 중 `HeadlinerRules.draftEventIds`에 든 것 → 나머지(각각 원래 순서). 가로 ScrollView(바깥 −18, 안쪽 18, gap 8).
  - Tile 96×92, radius lg continuous, hairline tileBorder, bg `Palette.dark.glassFill`, 안쪽 radial(circle at 50% 30%, C+`StageAlpha.wash` 0%, C00 70%) — CSS circle 기본 크기는 farthest-corner(√(48²+64.4²)≈80.3)라 endRadius ≈ 0.7×80.3. art 칸 높이 40, 로고 `HeadlinerAssets.logo(id)`의 `small ?? asset`, 폭 = min(logoBoxHeight(id, 40)×aspect, 96−12), 높이 = 폭/aspect, fit. 이름 11/14 600 헤드라이너 색 1줄. gap 8, 좌우 패딩 4, 눌림 0.7, a11y "{name}(으)로 시작"/"Start with {name}". 이름은 `gameData.data.headlinerTexts.headliners[id.rawValue]?.name`.

### 2026-11-27 · 완료 (세션 5d가 22의 wip를 이어받음)
- **한 일**: 22의 설계 메모대로 `HomeScreen`·`StartCard`·`EmptyBuildCard`를 만들었다.
  - 무대 조명: CSS 타원 그라디언트 대신 원형 `RadialGradient`(반지름 rx)를 y로 ry/rx만큼 늘렸다. 중심은 (13·38·63·88%, −14%).
  - 타일 안쪽 빛: farthest-corner × 0.7 ≈ 56pt.
  - EmptyBuildCard 점선은 RN iOS `RCTBorderDrawing`과 같은 [3, 3]이다(선 두께 × 3).
  - 연타 방지: `router.sheet == nil`일 때만 연다(`presentChampionSelect`가 sheet를 바로 세운다). RN의 focus ref와 같은 효과다.
  - 빌드는 `.task { store.load() }`로 읽는다. nil(로딩 중)이면 빈 카드도 숨긴다.
  - `TopTierSection()`은 본문 좌우 16 안에 그대로 넣었다. I-30(#105)이 채운다.
- **확인**
  - `make -C native/ios build`가 통과했다(I-06a 캐시를 `DERIVED=`로 재사용).
  - `status.sh diff`의 owns 밖 항목은 모두 의존 브랜치(I-06a·I-14 스택)에서 온 것이다. 이 작업이 바꾼 것은 `Features/Home/` 세 파일뿐이다.
- **머지 순서**: #93(I-06a), #102(I-14, #88·#89·#96·#90 포함)이 머지된 뒤 이 PR을 머지한다.
