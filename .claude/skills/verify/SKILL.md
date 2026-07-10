---
name: verify
description: iOS 시뮬레이터에서 Augment Lab 앱을 띄우고 화면을 클릭으로 조작해 변경을 눈으로 검증한다. 빌드/실행/터치 주입/좌표 매핑 레시피.
---

# Augment Lab — iOS 시뮬레이터 검증

이 앱은 **iOS 전용**이고 `expo-dev-client` + `@expo/ui`(SwiftUI) + `expo-glass-effect`를 쓴다.
Expo Go로는 못 띄운다. 네이티브 빌드가 필요하다.

## 1. 빌드 & 실행

`ios/`는 CNG(gitignore)라 없으면 `run:ios`가 prebuild부터 한다. **첫 빌드 10~25분**이므로
`run_in_background: true`로 돌리고 완료 알림을 기다릴 것.

```bash
# iOS 26+ 시뮬레이터를 골라야 NativeTabs 리퀴드글래스 / glass-button 경로가 렌더된다.
xcrun simctl list devices available | grep -A5 'iOS 26'
SIM=<udid>
xcrun simctl boot $SIM; open -a Simulator
npx expo run:ios --device $SIM     # ← 백그라운드로
```

빌드 후 앱은 dev launcher로 열린다. dev server(8081)가 떠 있어야 번들이 로드된다.

## 2. 터치 주입 — `cliclick` (접근성 권한 필요)

- `xcrun simctl`에는 tap 명령이 **없다**.
- `osascript`의 `click at {x,y}`는 실제 CGEvent를 만들지 않아 **먹지 않는다**.
- `idb-companion`은 Xcode 26에서 동작하지 않았다(2022 빌드). 시간 낭비하지 말 것.
- **`brew install cliclick`** 가 정답. 단, 시스템 설정 > 개인정보 보호 및 보안 > **손쉬운 사용**에서
  터미널(Warp 등)을 허용해야 한다. 막혀 있으면 사용자에게 켜 달라고 요청할 것.

### 좌표 매핑 (핵심)

스크린샷은 device 픽셀(@3x), 클릭은 macOS 스크린 포인트다. 베젤 오프셋은 **상하 비대칭**이다.

```bash
# 창 위치/크기
osascript -e 'tell application "System Events" to tell process "Simulator" \
  to return {position, size} of first window'
# 예: position=2103,162  size=456x972   (device = 402x874 pt)
# 좌우 베젤 27씩, 상단 71(=베젤27+타이틀44), 하단 27  → 71+874+27=972 ✓
```

```bash
tap() {  # usage: tap <pt_x> <pt_y>
  OX=2103; OY=162; BX=27; BY=71     # ← 창 이동 시 OX/OY 재측정
  osascript -e 'tell application "Simulator" to activate'; sleep 0.4
  cliclick m:$((OX+BX+$1)),$((OY+BY+$2)) w:80 c:$((OX+BX+$1)),$((OY+BY+$2))
}
```

스크린샷 픽셀 → pt 변환: `pt = 원본픽셀 / 3` (device 402x874pt = 1206x2622px).

축소본을 보고 좌표를 읽을 때는 **`sips -Z N` 이 긴 변을 N으로 맞춘다**는 걸 잊지 말 것.
세로 스크린샷을 `-Z 420` 하면 폭은 420이 아니라 **193**이다. 폭을 420으로 착각하면 배율이
통째로 틀어져 클릭이 엉뚱한 데 떨어진다. 매번 실제 크기를 읽고 배율을 계산할 것:

```bash
sips -Z 420 shot.png --out small.png
sips -g pixelWidth small.png     # → 193
# 배율 = 402 / 193 = 2.083   →   pt = 표시좌표 × 2.083
```

가로 화면은 스크린샷이 세로 픽셀 그대로다. 헤더를 눈으로 보려면 `sips -r 270` 으로 돌려 보되,
**탭 좌표는 세로 기준으로 되돌려서** 줘야 한다: `px = 402 - ly`, `py = lx`.

버튼 중심을 정확히 알아야 하면 원본을 crop해서 볼 것 — 축소본에서 눈대중한 중심은 자주 빗나간다.
`sips -c <height> <width> --cropOffset <y> <x> shot.png`

캡처: `xcrun simctl io $SIM screenshot out.png`

**⌘←(창 회전)은 창 위치를 바꾼다.** 쓰지 말 것. 썼다면 `OX/OY`를 다시 재야 한다.

**탭이 안 먹으면 앱을 의심하기 전에 창 위치부터 다시 재라.** 시뮬레이터 창은 회전·재시작·
사용자 조작으로 슬며시 움직인다. 오프셋이 낡으면 모든 클릭이 창 밖으로 나가고, 그게
"버튼이 죽었다"처럼 보인다(실제로 이걸로 없는 버그를 두 번 진단했다). **캡처 직전마다**:

```bash
osascript -e 'tell application "System Events" to tell process "Simulator" \
  to return {position, size} of first window'
```

앱 코드가 아니라 입력이 문제인지 가르는 가장 빠른 방법은 **딥링크**다. 딥링크로 화면이
뜨는데 탭으로는 안 뜨면 좌표/창 위치 문제다.

## 3. 앱까지 도달하기

