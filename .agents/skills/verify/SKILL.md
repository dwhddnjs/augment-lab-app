---
name: verify
description: iOS 시뮬레이터에서 Augment Lab 앱을 띄우고 시뮬레이터 MCP로 탭·스와이프해 변경을 눈으로 검증한다. 빌드/실행/입력 주입/기록 레시피.
---

# Augment Lab — iOS 시뮬레이터 검증

이 앱은 **iOS 전용**이고 `expo-dev-client` + `@expo/ui`(SwiftUI) + `expo-glass-effect`를 쓴다.
Expo Go로는 못 띄운다. 네이티브 빌드가 필요하다.

**입력·캡처는 시뮬레이터 MCP(`mcp__Claude_Code_iOS_Simulator__control`)로 한다.**
cliclick·osascript·베젤 좌표 계산은 더 이상 쓰지 않는다 — MCP가 device point로 직접 주입한다.

## 1. 시뮬레이터 부팅 & 패널 열기

먼저 `attach`부터 부른다(부팅돼 있으면 즉시 열리고, 아니면 무해한 에러가 온다). 사용자가
화면을 봐야 하므로 **빌드 전에** 연다.

```bash
xcrun simctl list devices available | grep -A6 'iOS 26'   # iOS 26+ 여야 리퀴드글래스 경로가 렌더된다
xcrun simctl boot <udid>; open -a Simulator
```

그다음 `control { action: "attach", udid }`. 결과에 **좌표계(예: 402x874 points, origin top-left)**
가 찍혀 나온다 — 이후 모든 tap/swipe는 이 point 좌표를 그대로 쓴다. 픽셀 환산·베젤 보정 없다.

## 2. 빌드 & 실행

`ios/`는 CNG(gitignore)라 없으면 `run:ios`가 prebuild부터 한다. **첫 빌드 10~25분**이므로
`run_in_background: true`로 돌리고 완료 알림을 기다릴 것.

```bash
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8   # 없으면 CocoaPods가 Encoding::CompatibilityError로 죽는다
npx expo run:ios --no-bundler --device <udid>
```

- `--no-bundler`: 사용자가 `npm start`를 이미 띄웠을 때. Metro가 8081을 물고 있는지 확인:
  `lsof -ti:8081 | xargs ps -o command= -p` — **cwd가 이 워크트리인지까지** 본다(다른 프로젝트가
  8081을 물고 있으면 남의 앱 번들이 로드된다).
- JS만 고쳤으면 재빌드 불필요. Metro가 붙어 있으면 저장 즉시 반영된다.
- 네이티브 변경이 없고 workspace만 다시 컴파일하면 될 때는 `mcp__Claude_Code_iOS_Simulator__build`
  (`ios/AugmentLab.xcworkspace`, scheme `AugmentLab`)도 쓸 수 있다. 단 pod install은 안 하므로
  의존성이 바뀌었다면 `expo run:ios`가 정답이다.
- 백그라운드 명령을 `| tail -N`으로 파이프하면 **끝날 때까지 로그가 한 줄도 안 보인다.**
  진행을 보려면 파이프 없이 돌리고 출력 파일을 tail 하거나, `pgrep -fl xcodebuild`로 생존만 확인.

빌드가 끝나면 앱이 자동 설치·실행된다. 이미 빌드된 `.app`을 다시 올릴 때는
`control { action: "launch", app_path, bundle_id: "com.augmentlab" }`.

## 3. 입력 주입 — MCP `control`

| 하고 싶은 것 | 호출 |
|---|---|
| 화면 확인 | `{ action: "screenshot" }` — PNG가 바로 돌아온다 |
| 탭 | `{ action: "tap", x, y }` (device point) |
| 스크롤/스와이프 | `{ action: "swipe", x, y, x2, y2, duration }` |
| 텍스트 입력 | `{ action: "text", text }` |
| 홈/잠금 | `{ action: "button", name: "HOME" }` |
| 딥링크 | `{ action: "open_url", url }` |

