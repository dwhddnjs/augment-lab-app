# 디자인 시스템 명세 (픽셀 기준)

RN 원본: `src/constants/theme.ts`, `src/components/**`, `assets/**`.
이 문서의 값이 정답지다. 숫자는 pt. 모르는 값이 생기면 RN 원본을 열어 확인하고, 이 문서에 덧붙인다(작업 파일 "승격 후보"에 남김).

## 1. 토큰

### 1.1 색 — `Theme.dark` / `Theme.light`

| 토큰 | dark | light |
|---|---|---|
| surface.base | #0E0F12 | #F2F2F7 |
| surface.raised | #16181C | #FFFFFF |
| surface.sunken | #0A0B0D | #E5E5EA |
| surface.overlay | rgba(0,0,0,0.6) | rgba(15,17,21,0.45) |
| text.primary | #F2F4F7 | #0E0F12 |
| text.secondary | #B0B4BA | #5A6068 |
| text.tertiary | #7A7F87 | #878D96 |
| text.disabled | #4A4E55 | #B4B8BE |
| text.inverse | #0E0F12 | #FAFBFC |
| text.onAccent | #04231A | #04231A |
| border.default | #26292F | #D7DAE0 |
| border.subtle | #1B1E22 | #E6E8EC |
| border.strong | #3A3F47 | #B4B8BE |
| accent.default | #00E994 | #18A368 |
| accent.subtle | rgba(0,233,148,0.14) | rgba(24,163,104,0.12) |
| accent.onAccent | #04231A | #04231A |
| status.danger | #F26D6D / rgba(242,109,109,0.16) | #D0463F / rgba(208,70,63,0.16) |
| glass.fill | rgba(255,255,255,0.06) | rgba(255,255,255,0.45) |

쓰지 않는 토큰(옮기지 않아도 됨): `status.success/warning/info`, `Elevation.level2`, `HeroOverlay.scrimLight`.

### 1.2 타이포 (시스템 폰트, 커스텀 폰트 없음)

| type | size | lineHeight | weight |
|---|---|---|---|
| display | 48 | 52 | 700 |
| title | 32 | 40 | 700 |
| heading | 20 | 28 | 600 |
| body (기본) | 16 | 24 | 500 |
| label | 14 | 20 | 600 |
| caption | 12 | 16 | 500 |

- 모달 큰 제목(챔피언 선택, 티어리스트 챔피언): 28.
- 빌드 상세 헤더 제목: heading을 17로 줄인 것.
- 토큰 밖 크기: 11/14/600, 10/13/600, 9/11, 8/12.
- **상속 함정**: RN `ThemedText`는 `[{color}, Typography[type], style]` 순서다. 덮어쓰지 않은 속성은 body 16/24/500을 물려받는다. 예를 들어 카드 설명과 스킬 카드 키 라벨은 weight 500 그대로다.

### 1.3 간격·반경·기타

- Spacing: half 2, one 4, two 8, double 12, three 16, four 24, five 32, six 64
- Radius: none 0, sm 4, md 8, lg 12, xl 16, xxl 24, full 9999
  - pill이 아닌 둥근 모서리는 전부 `continuous`(iOS squircle, SwiftUI `.continuous`)
- BottomTabInset: 50
- Elevation.level1: #000, opacity 0.08, offset (0,1), radius 4. `GlassButtonFallback`에서만 쓴다.

### 1.4 희귀도·티어

| | silver | gold | prismatic |
|---|---|---|---|
| AugmentRarityColors (dark) | #B5B6B5 | #D0AE80 | #B592D6 |
| AugmentRarityColorsLight | #848484 | #9C7A58 | #976ED3 |
| 대체 글리프 (MCI) | shield | star | shimmer |

- `useRarityColors()`가 모드에 따라 둘 중 하나를 고른다. 카드 아트 위에서는 항상 dark를 쓴다(§7).
- TierColors

  | | S | A | B | C | D |
  |---|---|---|---|---|---|
  | dark | #B592D6 | #E8B339 | #B5B6B5 | #C08C5C | #767D87 |
  | light | #976ED3 | #AD821F | #848484 | #8A5F33 | #5C626A |

