---
id: I-12b
title: 헤드라이너 공용 UI
wave: W1
status: done
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
- [x] `MarkedText`(색 키 → StatTextColors·SkillCardColors)
- [x] `DetailCardRow`
- [x] `HeadlinerSummary`(+compact)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-12b` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 13종 로고가 잉크 기준으로 정렬돼 보인다
- [ ] 라이트 모드에서 흰 로고가 틴트된다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- `UI/Headliner/TempRemoteImage.swift` → I-05 `RemoteImage`(Infra/Images)로 교체. 시그니처가 같아서 I-05·I-12b가 둘 다 dev에 들어오면 파일을 지우고 `TempRemoteImage` → `RemoteImage` 이름만 바꾸면 된다(SkillIcon·HeadlinerSummary 두 곳).
- `ChampionSpells[SkillKey]` 서브스크립트(지금 `SkillIcon.swift` 안, 앱 타깃 internal) → `AugmentCore/Data/Models.swift`(I-02a 소유)로 옮길 후보. I-25a 스킬 카드도 쓴다.
- `HeadlinerSummary`는 I-04a의 `BuildHeadliner`를 몰라서 `id`·`skills`·`stickers`를 따로 받는다. I-04a 머지 뒤 `init(_ headliner: BuildHeadliner?, championId:compact:)` 편의 init(없으면 EmptyView)을 붙이면 RN 호출 모양과 같아진다.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 완료
- 한 일: `UI/Headliner/`에 HeadlinerAssets(로고 메타 + logoBoxHeight·logoInkLeft, Worlds 카드 마크·커맨드 라인 리롤·스킬 카드 장식·스티커 초상 이름), HeadlinerLogo(판·plain·라이트 흰 로고 template 틴트·command-line light 판), SkillIcon(+키 배지, Dynamic Type 무시), `markedText(_:colors:)`(AttributedString), DetailCardRow, HeadlinerSummary(+compact). `make build` 통과(경고 0).
- 주의점
  - DetailCardRow 왼쪽 3pt 테두리: 바깥 모양에서 왼쪽만 3pt 들인 같은 모양을 뺀 초승달(`Path.subtracting`, iOS 17)로 그린다 → 모서리를 따라 가늘어진다. hairline 테두리 위에 덮는다. 내용은 RN처럼 테두리 두께만큼 더 들어간다(왼쪽 3+패딩, 나머지 hairline+패딩).
  - `logoInkLeft`는 `UIImage(named:)` 크기 비율로 계산(RN `Image.resolveAssetSource`). small 그림이 있으면 그 비율.
  - View 안에서 `fontWeight(800)`은 View 수식어로 해석돼 컴파일 에러 → `.heavy`/`.bold`를 직접 쓴다.
  - 로고·초상은 `Image(decorative:)` — RN처럼 VoiceOver가 에셋 이름을 읽지 않는다.
  - 마크 텍스트 색: 스킬 카드 `SkillCardColors.mark`, 스티커 문구 `StatTextColors.color($0, .dark)`(카드 위라 다크 고정).
- 사용자 볼 것: Xcode 프리뷰 `HeadlinerLogo.swift`(다크/라이트 — 13종 plain 로고가 빨간 세로선에 잉크 기준으로 붙는지, 라이트에서 흰 로고 6종이 글자색으로 칠해지는지), `HeadlinerSummary.swift`(펜타킬 Q·R, 하트스틸 아펠리오스×2·세트 compact, K/DA), `DetailCardRow.swift`(왼쪽 테두리 모서리).