1. dev launcher에서 **"Augment Lab" dev server 카드** 클릭 → 번들 로드
2. dev menu 안내 시트 → **Continue**
3. dev menu가 열리면 우상단 **X**로 닫기

### 딥링크는 라우트 확인용으로만

`xcrun simctl openurl $SIM "augmentlab://aram?championId=Ahri"` 는 iOS 26이
**"'증강 연구소'에서 열겠습니까?" 확인 다이얼로그**를 띄운다(앱 종료 상태여도 뜬다).
"열기"를 `tap 274 472`로 눌러야 진행된다. 라우트 존재/부재 확인(예: 삭제된 라우트가
`Unmatched Route`를 내는지)에는 유용하지만, 일반 플로우는 그냥 UI를 클릭하는 게 빠르다.

## 4. 드라이브할 만한 플로우

전체 경로 (portrait ↔ landscape 전환이 섞여 있어 회귀가 잘 드러난다):

```
홈(빌드 목록) → [+] → mode-select → 칼바람/아레나
  → select-champion-modal (챔피언 선택 + '용기' 물음표)
  → /aram (landscape 잠금, 증강 카드 3장 × 4라운드)
  → /aram-items (아이템 선택, 저장 체크만 있고 나가기 버튼 없음)
  → build/[id] (collapsing 헤더, 증강/아이템/합산 스탯)
마이페이지 탭 → SwiftUI List(insetGrouped) + Section + Picker
```

- landscape 잠금 화면(`/aram`, `/aram-items`, `/arena`)은 시뮬레이터 창이 세로라
  **콘텐츠가 90° 회전**해 보인다. 정상이다. 좌표는 스크린샷 기준 그대로 쓰면 된다.
- `/aram-items`의 출구는 헤더 좌측 **나가기(xmark)** 와 우측 **저장(checkmark)** 두 개다.
  나가기는 확인 Alert → portrait 복귀 → 홈(미저장).

## 5. 함정

- **expo dev-client의 톱니 FAB가 헤더 우측 버튼을 덮는다.** 챔피언 선택 화면의 시작(체크)
  버튼이 대표적. FAB를 아래로 드래그해 치우고 누를 것. 단 드래그가 탭으로도 인식돼
  dev menu가 열릴 수 있으니, 열리면 X로 닫고 다시 누른다.
- **조작 후에는 반드시 스크린샷으로 상태를 확인하고 다음 단계로 갈 것.** "dev menu가 열렸겠지"
  가정하고 닫기 좌표를 눌렀다가, 메뉴가 없어서 그 클릭이 챔피언 그리드에 떨어져 선택이
  바뀐 적이 있다. 빗나간 클릭은 조용히 다른 걸 누른다.
- 좌표가 빗나가면 **베젤 오프셋을 의심할 것.** 상하 비대칭(71/27)이다. 균일하다고 가정하면
  버튼 경계 근처에서 아슬하게 빗나가 아무 반응이 없다.
- `typedRoutes` 타입(`.expo/types/router.d.ts`)은 `expo export`로는 생성되지 않는다.
  `expo start`를 잠깐 띄워야 생긴다. 라우트 문자열을 tsc로 검증하려면 이게 먼저다.
- **가로 화면 오른쪽 끝의 버튼이 안 눌리면 코드가 아니라 safe area를 의심할 것.**
  `SafeAreaView edges`에 `"right"`가 없으면 그 자리는 홈 인디케이터 제스처 영역이라
  시스템이 탭을 가져간다. 버튼은 멀쩡히 보이고 히트박스도 정상이라 한참 헤맨다.
  (실제로 `/aram-items` 저장 버튼이 이걸로 죽어 있었다.)
- **`git checkout -- <파일>` 로 실험을 되돌리지 말 것.** 스테이징되지 않은 변경이 있으면
  그것까지 날아간다. 실험 되돌리기는 Edit으로 역편집하거나, 미리 `git stash` 할 것.
- 앱 재시작은 `xcrun simctl terminate $SIM com.augmentlab` + `launch`. ⌘R(리로드)로는
  **네이티브 네비게이션 바 상태가 초기화되지 않아** 헤더 관련 검증이 오염된다.

## 5-1. 애니메이션은 스크린샷으로 검증되지 않는다

등장 **순서**와 **감속 곡선**은 정지 프레임으로 판정할 수 없다. `simctl io screenshot` 자체가
수백 ms 걸려 원하는 프레임을 못 잡는다. 애니메이션 변경은 "오버레이가 뜬다"까지만 확인하고,
곡선·순서는 코드 수준 보장으로 남긴 뒤 문서에 그렇게 적을 것. 잡았다고 우기지 말 것.

## 6. 기록

런타임 동작이 바뀌는 변경을 검증했으면 `docs/verification/` 에 결과를 남긴다.
형식과 규칙은 `docs/verification/README.md` 참고.

**스크린샷은 커밋하지 않는다.** 관찰한 것을 문서에 글로 적는다. 사용자에게 화면을 보여줘야
하면(원격·모바일에서 결과를 확인하는 경우) `sips -Z 480` 으로 리사이즈한 뒤 Artifact 페이지에
data URI로 임베드해 링크를 전달한다. 저장소에는 남기지 않는다.