- TierGradientAlpha(hex 알파 접미사): edge `1A`, center `A6`, border `66`

### 1.5 고정 색 묶음

- **HeroOverlay** (아트 위의 어두운 톤, 두 모드 공통)
  - scrimDark: rgba(8,9,11, 0 / .55 / .85 / .96)
  - scrimCorner: rgba(8,9,11, .6 / .25 / 0)
  - cardBase #0A0B0D, tileBg rgba(0,0,0,0.45), tileBorder rgba(255,255,255,0.14)
  - textPrimary #F2F4F7, textSecondary #B5BAC1
- **AugmentCardColors**
  - amount #E8B339 (설명 속 골드 수치)
  - 라이트 그림자(알파 `4D`): silver #3E434B, gold #6B4423, prismatic #5B47C2
  - 다크 글로우(inner / outer 알파): silver #D5D8DE 14/1A, gold #E9CFAF 2B/2B, prismatic #BCACFF 40/61
- **HeadlinerColors**

  | ID | 색 | ID | 색 | ID | 색 |
  |---|---|---|---|---|---|
  | kda | #E83850 | pentakill | #D4AF6A | heartsteel | #B4EE7A |
  | true-damage | #2DD4BF | disco | #B58CFF | cafe-cuties | #FF6A84 |
  | bees | #FFC23D | command-line | #FF8A3D | worlds | #3D7DFF |
  | arcade | #E040B0 | debonair | #7CC24A | la-ilusion | #D8B85A |
  | maestro | #E04A22 | | | | |

- **StageAlpha**: light `73`, wash `47`, edge `66`, glow `4D`
- **StatTextColors**

  | | k | ad | ap | as | hp | sv |
  |---|---|---|---|---|---|---|
  | dark | #C2C59B | #EC8D34 | #786CFF | #FFE78C | #21995C | #DC4460 |
  | light | #6E7142 | #AA5A10 | #5E50FF | #876B00 | #1B7E4C | #D52042 |

- **SkillCardColors**: portraitRing #EBD7B4, swirl #8F6F4C, body #AEB4BD, key #D9A441, empower #E0709A, spell #E2AE4C, heal #7FCB74, shield #5FBBD0
- **Brand.splashBg**: #0E0F12

## 2. 공용 컴포넌트

### 2.1 텍스트·바탕
- **ThemedText**: `type`(기본 body), `color`(text 토큰 또는 `accent`). §1.2 상속 함정 참고. 약 48개 파일이 쓴다.
- **ThemedView**: `surface`(기본 base)로 배경색만 정한다.

### 2.2 GlassSurface
- iOS 26+: Glass `regular`, 모드에 맞는 colorScheme, overflow hidden(클립)
- 26 미만: Blur intensity 20, tint=모드. `edge` 옵션이 있으면 hairline `border.default` 테두리

### 2.3 GlassButton
- 아이콘만: SF Symbol 18, 색 `tint ?? label`, 44×44 frame, glassEffect regular·interactive·circle
- 라벨 포함: padding(세로 8, leading 16), buttonStyle glass, controlSize regular, 선택적 tint, font medium 16
- 사용 아이콘: `xmark`, `list.bullet`, `checkmark`, `slider.horizontal.3`

### 2.4 GlassButtonFallback (iOS 26 미만, Android 기준 디자인)
- 모양: 44×44 원, 또는 pill(padding 8/16, radius full)
- 테두리: hairline. 기본 `border.subtle`, tint가 있으면 투명
- 배경: `surface.raised`, tint가 있으면 `accent.default`
- 아이콘: MCI 22. tint면 `accent.onAccent`, destructive면 `status.danger`, 그 외 `text.secondary`
- 그 밖: Elevation.level1, 눌림 opacity 0.7, hitSlop 8

