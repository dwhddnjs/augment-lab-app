# 포르카나 → 증강연구소 전환 설명서 (Google Play)

**목표**: 새 앱을 등록하지 않고, 이미 Play에 있는 porcana(`com.porcana`)에 **증강연구소 Android 앱을 업데이트로 올린다.**
그러면 신규 개인 계정 앱에 걸리는 12명·14일 비공개 테스트를 거치지 않는다.

**왜 되는가**
- 공식 도움말 기준으로, 이 테스트 요건은 *2023-11-13 이후 만든 개인 계정*이 *앱의 프로덕션 접근 권한을 신청할 때* 적용된다.
- 이미 프로덕션에 나가 있는 앱의 업데이트에 테스트를 다시 요구한다는 문구는 없다("업데이트 전에 계속 테스트하라"는 권장뿐).

> 이 문서의 체크박스는 사용자가 직접 체크한다. 각 단계는 Play Console 웹에서 한다.

---

## 0. 사전 확인 — 하나라도 안 되면 이 방법은 쓸 수 없다

- [ ] **porcana가 프로덕션 트랙에 출시돼 있다**
  - 확인: Play Console → porcana → 테스트 및 출시 → **프로덕션**에 "사용 가능" 상태의 버전이 있는가
  - ⚠️ `porcana-app/eas.json`의 submit track이 `internal`이다. 내부 테스트에만 올렸다면 프로덕션 접근 권한이 없다 → 이 방법으로도 12인 테스트를 피할 수 없다(§6 대안).
- [ ] **증강연구소를 낼 개발자 계정이 porcana가 있는 계정과 같다**
  - 다르면 앱 이전(App transfer)이 먼저 필요하다. 같은 계정이면 할 일 없음.
- [ ] **Play App Signing을 쓴다**
  - 확인: Play Console → porcana → 테스트 및 출시 → 앱 무결성 → 앱 서명
  - `~/Desktop/google keys/porcana/upload_cert.pem`이 있으니 쓰고 있을 가능성이 높다.