**스크린샷은 point 가 아니라 픽셀로 온다 — 배율을 곱해야 한다.**
402x874 기기의 스크린샷은 919x1879 px 로 돌아온다. 가로·세로 **모두 같은 배율**이다:

    point = 픽셀 × (402 / 919) = 픽셀 × 0.4374

세로를 `874/1879 = 0.4651` 로 잡으면 아래로 갈수록 7% 씩 밀린다. 카드처럼 큰 타깃은
그래도 맞아서 한동안 모르다가, **하단의 44pt 원형 글래스 버튼(저장·드로어)만 전부 빗나간다.**
"저장 버튼이 죽었다"고 오진했다가 좌표를 고치니 한 번에 눌렸다 — 코드를 의심하기 전에
**같은 화면의 큰 버튼(예: 헤더 좌측 xmark)이 눌리는지로 배율부터 검증할 것.**
402x874 기준 화면 밖(음수, 402·874 초과)을 찍지 않게도 주의.

- **화면 가장자리 4pt 안쪽에서 시작하는 swipe는 OS 제스처가 된다**(좌=뒤로가기, 상=알림센터,
  하=홈/앱스위처, 우=제어센터). 리스트 스크롤은 x를 200 근처로 잡아 가운데에서 끈다.
- 앱 재시작은 `xcrun simctl terminate <udid> com.augmentlab` + `launch`. ⌘R(리로드)로는
  **네이티브 네비게이션 바 상태가 초기화되지 않아** 헤더 관련 검증이 오염된다.

### 딥링크는 라우트 확인용으로만

`open_url "augmentlab://aram?championId=Ahri"` 는 iOS 26이 **"'증강 연구소'에서 열겠습니까?"
확인 다이얼로그**를 띄운다(앱 종료 상태여도 뜬다). "열기"를 탭해야 진행된다. 라우트 존재/부재
확인(삭제된 라우트가 `Unmatched Route`를 내는지)에는 유용하지만, 일반 플로우는 UI 클릭이 빠르다.

## 4. 앱까지 도달하기

1. dev launcher에서 **"Augment Lab" dev server 카드** 탭 → 번들 로드
2. dev menu 안내 시트 → **Continue**
3. dev menu가 열리면 우상단 **X**로 닫기

## 5. 드라이브할 만한 플로우

```
홈(빌드 목록) → [+] → mode-select → 칼바람/아레나
  → select-champion-modal (챔피언 선택 + '용기' 물음표)
  → /aram (landscape 잠금, 증강 카드 3장 × 4라운드)
  → /aram-items (아이템 선택, 저장 체크만 있고 나가기 버튼 없음)
  → build/[id] (collapsing 헤더, 증강/아이템/합산 스탯)
마이페이지 탭 → SwiftUI List(insetGrouped) + Section + Picker
  → 데이터 관리 (백업·복원 / 초기화 두 섹션)
```

- landscape 잠금 화면(`/aram`, `/aram-items`, `/arena`)은 시뮬레이터 창이 세로라
  **콘텐츠가 90° 회전**해 보인다. 정상이다. 탭 좌표는 스크린샷에 보이는 그대로 쓴다.
- `/aram-items`의 출구는 헤더 좌측 **나가기(xmark)** 와 우측 **저장(checkmark)** 두 개다.

## 6. 함정

- **조작 후에는 반드시 screenshot으로 상태를 확인하고 다음 단계로 갈 것.** "dev menu가 열렸겠지"
  가정하고 닫기 좌표를 눌렀다가, 메뉴가 없어서 그 탭이 챔피언 그리드에 떨어져 선택이 바뀐 적이
  있다. 빗나간 탭은 조용히 다른 걸 누른다.
- **expo dev-client의 톱니 FAB가 헤더 우측 버튼을 덮는다.** 챔피언 선택 화면의 시작(체크)
  버튼이 대표적 — FAB 와 체크 버튼의 원이 거의 정확히 겹쳐서 탭이 매번 dev menu 로 먹힌다.
  FAB를 `swipe`로 아래로 치우고 누를 것. 드래그가 탭으로 인식돼 dev menu가
  열릴 수 있으니, 열리면 X로 닫고 다시 누른다.
  치워도 계속 먹히면 두 가지 우회가 있다:
  dev menu 를 열어 아래로 스크롤 → **`Tools button` 토글을 끄거나**,
  아예 **딥링크로 목적지에 직행**한다(`augmentlab://arena?championId=Garen`).