### 2.5 RerollButton
- 기본: 36 원, 테두리 1. 보통 상태 `surface.raised` + `border.strong`, 사용 후 `surface.sunken` + `border.subtle`
- 아이콘: MCI `refresh` 18. `text.primary`, 사용 후 `text.disabled`
- opacity: 비활성이면서 미사용 0.35, 눌림 0.65
- 해킹 변형: 36 자리 가운데에 50×50 이미지. 라이트 모드에서는 `-light` 아트로 바꾼다. 점멸은 §3.5

### 2.6 CardRow / 카드 레이아웃
- CardRow: 가로, alignItems flex-start, 가운데 정렬, paddingHorizontal 24, gap 24, paddingTop = round(화면높이 × 0.07)
- 카드 너비 = min(floor((W − 48 − 24·(n−1)) / n), floor(H·0.56 / (14/9)))
- 상수: `CARD_ROW_PAD` 24, `CARD_GAP` 24, `CARD_HEIGHT_RATIO` 0.56

### 2.7 RarityCardFrame (`rarity-card-frame.tsx`)
- 비율: 14:9 (H = round(W × 14/9)). 모서리 반경 W × 0.07
- 아트: `bg.png` 위에 `frame-<rarity>.png`, 둘 다 fill, 모서리로 클립
- 배치 (카드 W·H 대비 비율)
  - 아이콘 크기 0.5W, 아이콘 중심 0.227H
  - 텍스트 위 = 0.459H − 0.18 × 이름 크기, 텍스트 아래 0.9H
  - 좌우 여백 0.14W
- 글자 크기

  | | 이름 | 이름 줄높이 | 설명 | 설명 줄높이 | 간격 |
  |---|---|---|---|---|---|
  | 일반 | 12 | 14.4 | 9 | 12.5 | 4 |
  | compact | 10 | – | 7.5 | 10.5 | – |

- 이름: 700, #F2F4F7, 가운데, 최대 2줄, 한글 단어 단위 줄바꿈
- 설명: #B5BAC1. 남은 공간으로 줄 수를 계산한다.
  - 골드 수치 정규식 `\d[\d,]*\s*(골드|gold|원)` → #E8B339, 700
- 그림자 (compact이면 없음)
  - 라이트: `0 0 2px C4D, 0 0 10px C4D`
  - 다크: `0 0 (W·0.012)px color+inner, 0 0 (W·0.056)px color+outer`
  - CSS blur ≈ 2 × CALayer radius → SwiftUI `.shadow(radius:)`에는 절반 값을 넣는다
- 카드 텍스트는 Dynamic Type을 끈다(`allowFontScaling=false`). 그 외 텍스트는 Dynamic Type을 따른다.

### 2.8 이미지·타일
- **AugmentTile**: 정사각, radius md, 희귀도 색(항상 dark 팔레트) 테두리 1, 배경 기본 `HeroOverlay.tileBg`, 이미지 0.75×size, 대체 글리프는 그 0.8
- **AugmentImage**: 로컬 아이콘 → CDragon large → base → small → 희귀도 글리프(fallbackRatio 0.62) 순서로 시도. 캐시 memory-disk, 전환 0
- **RemoteImage**: 로딩 중 배경 `surface.raised`, 전환 200ms, memory-disk 캐시, cover

### 2.9 기타 공용
- **DetailCardRow**
  - `surface.raised`, radius lg(continuous), hairline `border.subtle` 테두리, 왼쪽 테두리 3(accent)
  - padding·gap 16, compact 12
  - 제목 label 700, 설명 caption secondary
- **MoreLink**: accent 라벨 + `chevron.right` 12×12, gap 2, hitSlop 8
- **SettingsRow**: HStack(12)
  - SF 아이콘 17(frame 폭 26)
  - VStack(leading, 2): 라벨 + 선택적 footnote 설명(secondaryLabel)
  - Spacer, 값(secondaryLabel), `chevron.right` 13(tertiaryLabel)
  - 버튼 스타일 plain