- [ ] **업로드 키를 쓸 수 있다**
  - 키 파일: `~/Desktop/google keys/porcana/@dwhddnjs__porcana-app.jks` (EAS가 만든 키)
  - 비밀번호·alias 확인: porcana 폴더에서 `eas credentials -p android` → production → Keystore → 자격 증명 보기
  - **잃어버렸다면**: Play App Signing을 쓰는 경우 업로드 키를 재설정할 수 있다(앱 서명 키는 Google이 보관하므로 앱은 잠기지 않는다).
    1. 새 업로드 키를 만든다: `keytool -genkeypair -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
    2. PEM으로 내보낸다: `keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_certificate.pem`
    3. Play Console → 앱 무결성 → 앱 서명 → **업로드 키 재설정 요청** → 사유 입력 + PEM 업로드
    4. 승인되면 새 키로 서명한다(처리 기간은 공식 문서에 없음 — 여유를 둔다)
- [ ] **porcana의 현재 versionCode를 적어 둔다**: `______`
  - 확인: porcana 폴더에서 `eas build:version:get -p android`, 또는 Play Console → App Bundle 탐색기
  - 증강연구소의 versionCode는 **이 값보다 커야** 업로드된다.

## 1. 바뀌지 않는 것 / 바뀌는 것

| 그대로 남는 것 | 바꾸는 것 |
|---|---|
| 패키지명 `com.porcana` (영구) | 앱 이름·아이콘·스크린샷·설명 |
| 스토어 URL `play.google.com/store/apps/details?id=com.porcana` | 카테고리·연락처 |
| 기존 리뷰·평점·설치 수 | 콘텐츠 등급(설문 다시) |
| 개발자 계정 | 데이터 보안·개인정보처리방침 |

- 패키지명은 **절대 바꾸지 않는다**. 바꾸면 Play가 새 앱으로 보고, 다시 12인 테스트 대상이 된다.
- 코드 안 패키지(`namespace`)는 `com.augmentlab`으로 따로 둔다. 사용자에게는 보이지 않는다.

## 2. 빌드 설정 (A-00 · A-43 작업에서 반영)

```kotlin
// native/android/app/build.gradle.kts
android {
    namespace = "com.augmentlab"
    defaultConfig {
        applicationId = "com.porcana"      // 영구 고정
        versionCode = <porcana 값 + 1 이상>
        versionName = "2.0.0"
        minSdk = 26
        targetSdk = 36                     // 2026-08-31부터 업데이트에도 필수
    }
    signingConfigs { create("release") { /* keystore.properties에서 읽음 */ } }
}
```

- `native/android/keystore.properties`(gitignore)에 `storeFile`, `storePassword`, `keyAlias`, `keyPassword`
- `*.jks`는 이미 gitignore되어 있다. 키 파일은 저장소에 넣지 않는다.
- 빌드: `./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`

## 3. 기존 포르카나 정리 (출시 전에)

- [ ] **회원 개인정보 처리**
  - porcana는 로그인(Google·Apple)과 서버(`api.porcana.co.kr`, Supabase)를 썼다. 서비스가 끝나므로 보관 중인 회원 정보를 **파기**하거나, 남길 이유가 있으면 개인정보처리방침에 고지한다.
  - 가능하면 출시 전에 종료를 공지한다.
- [ ] **EAS Update에 porcana 업데이트를 더 게시하지 않는다** — 옛 설치본이 받는 일을 막는다.
- [ ] **기기에 남은 porcana 데이터**: 앱이 첫 실행 때 지운다(A-45). 따로 할 일 없음.
- [ ] **iOS porcana(App Store)** 는 별개라 이번 작업과 상관없다(필요하면 판매 중지만 따로).

## 4. Play Console 순서

**4-1. 앱 콘텐츠** (정책 → 앱 콘텐츠)
- [ ] **개인정보처리방침 URL** → 증강연구소 것으로 바꾼다. 분석(PostHog, 화면 녹화인 세션 리플레이 포함)과 오류 수집(Sentry)을 적는다.
- [ ] **앱 액세스**: 로그인 없이 모든 기능 사용 가능
- [ ] **광고**: 없음
- [ ] **콘텐츠 등급**: 설문을 다시 한다(게임 정보 도우미, 사용자 간 소통 없음, 구매 없음)
- [ ] **타겟층**: 아동 대상이 아님. 연령대는 LoL 이용 연령을 고려해 고른다.
- [ ] **데이터 보안** — iOS 개인정보 매니페스트와 맞춘다

  | 항목 | 수집 | 공유 | 목적 |
  |---|---|---|---|
  | 앱 활동 > 앱 상호작용 | O | X | 분석 |
  | 앱 정보 및 성능 > 비정상 종료 로그 | O | X | 앱 기능 |
  | 앱 정보 및 성능 > 진단 | O | X | 앱 기능 |
  | 개인 정보·계정·위치·연락처 | X | – | – |

  - 전송 중 암호화: 예. 계정이 없으므로 계정 삭제 항목은 해당 없음.
  - 옛 porcana 항목(계정·이름·이메일 등)은 **지운다**.

**4-2. 스토어 등록정보** (성장 → 기본 스토어 등록정보)
- [ ] **앱 이름**: `증강연구소` / en-US `Augment Lab` (30자 이내)
  - 제목에 `리그 오브 레전드`·`LoL`·`롤`·`칼바람` 같은 타사 상표를 넣지 않는다.
- [ ] **짧은 설명**(80자), **전체 설명**
  - 설명 끝에 Riot 고지문(마이페이지 footer와 같은 문구)을 넣는다.
- [ ] **그래픽**: 아이콘 512×512, 그래픽 이미지 1024×500, 휴대전화 스크린샷 2~8장(ko·en)
- [ ] **카테고리**: iOS와 같은 성격으로 고른다
- [ ] **번역**: en-US 추가

**4-3. 출시**
- [ ] 테스트 및 출시 → **내부 테스트**에 AAB 업로드
  - 내부 테스트는 12인 요건과 상관없다.
  - 테스터 목록에 본인을 넣고, 링크로 기기에 설치해 확인한다.
  - porcana가 깔린 기기에 **업데이트로 덮어 설치**되는지도 본다(A-42).
- [ ] 같은 버전을 **프로덕션**으로 승격 → 출시 노트에 공지를 쓴다:
  > 포르카나 서비스가 종료되고 **증강연구소**로 새로 태어났습니다. 칼바람 나락 증강 드래프트 연습·빌드 저장·티어리스트를 제공합니다.
- [ ] 단계적 출시는 선택 사항이다. 사용자가 적으면 100%로 바로 내도 된다.
- [ ] 심사를 기다린다. 이름·아이콘이 바뀌어 메타데이터 심사가 함께 돈다. 며칠 여유를 둔다.

## 5. 위험 요소

- **평점이 이어진다**: porcana의 리뷰·평점이 증강연구소 페이지에 그대로 보인다. 낮다면 그대로 안고 간다. 필요하면 리뷰에 답글을 단다.
- **정책**
  - 확인한 공식 도움말 범위에는 "다른 앱으로 바꾸는 업데이트"를 막는 문구가 없었다.
  - 다만 기존 사용자를 속이는 것으로 보이면 기만·메타데이터 정책에 걸릴 수 있다 → **출시 노트 공지와 정확한 설명**으로 대비한다.
- **기존 설치자**: 업데이트를 받으면 전혀 다른 앱이 된다. 공지가 이 혼란을 줄인다.
- **노출 제한**: porcana가 오래 업데이트되지 않았다면 이미 신규 사용자 노출이 제한됐을 수 있다. targetSdk 36 업데이트로 풀린다.

## 6. 이 방법을 못 쓸 때 (대안 한 줄)

- 조직 계정(D-U-N-S 번호)으로 새 개발자 계정을 만들면 12인 테스트 대상이 아니다. 대신 비용과 심사 시간이 든다.
- 그게 아니면 12명·14일 비공개 테스트를 그대로 진행한다.

## 참고 (공식 문서)

- 테스트 요건: https://support.google.com/googleplay/android-developer/answer/14151465
- 업로드 키 재설정: https://support.google.com/googleplay/android-developer/answer/9842756
- 대상 API 수준: https://support.google.com/googleplay/android-developer/answer/11926878
