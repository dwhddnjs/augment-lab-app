# 앱 셸 명세 (라우트·표시·회전·부팅·분석)

RN 원본: `src/app/**`, `src/components/navigation/*`, `src/hooks/use-close-draft.ts`, `src/lib/orientation.ts`, `src/hooks/use-image-prewarm.ts`, `src/lib/image-prewarm.ts`, `src/lib/analytics.ts`.

## 1. 라우트 표

| 라우트 | 화면 | 표시 방식 | 방향 | 헤더 |
|---|---|---|---|---|
| `/(tabs)/(home)` | 홈 (+ `TopTierSection` footer) | 홈 탭 스택 루트 | 세로 | 시스템 큰 제목 "증강 연구소 / Augment Lab" |
| `/(tabs)/(home)/builds` | 내 빌드 | 홈 스택 push | 세로 | 큰 제목 "내 빌드", 뒤로 버튼은 화살표만 |
| `/(tabs)/(tierlist)` | 티어리스트 | 탭 루트 | 세로 | 큰 제목 + 시스템 검색창 |
| `/(tabs)/(mypage)` | 마이페이지 | 탭 루트 | 세로 | 큰 제목 |
| `/(tabs)/(mypage)/data` | 데이터 관리 | 마이페이지 스택 push | 세로 | 일반 제목, 화살표만 |
| `/(tabs)/plus` | 없음 | 탭은 비활성. 누르면 `/mode-select` | – | – |
| `/build/[id]` | 빌드 상세 | **루트 스택** push(탭바를 덮음). `saved`가 있으면 전환 없음, 아니면 기본 | 세로 | 투명 헤더, 화살표만, 오른쪽 휴지통, 제목은 스크롤에 따라 페이드 |
| `/select-champion-modal` | 챔피언 선택 | modal(page sheet), 아래로 스와이프 가능. `close=cut`이면 닫을 때 전환 없음 | 세로 | 큰 제목(28) + 검색, 왼쪽 X, 오른쪽 ✓ |
| `/tierlist-champion-modal` | 티어리스트 챔피언 | modal, 스와이프 가능, 중복으로 쌓이지 않음 | 세로 | 큰 제목 "챔피언 정보", 왼쪽 X |
| `/mode-select` | 모드 선택 오버레이 | 투명 모달, 페이드, 헤더 없음 | 세로 | 없음 |
| `/aram` | 칼바람 드래프트 | fullScreen, 페이드, 스와이프로 닫기 불가 | **가로** | 자체 glass 헤더 |
| `/aram-items` | 아이템 선택 | 위와 같음, `/aram` **위에 쌓는다** | **가로** | 자체 glass 헤더 |
| `/custom` | 커스텀 | 위와 같음 | **가로** | 자체 glass 헤더 |

## 2. 라우트 파라미터 (딥링크로도 들어올 수 있으니 방어적으로 파싱)

| 라우트 | 파라미터 |
|---|---|
| `/build/[id]` | `id`, `saved?='1'` |
| `/select-champion-modal` | `mode?: 'aram'\|'custom'`(모르면 aram), `headliner?`, `close?: 'cut'\|'fade'`(내부용) |
| `/aram` | `championId`, `mode?='aram'`, `headliner?` — 유효하지 않으면 무작위 |
| `/aram-items` | `picked` = `Augment[]` JSON(`transmuted` 포함), `headliner` = `{id, skills, stickers}` JSON, `championId`, `mode`. **깨지면 picked는 `[]`, headliner는 없음** |
| `/custom` | `championId`. 모르는 ID면 champion = null(유효한 상태) |
| `/tierlist-champion-modal` | `key` — 챔피언 **숫자 key**(id 아님) |

- 스킴: `augmentlab://`
- 커스텀 링크 처리 코드는 없다. 경로가 곧 화면이다.
- 네이티브에서는 Route enum으로 URL을 파싱한다. 티어리스트 챔피언 모달을 콜드 스타트 딥링크로 열었다가 닫으면 티어리스트 탭으로 간다.

## 3. 화면 이동 계약 (I-06이 정하고, 피처는 호출만 한다)

**Router API**
- `push(.builds | .build(id) | .data)`
- `presentChampionSelect(mode, headliner?)`
- `presentTierlistChampion(key)`
- `showModeSelect()`
- `startDraft(.aram(params) | .custom(championId))`
- `pushItems(params)`
- `selectTab(.home | .tierlist | .mypage)`
- `back()`

**드래프트 닫기 계약** (`useCloseDraft` 대응)
- `openBuild(id)` — **저장 경로**. RN 동작:
  1. 가로를 붙잡는다(1.5초 안전 타이머).
  2. 루트를 `[탭(원래 상태 유지), build/[id] {saved:'1'}]`로 한 번에 교체해 [시트, 드래프트, 아이템] 묶음을 닫는다.
  3. 시트는 전환 없이 닫히고, 빌드 상세는 전환 없이 나타난다.
  4. 빌드 상세 전환이 끝나면 세로로 풀고, 이후 뒤로가기 스와이프가 손가락을 따라가게 한다.
  - 목표: 회전은 진행 중인 전환이 없을 때 **한 번만** 일어난다(세로→가로→세로 흔들림 금지).