- **TierMark**: 가로 그라데이션 C1A→CA6→C1A, 1pt 테두리 C66, 글자 800, letterSpacing 2(heading) / 1(label)

### 2.10 탭바
- **iOS 26+**: 시스템 탭(Liquid Glass), tint accent, SF `house`, `chart.bar`, `person.crop.circle`. `plus`는 search 역할로 따로 떨어진 버튼이며 비활성. 누르면 모드 선택 오버레이를 연다.
- **CustomTabBar** (26 미만, Android 기준)
  - 높이 80, 위쪽 hairline `border.default`, 배경 `surface.base`, paddingBottom = 하단 inset, paddingHorizontal 16
  - 옆 탭: MaterialIcons `home`·`bar-chart`·`account-circle` 26, 세로 gap 2, 라벨 12/600. 활성 accent, 비활성 `text.secondary`
  - `+`: 56 accent 원 + MaterialIcons `add` 34(`text.inverse`). 주석에는 center라고 적혀 있지만 실제로는 줄의 마지막이다.

### 2.11 SetupScreen
- 배경 `surface.base`, 로고 120×120
- 진행 바: 폭 240, 높이 6, radius full. 트랙 `surface.raised`, 채움 accent + `0 0 10px accent.subtle`
- 퍼센트는 tabular 숫자. 안내 caption은 바닥에서 64

## 3. 애니메이션 (전부 RN Reanimated 원본 수치)

### 3.1 AnimatedSplashOverlay
- 전체 화면 #0E0F12, 맨 위 레이어. 끝나면 제거한다.
- 키프레임 600ms
  - 0%: scale = 화면높이/90, opacity 1
  - 20%: opacity 1
  - 70%: opacity 0 (elastic 0.7)
  - 100%: opacity 0, scale 1 (elastic 0.7)
- 단색이라 실제 보이는 건 120~420ms 사이의 페이드다.

### 3.2 SetupScreen
- 사라질 때 FadeOut 450ms. 진행 바 폭은 애니메이션하지 않는다.

### 3.3 ModeSelectOverlay
- 배경: FadeIn 150ms, `surface.overlay`. 누르면 닫힌다.
- 버튼: FadeInDown, delay (n−1−i)×70, duration 220, out(cubic), 아래 +20에서 올라온다. + 바로 위의 칼바람이 0ms, 그 위 커스텀이 70ms.
- 원 60, 테두리 1.5 #00E994(두 모드 공통). MCI `snowflake`·`tune-variant` 24, 아래에 caption 라벨, gap 2.
- 정렬: 양축 flex-end, gap 16, paddingRight 22, paddingBottom = inset + 50 + 16

### 3.4 HeadlinerReveal (모든 타이밍이 ReduceMotion 무시)
- 무대: 전체 #0A0B0D(두 모드 공통). 2600ms 뒤 자동으로 닫히고, 아무 데나 탭해도 닫힌다.
- 닫기: 무대 opacity 1→0, 300ms, inOut(quad). `onDone`은 300ms 타이머로 부른다.
- Wash: radial-gradient(ellipse 70% 90% at 28% 0%, C38 0%, C00 100%), FadeIn 700ms
- 로고
  - 상자 260×180, 키프레임 opacity 0→1 · scale 1.08→1, out(cubic), delay 120, duration 620
  - 안쪽에 460×460 aura: radial(circle, C47 0%, C14 42%, C00 70%)
  - heartsteel 로고는 0.78배
- 세로선: 폭 2×hairline, 높이 148, 색 C+`80`. opacity 0→1 · scaleY 0→1(가운데 기준), out(cubic), delay 460, duration 420
- 문구: translateX −12→0 + opacity, 420ms out(cubic), delay 560 / 620 / 700
  - eyebrow: 12/16, 700, letterSpacing 2, 헤드라이너 색
  - 이름: 48/52, 800, #F2F4F7, 한 줄, 넘치면 축소
  - 설명: 14, 500, 줄높이 22, #B5BAC1, marginTop 4, 최대 3줄
