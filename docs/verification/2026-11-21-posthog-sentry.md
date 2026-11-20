# PostHog(사용자 지표) + Sentry(크래시) 도입 검증

- 날짜: 2026-11-21
- 기기: iPhone 17 Pro 시뮬레이터 (iOS 26.5), **Release** 빌드(`__DEV__=false`, EAS 배포와 같은 경로)
- 플랜: [2026-11-21-사용자-지표-posthog-sentry](../plans/2026-11-21-사용자-지표-posthog-sentry.md)

## Verdict: PASS

실제 PostHog·Sentry 계정이 아직 없어서, 키를 **로컬 가짜 수집 서버**(`http://localhost:8787`)로 잠시 바꿔
앱이 보내는 요청을 그대로 받아 읽었다. 검증 후 임시 키·크래시 트리거는 원복했다.

## Steps

1. `npx expo prebuild` → `pod install` (PostHog 3.98.2, posthog-react-native-plugin 2.13.3, RNSentry 7.11.0)
2. Release 빌드 3회 — Sentry 소스맵 업로드 단계 실측
3. 앱 실행 → 홈 30초 → 티어리스트 13초 → 홈 버튼(백그라운드) 8초 → 복귀 → 티어리스트 6초 → 마이페이지
   (처리된 에러 1건 발생시킴) → + → 모드 선택 19초 → 칼바람 → 챔피언 선택 → 앱 강제 종료 → 재실행 →
   마이페이지 → 데이터 관리(1.5초 뒤 잡히지 않은 에러로 **앱 크래시**) → 재실행
4. 키를 빈 값으로 되돌려 다시 Release 빌드 → 실행 → 탭 이동

## Findings

### Sentry 업로드 단계 — 배포 빌드가 깨질 뻔했다
| 설정 | 결과 |
|---|---|
| 아무것도 없음 | **BUILD FAILED** — `An organization ID or slug is required` |
| `SENTRY_ALLOW_FAILURE=true` | BUILD SUCCEEDED 인데 앱에 **`main.jsbundle` 없음** → 실행 즉시 죽는 앱 |
| `SENTRY_DISABLE_AUTO_UPLOAD=true` | BUILD SUCCEEDED, 번들 6.8MB 포함, 정상 부팅 ✅ → `eas.json` 에 채택 |

`ALLOW_FAILURE` 는 "빌드 성공"이라 겉보기엔 멀쩡해서 가장 위험했다.

### PostHog — 화면 이동·체류시간
가짜 서버가 받은 순서(요약):

| 이벤트 | 화면 | 체류 | 실제 머문 시간 |
|---|---|---|---|
| Application Installed / Opened | | | |
| `$screen` → `screen_left` | `/(tabs)/(home)` | 31초 | 약 30초 ✅ |
| `$screen` → `screen_left` | `/(tabs)/(tierlist)` | 13초 (백그라운드 전환 시점에 전송) | 13초 ✅ |
| Application Backgrounded → Became Active | (마지막 화면 = 티어리스트로 기록) | | |
| `screen_left` | `/(tabs)/(tierlist)` | 7초 (복귀 후부터 다시 잼) | 약 6초 ✅ |
| `$screen` → `screen_left` | `/(tabs)/(mypage)` | 5초 | 약 6초 ✅ |
| `$screen` → `screen_left` | `/mode-select` | 19초 | 19초 ✅ |
| `$screen` | `/select-champion-modal` | | |

- 백그라운드에 있던 8초는 체류시간에 안 섞였다(복귀 후 7초만 기록).
- 강제 종료 직전에 쌓인 이벤트는 디스크에 남았다가 다음 실행 때 전송됐다.
- 세션 리플레이 스냅샷(`$snapshot`, 장당 7~26KB)이 `/s/` 로 계속 들어왔다.
- PostHog는 모든 이벤트에 그 순간의 화면 이름을 붙인다 → `Application Backgrounded` 의 화면 = **앱을 떠난 화면**.