- `confirmExit(message)` — **나가기 경로**
  1. 확인창을 띄운다. 취소하면 아무 일도 없다.
  2. 확인하면 탭으로 페이드하며 닫고, iOS가 세로로 돌린다.
  - RN에 남은 한계: 가로 홈이 0.5초 보인다. 네이티브에서는 전환 코디네이터로 개선을 시도하고, 결과를 I-40에 기록한다.
- 칼바람 → 아이템은 모달을 갈아 끼우지 않고 **쌓는다**(갈아 끼우면 회전이 뒤집힌다).

**기본 방향**
- 앱 기본은 세로 잠금. 드래프트 3화면만 가로.
- RN에서 겪은 문제("다른 화면에 방향 옵션을 주면 홈이 가로로 돈다")를 네이티브에서도 피한다 → 방향은 드래프트 표시 중에만 연다.

**RN 전용 우회 — 네이티브로 옮기지 않는다** (재현될 때만 대응하고 I-40에 기록)
- 홈 스택 재생성(큰 제목 접힘)
- `InsetView`
- `collapsable={false}`
- SafeAreaView inset 0 고착

## 4. 탭

- 탭: 메인(`house`), 티어리스트(`chart.bar`), 마이페이지(`person.crop.circle`)
- `+`: iOS 26+에서는 search 역할 탭(비활성, 누르면 모드 선택). 26 미만은 커스텀 탭바의 마지막 원형 버튼.
- 탭마다 자기 네비게이션 스택을 둔다. 헤더: 그림자 없음, tint accent, 제목·큰 제목 `text.primary`.

## 5. 부팅 순서

1. 테마·로케일을 읽는다. (네이티브: 그 전에 AsyncStorage 이관을 1회 실행 — storage.md §4)
2. 세로로 잠근다.
3. 프리웜(§6)을 시작한다.
4. `AnimatedSplashOverlay`(600ms, design-system §3.1)를 띄운다. 네이티브 스플래시는 자동으로 사라진다.
5. 첫 실행(해당 ddragon 버전의 플래그 없음)이면 `SetupScreen`을 맨 위에 띄운다(진행률). 100%가 되면 450ms 페이드 아웃.
   - 플래그 확인 중에는 메인 UI가 아래에 그려진다.

## 6. 이미지 프리웜

1. **체인 목록** (이 순서): aram 풀 증강(체인이 빈 것 제외, 현재 223개), 챔피언 square 172, 역할 아이콘 6, aram 아이템 111
2. **중복 제거**: 첫 URL 기준. 순서는 처음 위치, 값은 마지막 것(Map 동작). 현재 473개.
3. **첫 실행**
   - 동시 작업자 12개
   - 체인마다 URL을 차례로 prefetch(memory+disk). URL마다 15000ms 타임아웃과 경쟁시키고, 성공하면 멈춘다. 타임아웃이 나도 그 체인은 멈춘다.
   - 진행률 = 끝난 수 ÷ 전체. 실패도 끝난 것으로 센다(오프라인이어도 100%에 도달).
   - 끝나면 플래그 `'1'`을 쓴다.
4. **이후 실행**: UI 없이 보충(top-up). 첫 URL이 캐시에 없는 체인만 받는다. 앱이 포그라운드로 돌아올 때마다 다시 한다.
   - RN이 이렇게 한 이유: SDWebImage 기본 디스크 만료가 1주라서.
   - 네이티브는 만료를 무제한으로 두지만 보충 로직은 유지한다.
5. **화면별 prefetch**
   - 챔피언 선택 진입: 챔피언 아이콘
   - 아이템 선택 진입: 아이템 아이콘
   - 드래프트: 현재 카드, 펜타킬 스펠 아이콘

## 7. 분석·크래시

**PostHog**
- key `phc_zZqj3uAVvnDFr5nHXAWQT4zbv2E9iV24oguBxBhdeDXC`, host `https://us.i.posthog.com`
- 세션 리플레이 켬, 텍스트 입력·이미지 마스킹 끔
- 개발 빌드에서는 끈다(클라이언트를 만들지 않음)
- 생명주기 이벤트 자동 수집(Installed/Updated/Opened/Became Active/Backgrounded)
- **화면 이벤트**: `$screen` — 이름은 RN과 **똑같은 문자열**을 쓴다(대시보드 연속성)
  - `/(tabs)/(home)`, `/(tabs)/(home)/builds`, `/(tabs)/(tierlist)`, `/(tabs)/(mypage)`, `/(tabs)/(mypage)/data`
  - `/build/[id]`, `/aram`, `/aram-items`, `/custom`
  - `/select-champion-modal`, `/tierlist-champion-modal`, `/mode-select`
- **`screen_left {screen, duration_s}`**
  - 화면이 바뀔 때, 그리고 백그라운드로 갈 때 보낸다. `duration_s = round(ms/1000)`, 백그라운드 시간은 뺀다.
  - 다시 active가 되면 타이머를 새로 시작한다.
- 커스텀 이벤트·identify·터치 자동 수집은 없다.

**Sentry**
- dsn `https://95f5d2e79f0d3ceb7c4e5e9753c5b866@o4512466062082048.ingest.us.sentry.io/4512466068242433`
- 개발 빌드에서 끔, 스크린샷 첨부 켬
- 화면마다 태그 `screen=<이름>`과 breadcrumb `{category:'navigation', message:<이름>}`
- 프로젝트: org `aram-augment-lab`, project `augment-lab-app`. dSYM/매핑 업로드는 I-43 / A-43.