- 배치: 가로, gap 32. 문구 열 폭 340, gap 4

### 3.5 PickCard / 선택 애니메이션
- 변환 순서: perspective 900 → rotateY → scale. 뒷면 숨김. 기본 easing inOut(quad). 모두 ReduceMotion 무시.
- 뒤집기 등장(새 라운드): delay index×90. opacity 0→1 160ms, rotateY 90°→0 380ms out(cubic)
- 페이드 등장(리롤 교체, Reduce Motion일 때는 전부): opacity 0→1 200ms, scale 0.96→1 240ms
- 선택됨: scale 1→1.05 120ms → 1 90ms
- 선택 안 됨: opacity→0, scale→0.94, 280ms
- 리롤 퇴장: opacity→0, scale→0.96, 200ms
- 탭은 rotateY가 정확히 0일 때만 받는다.
- 확정 시점: 선택 후 380ms, 리롤 후 220ms에 교체. busy 가드로 중복 입력을 막는다.
- 카드는 헤드라이너 등장 연출이 끝난 뒤에 마운트한다.
- **RerollButton 해킹 점멸**
  - 잠기지 않은 동안 반복: 0→1 140ms out(quad), 1→0 460ms out(cubic), 700ms 대기 (한 주기 1300ms)
  - 점멸 레이어 opacity = 값, 아트 scale = 1 + 값×0.14
  - Reduce Motion이면 생략

### 3.6 PickTargetToggle
- 노브 translateX 0↔58, 180ms inOut(quad), 누르면 selection 햅틱
- 트랙: 124×32, glass, radius full, hairline `border.subtle`
- 노브: left/top 4, 58×24, glass + `accent.subtle` 채움
- 라벨 11/700. 활성 accent, 비활성 tertiary

### 3.7 티어리스트 펼치기
- 새로 붙는 카드 FadeIn 220ms. 그룹마다 50ms 간격으로 12개씩 붙인다.

### 3.8 빌드 상세 스크롤
- 배너 높이: scrollY [-140, 0, 276] → [440, 300, 0] (clamp)
- 헤더 배경(GlassSurface)·제목 opacity: scrollY [124.2, 220.8] → [0, 1]
- 배너 그라데이션: `surface.base` 알파 00/00/14/40/A6/FF, 위치 0/0.5/0.68/0.82/0.93/1
- 시트
  - 배너와 24 겹침, 위 모서리 24(continuous), 위·좌·우 hairline `border.subtle`
  - padding 위 24·좌우 16, gap 32

### 3.9 커스텀 드래그
- 제스처: 180ms 길게 누르면 pan 시작. 리스트 스크롤 제스처는 그동안 막는다. 손가락 위치는 UI 스레드에서 바로 쓴다. 취소되면 x = −1(=취소).
- 고스트: 64 정사각, 위치 (손가락 − 32), 내부 opacity 0.9, scale 1.05. 표시/숨김은 즉시(애니메이션 없음).
- 드롭 경계: 왼쪽 inset + 본문폭 × 6.5/11
  - 경계를 넘을 때만 `overDrop`을 바꾼다
  - 넘어간 동안 활성 열에 `surface.overlay` 베일 + MCI `arrow-down-circle-outline` 28(accent)
- 햅틱
  - 드래그 시작: Impact Medium
  - 추가됨: Impact Light
  - 중복·가득 참: Notification Warning
  - 열 전환: selection
- 빠른 모드: 드래그 끔, 탭으로 추가(눌림 0.7)

### 3.10 서랍 (칼바람 픽 현황, 커스텀 설정)
- 오른쪽, front 타입, 폭 min(340, 화면폭 × 0.38), 배경 `surface.base`
- 스프링: stiffness 1000, damping 500, mass 3, overshootClamping, rest 0.01, ReduceMotion 무시
- 딤: rgba(0,0,0,0.5), opacity = 진행도
- 스와이프: 가장자리 32. 가로 5px에 시작, 세로 5px이면 실패. 60px 넘거나 속도 500 초과면서 5px 넘으면 완료.
- 칼바람: 등장 연출이 끝난 뒤부터 스와이프 가능. 커스텀: 스와이프 끔.