- **시스템 공유 시트·문서 피커는 앱이 아니라 OS UI다.** 백업(공유 시트)·복원(파일 앱)처럼
  OS 시트로 나가는 플로우는 시트가 뜬 것까지 확인하고 취소로 되돌린다. 시뮬레이터의 파일 앱은
  비어 있어 실제 파일 왕복은 iCloud/드래그앤드롭 없이는 안 된다 — 저장까지 검증하려면
  `xcrun simctl addmedia`/컨테이너 경로(`xcrun simctl get_app_container <udid> com.augmentlab data`)로
  파일을 직접 넣고 확인하는 편이 빠르다.
- **클린 설치 검증 전에 저장소를 통째로 복사해 둘 것.** 첫 설치 프리웜을 보려면 앱을 지워야
  하는데(이미지 디스크 캐시까지 비워야 진짜 첫 설치다) 그러면 빌드·테마·로케일이 다 날아간다.
  `RCTAsyncLocalStorage_V1` 디렉터리를 `cp -R` 로 떠 두었다가, 검증 후 앱을 terminate 하고
  새 컨테이너에 되돌리면 그대로 복구된다(컨테이너 UUID는 재설치 때 바뀌므로 다시 조회할 것).
- **화면만 보고 데이터가 맞다/틀리다 단정하지 말 것.** 저장소 원본을 열어 대조하면 끝난다:
  `<container>/Library/Application Support/com.augmentlab/RCTAsyncLocalStorage_V1/`.
  큰 값은 `manifest.json`에 `null`로 남고 **옆 해시 파일**에 실제 문자열이 들어 있다.
  (빌드 목록이 빈 걸 보고 "복원 누락"이라 적을 뻔했는데, 원본을 보니 그 모드 빌드가 원래 0개였다.)
- **가로 화면 오른쪽 끝의 버튼이 안 눌리면 코드가 아니라 safe area를 의심할 것.**
  `SafeAreaView edges`에 `"right"`가 없으면 그 자리는 홈 인디케이터 제스처 영역이라
  시스템이 탭을 가져간다. 버튼은 멀쩡히 보이고 히트박스도 정상이라 한참 헤맨다.
- `typedRoutes` 타입(`.expo/types/router.d.ts`)은 `expo export`로는 생성되지 않는다.
  `expo start`를 잠깐 띄워야 생긴다.
- **`git checkout -- <파일>` 로 실험을 되돌리지 말 것.** 스테이징되지 않은 변경이 있으면
  그것까지 날아간다. 역편집하거나 미리 `git stash` 할 것.

## 6-1. 애니메이션은 스크린샷으로 검증되지 않는다

등장 **순서**와 **감속 곡선**은 정지 프레임으로 판정할 수 없다. 애니메이션 변경은 "오버레이가
뜬다"까지만 확인하고, 곡선·순서는 코드 수준 보장으로 남긴 뒤 문서에 그렇게 적을 것.
잡았다고 우기지 말 것.

## 7. 기록

런타임 동작이 바뀌는 변경을 검증했으면 `docs/verification/` 에 결과를 남긴다.
형식과 규칙은 `docs/verification/README.md` 참고.

**이 skill의 산출물은 문서 `.md` 하나뿐이다.** 스크린샷은 검증을 *수행하는 수단*이지
*결과물*이 아니다. 저장소에 커밋하지 않는다(`docs/verification/assets/` 는 `.gitignore` 에 있다).

화면에서 본 것은 **글로 옮겨 적는다.** "large title이 정상 복원됐다", "X 버튼이 우측 끝에서
잘리지 않는다" 처럼, 이미지를 열지 않고도 판정을 재구성할 수 있게 쓴다.

사용자에게 화면을 직접 보여줘야 하면 `attach`로 라이브 패널을 열어 주는 게 1순위다. 정지 이미지가
필요하면 스크린샷을 Artifact 페이지에 data URI로 임베드해 링크를 전달한다.