### Sentry — 에러·크래시
- 처리된 에러: `Error: smoke: handled`, 태그 `screen=/(tabs)/(mypage)`, 이동 기록
  `/(tabs)/(home) → /(tabs)/(tierlist) → /(tabs)/(mypage)`, **스크린샷 첨부** 9KB, release `com.augmentlab@1.6.0+1`.
- 크래시: 데이터 관리 화면에서 앱이 죽고, **다음 실행 때** `fatal` 이벤트로 전송.
  `screen=/(tabs)/(mypage)/data`, 이동 기록 `home → mypage → mypage/data`, 스크린샷 12KB.
- 세션 envelope 도 들어와 Sentry의 "크래시 없는 세션 비율"이 집계된다.

### 키가 빈 상태(지금 커밋되는 상태)
- 앱 정상 부팅·탭 이동 정상, 가짜 서버로 나간 요청 **0건** — 키를 넣기 전엔 아무것도 수집하지 않는다.

### 마찰·한계
- `simctl terminate`(강제 종료)처럼 백그라운드를 거치지 않고 죽으면 마지막 화면의 `screen_left` 는 안 나간다.
  실제 사용자가 앱 전환기에서 쓸어 닫으면 백그라운드를 먼저 거치므로 거의 영향 없다.
- 챔피언을 탭해도 ✓ 를 눌러야 드래프트로 들어가서 이번엔 `/aram` 까지는 안 갔다(화면 추적은 라우트 공통 로직이라 같은 방식으로 기록됨).
- 실제 PostHog·Sentry 대시보드 표시는 키를 받은 뒤 확인해야 한다.

## 2차 — 실제 키 반영 (같은 날)

- PostHog 키: `/flags` 호출로 **US 리전** 프로젝트임을 확인(EU는 `authentication_failed`), 응답의 `sessionRecording` 이 켜져 있음.
- Sentry DSN·org(`aram-augment-lab`)·project(`augment-lab-app`) 반영.
- EAS `production` 에 `SENTRY_AUTH_TOKEN`(sensitive) 등록 확인. `eas env:exec production` 으로 sentry-cli 실행 →
  인증 성공(scope `org:ci`), `releases list --project augment-lab-app` exit 0 → 업로드 권한 있음.
- 그래서 `eas.json` **production** 은 업로드 차단 줄을 뺐다(소스맵·dSYM 업로드). 토큰이 없는 **preview** 는
  `SENTRY_DISABLE_AUTO_UPLOAD=true` 를 유지 — 빼면 위 표의 BUILD FAILED 가 난다.
- 실제 대시보드 수신은 새 버전 배포 후 확인 대상.

## 3차 — 실제 PostHog·Sentry로 전송 (같은 날)

- `eas env:exec production` 으로 EAS의 `SENTRY_AUTH_TOKEN` 을 실어(값은 출력 안 함) Release 빌드 →
  **소스맵 업로드 성공**(release `com.augmentlab@1.6.0+1`, dist 1, artifact bundle) + **dSYM 59개 업로드** + BUILD SUCCEEDED.
  production 빌드에서 일어날 업로드 경로가 실제로 통과함.
- 임시 트리거(마이페이지=처리된 에러, 데이터 관리=크래시)를 넣고 홈 → 티어리스트 → 마이페이지 → + → 칼바람 →
  가렌 → 시작하기(드래프트 진입 확인) → 백그라운드 → 재실행 → 데이터 관리(크래시) → 재실행.
- 앱 네트워크 로그: `us.i.posthog.com/batch/`(이벤트), `/s/`(리플레이), `us-assets.i.posthog.com/.../config` 접속 확인.
- Sentry: 앱 캐시의 미전송 envelope 폴더가 비어 있음 → 전송 완료(실패 시 재시도용으로 남는다).
- 대시보드 수신 확인은 사용자 몫(내 쪽 토큰 `org:ci` 는 이슈 조회 권한이 없다).
- 임시 트리거 원복 후 깨끗한 Release로 재빌드·재설치(업로드 끔).