### 3.11 눌림 opacity

| 대상 | opacity |
|---|---|
| BuildCard | 0.92 |
| StartCard 타일, 챔피언 셀, 폴백 버튼 | 0.7 |
| RerollButton | 0.65 |
| 리스트 행 | 0.6 |
| glass pill | 0.55 |
| 삭제 배지 | 0.5 |
| 시작 버튼(비활성) | 0.4 |

## 4. Glass·블러·그라데이션

**Glass 모양 목록**
- 검색 필드: pill, 높이 32, 최대 폭 300
- 칼바람 라운드 pill: radius full, padding 4/24
- 아이템 트레이: radius lg, padding 8, gap 4, 슬롯 40×40
- 스탯 패널: radius lg, padding 8, 1pt `border.subtle`
- 챔피언 행 pill: 높이 28, 1pt `border.strong`
- 커스텀 오버레이 시트: radius xl, 1pt `border.subtle`. 챔피언 변경 100%×90%, 스탯 42%×90%

**LinearGradient**
- 빌드 카드
  - 아래 scrim: scrimDark, 위치 [0.52, 0.7, 0.85, 1]
  - 모서리 scrim(헤드라이너·커스텀 빌드만): scrimCorner [0, 0.45, 1], (0,0)→(0.6,0.3)
- 빌드 상세 배너: §3.8
- TierMark: §2.9

**Radial (CSS)**
- 헤드라이너 wash·aura: §3.4
- StartCard 무대 조명: 4겹 radial(34% 70% at x% −14%, C73 0%, C00 100%), x = 12.5/37.5/62.5/87.5%
- StartCard 타일: radial(circle at 50% 30%, C47 0%, C00 70%)

**boxShadow**
- 빌드 카드 글로우: `0 6px 14px -8px C4D`. 음수 spread는 SwiftUI에 없다 → 작은 오프셋 그림자로 흉내 내고 사용자 확인 항목에 넣는다.
- 셋업 진행 바: `0 0 10px accent.subtle`

## 5. SwiftUI 대응 (RN의 @expo/ui가 이미 SwiftUI였던 곳)

| RN 파일 | 구성 |
|---|---|
| glass-button | Button + Image, `.glassEffect`, `.buttonStyle(.glass)` |
| settings-row | §2.9 |
| mypage-screen | List insetGrouped, `scrollContentBackground(.hidden)`, 배경 `surface.base`, tint accent, 행 배경 `surface.raised`, Picker(menu) |
| data-manage-screen | 같은 List 스타일 + SettingsRow |
| custom-settings-drawer | List, Toggle, Picker segmented, 행 배경 clear, 구분선 숨김, 위 padding 24 |
| build-filter-bar | Picker segmented, 높이 32 |

- RN에는 "모드가 바뀌면 Host 재마운트" 우회가 있다(tint 갱신 버그). 네이티브에서 재현되지 않으면 버린다.
- SF Symbol — 마이페이지: `circle.lefthalf.filled`, `globe`, `externaldrive`, `info.circle`, `gamecontroller`, `chevron.left.forwardslash.chevron.right`, `envelope`
- SF Symbol — 데이터 관리: `square.and.arrow.up`, `square.and.arrow.down`, `trash`
- 그 밖 SF Symbol: `chevron.right`, `xmark`, `checkmark`, `square.grid.2x2.fill`
- MaterialCommunityIcons → iOS에는 같은 모양의 SF Symbol이 없다. RN이 쓰던 **폰트 파일을 그대로 번들**하고 코드포인트로 그린다. 모양이 RN과 픽셀 단위로 같아진다.
  - 원본: `node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/{MaterialCommunityIcons,MaterialIcons}.ttf`
  - 코드포인트 표: 같은 경로의 `glyphmaps/*.json`
  - I-00이 파일을 복사하고, I-01이 `Icon(.mci("refresh"), size:)` 헬퍼를 만든다. Android도 같은 TTF를 쓴다.
  - 목록: shield, star, shimmer, refresh, snowflake, tune-variant, close, check, format-list-bulleted, cards-outline, trash-can-outline, plus, magnify, close-circle, close-circle-outline, arrow-down-circle-outline, restart, view-grid-outline, hexagon-outline, hexagon-slice-6, hexagon-multiple, sword, apps, shoe-sneaker
  - MaterialIcons(26 미만 탭바): home, bar-chart, account-circle, add

