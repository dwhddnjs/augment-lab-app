---
id: I-25b
title: 칼바람 화면 조립
wave: W2
status: todo
depends: I-06b, I-10, I-24, I-25a, I-26, I-27
owns: native/ios/AugmentLab/Features/Aram/Screen/
spec: aram.md §1·§3
rn: src/features/aram/screens/aram-screen.tsx, src/features/aram/components/round-indicator.tsx, src/hooks/use-landscape-size.ts
---

# I-25b 칼바람 화면 조립

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
엔진·카드·연출·서랍을 붙여 드래프트를 완성한다.

## 체크리스트
- [ ] 파라미터 검증(헤드라이너 무작위 폴백)
- [ ] 헤더: X(종료 확인), 로고 + 라운드 pill(펜타킬 "스킬 강화"), 목록 버튼
- [ ] 등장 연출 → 카드 마운트, busy 가드
- [ ] 마지막 라운드: 고른 카드 그대로 멈춘 채 아이템 화면으로(쌓기)
- [ ] 현재 카드·펜타킬 스펠 prefetch
- [ ] 스텁의 임시 버튼 제거

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-25b` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 13종 헤드라이너로 한 판씩: 라운드 수·카드 수·스티커·스킬 선택
- [ ] 리롤 1회 제한
- [ ] 종료 확인 → 홈 세로

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 착수 직후 한도 95%로 중단 (세션 5d)
- **브랜치**: `native/I-06b`(#97) 위에 I-24(#91)·I-25a(#103)·I-26(#95)·I-27(#108)을 merge했다(충돌 없음). 이 위에 쌓인 PR이 먼저 머지돼야 한다.
- **마친 줄**: 없음. RN `aram-screen.tsx`, aram.md §1·§3, I-24·I-25a 진행 기록(API)까지 읽었다.
- **다음에 할 첫 행동**: `Features/Aram/Screen/AramScreen.swift`(I-06a 스텁)를 채운다.
  - 상태: `@State var draft = AramDraft(pool:headliner:rng:)`. 헤드라이너는 `params.headliner`, 없거나 무효면 무작위.
  - 카드 애니메이션: `@State anim = CardPickAnim(count:)`. 떠날 때 `anim.cancel()`
  - `SideDrawer(isOpen:swipeEnabled: introDone, …) { PickedDrawer(...) }`. 폭은 `min(340, w×0.38)`
  - 헤더(좌우 32, 위아래 8)
    - `GlassButton` X → `router.closeDraft.confirmExit(title:"칼바람을 종료할까요?", cancel:"계속", ok:"종료")`
    - 로고(`HeadlinerLogo`, 잉크 32): 라운드 pill 왼쪽 바깥에 붙인다(marginRight 12).
    - pill: GlassSurface radius full, 좌우 24, 위아래 4. "라운드"/"스킬 강화" label 800 + `RoundIndicator`
    - 목록 `GlassButton`
  - `CardRow(topOffset: round(h×0.07))`
    - 카드 id: `"\(anim.roundKey)-\(aug.id)"`
    - 표식: kda 보너스 → `.kda`, worlds 보너스 → `.worlds`, 그 밖에는 `.sticker`. heartsteel이면 `StickerLine`
  - 마지막 라운드: `done`이면 `router.pushItems(ItemSelectParams(picked:, headliner: BuildHeadliner(id: p.id.rawValue, skills: p.skills, stickers: p.stickers.map(\.rawValue)), championId:, mode:))`. 펜타킬 스킬은 **결과의 progress**에서 꺼낸다.
  - 라운드 표시: worlds는 total 5, 그 밖에는 4(kda는 4/4에서 멈춘다)
  - prefetch: 현재 카드 `ImagePrefetch.prefetch(CDN.augmentImageURLs(iconPath))`, 펜타킬 스펠 `spellImageURL`
  - `RoundIndicator`(RN `round-indicator.tsx` 45줄)는 이 폴더에 둔다.
  - 스텁의 임시 버튼 3개를 지운다.
- **주의점**
  - 드래프트 안 환경은 I-06b의 `appEnvironment`(Router·AppSettings·GameDataStore·BuildStore·palette)뿐이다.
  - 등장 연출 `HeadlinerReveal(id:onDone:)`(I-26)을 먼저 덮고, 끝나면 `introDone`에 카드를 마운트한다.