## 6. 에셋

| 폴더 | 수 | 내용 |
|---|---|---|
| `assets/augment-card/` | 4 | `bg.png` + `frame-{silver,gold,prismatic}.png` (309×512) |
| `assets/augments/` | 10 | CDragon에 컬러가 없는 증강 아이콘(256). `src/lib/ddragon.ts`가 `*_small.png` 이름으로 매핑 |
| `assets/headliners/` | 27 | 아래 참고 |
| `assets/store/` | – | `icon-aram-ios-1024.png`(앱 아이콘), `adaptive-foreground.png`(스플래시·셋업 로고), SVG 원본 |
| `assets/locales/ko.json` | 1 | `CFBundleDisplayName: "증강 연구소"`. 기본(영문) 이름은 "Augment Lab" |

`assets/headliners/` 내용
- 로고 13개
- command-line `-light`, `-small` 변형
- reroll 아트 3개(기본, `-light`, `-flash`)
- `worlds-card`, `skill-card-swirl`(#8F6F4C 틴트), `skill-card-icon-frame`
- 스티커 초상화 6개(aphelios, ezreal, kayn, ksante, sett, yone, 256×128)

로고 메타(`src/features/headliners/assets.ts`)
- kda: 비율 1000/267, ink 0.73, inkLeft 0.05
- bees: ink 0.8, command-line: ink 0.82
- `logoBoxHeight`·`logoInkLeft`로 눈에 보이는 잉크 기준 크기·정렬을 맞춘다. 그대로 옮긴다.

스플래시: 배경 #0E0F12, `adaptive-foreground.png`, 폭 220, aspect-fit 가운데.

## 7. 라이트/다크

**모드 결정**
- 저장값 `system`/`light`/`dark`
- `system`인데 기기 값을 모르면 light로 본다

**두 모드 모두 다크로 고정**
- 헤드라이너 무대
- 카드 아트·글자(희귀도는 dark 팔레트)
- AugmentTile 테두리
- StartCard: #0A0B0D 배경, 타일은 `Theme.dark.glass.fill`
- 빌드 카드: scrimDark, 커스텀 빌드는 `Theme.dark.accent`
- 모드 선택 버튼(`Theme.dark.accent`)
- 픽 현황 셀·스티커·링

**라이트에서만 바뀌는 것**
- 카드 그림자: 글로우 대신 색 그림자
- RerollButton: light 아이콘
- HeadlinerLogo plain: command-line은 light 아트, 흰 로고(true-damage, disco, cafe-cuties, worlds, arcade, la-ilusion)는 `text.primary`로 틴트
- 픽 현황 서랍·아이템 화면 augment-card의 증강 이름: 희귀도 색 대신 `text.secondary`
- 희귀도·티어·스탯 색: light 팔레트로

## 8. 픽셀 함정

- **줄높이**: RN은 줄마다 고정 lineHeight를 두고 글자를 세로 가운데에 둔다. SwiftUI `lineSpacing`은 다르게 동작하므로 `lineHeight − fontSize.lineHeight` 보정 헬퍼를 I-01에서 하나 만든다.
- **hairline**: 3x 화면에서 1/3pt, 2x에서 0.5pt (`1 / displayScale`)
- **그림자**: CSS blur ÷ 2 = SwiftUI radius
- **Dynamic Type**: 카드·스티커 텍스트만 고정, 나머지는 따른다.
