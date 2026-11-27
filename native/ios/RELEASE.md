# iOS 네이티브 출시 절차 (아카이브 → TestFlight)

RN은 EAS(`eas build -p ios --profile production`)로 올렸다. 네이티브는 Xcode에서 직접 아카이브한다. 번들 ID `com.augmentlab`이 같아 App Store Connect의 같은 앱에 새 빌드로 올라간다.

## 0. 한 번만

- **서명**: Xcode → AugmentLab 타깃 → Signing & Capabilities → *Automatically manage signing*(`CODE_SIGN_STYLE = Automatic`), 팀 `W6FUWFHBPW`(RN 앱과 같은 팀)가 프로젝트에 들어 있다. 이 Mac에는 개발 인증서만 있어서, 처음 내보낼 때 Xcode가 배포 인증서를 만들도록 Xcode에 Apple ID 로그인이 필요하다.
- **Sentry 토큰**: dSYM 업로드는 `SENTRY_AUTH_TOKEN` 환경변수를 읽는다(EAS production 환경에 있는 것과 같은 값, Sentry → Settings → Auth Tokens). Xcode를 터미널에서 띄워 넘긴다.
  ```sh
  SENTRY_AUTH_TOKEN=<토큰> open native/ios/AugmentLab.xcodeproj
  ```
  토큰 없이 아카이브해도 빌드는 통과한다(경고 "SENTRY_AUTH_TOKEN 없음"만 나온다). 그때는 6번처럼 나중에 올린다.

## 1. 빌드 번호

- 버전은 `MARKETING_VERSION = 2.0.0`.
- 빌드 번호(`CURRENT_PROJECT_VERSION`)는 **EAS 원격 값보다 커야 한다**. 확인: `eas build:version:get -p ios` (2026-11-27 기준 24 → 프로젝트는 25).
- 다음 빌드마다 1씩 올린다(Xcode → General → Build, 또는 pbxproj의 두 곳).
- 올린 뒤 **EAS 원격 값도 맞춘다**: `eas build:version:set -p ios` → 방금 올린 번호. 안 맞추면 나중에 RN 핫픽스를 EAS로 빌드할 때 번호가 겹쳐 App Store Connect가 거부한다.

## 2. 아카이브

1. 스킴 `AugmentLab`, 대상 **Any iOS Device (arm64)**.
2. Product → **Archive**. Release 구성이고 `DEBUG_INFORMATION_FORMAT = dwarf-with-dsym`이라 dSYM이 같이 만들어진다.
3. 빌드 단계 **Upload dSYM to Sentry**(`Scripts/upload-dsym.sh`)가 Release에서만 돈다. Debug·시뮬레이터 빌드에서는 아무것도 안 한다. 끄려면 `SENTRY_DISABLE_AUTO_UPLOAD=true`.

## 3. 업로드

Organizer(Window → Organizer)가 자동으로 뜬다 → 방금 아카이브 → **Distribute App** → *App Store Connect* → *Upload* → 기본값으로 진행.

- 수출 규정 질문은 나오지 않는다(`ITSAppUsesNonExemptEncryption = false`).
- 개인정보 매니페스트(`AugmentLab/PrivacyInfo.xcprivacy`)는 RN `app.json`의 `privacyManifests`와 같다. SDK(Sentry·PostHog·SDWebImage)는 각자 매니페스트를 들고 온다.

## 4. TestFlight

App Store Connect → 앱 → TestFlight. 처리(보통 10~30분)가 끝나면 내부 테스터에게 바로 열린다. 기기에서 TestFlight 앱으로 설치한다.

## 5. 확인 (I-43 사용자 확인 2줄)

- [ ] TestFlight 빌드가 기기에서 실행된다.
- [ ] Sentry에 테스트 오류가 심볼과 함께 찍힌다.
  - dSYM이 올라갔는지: Sentry → Project Settings → **Debug Files**에 이 빌드의 UUID가 있다(`dwarfdump --uuid <아카이브>/dSYMs/AugmentLab.app.dSYM`로 대조).
  - 실제 오류: 앱에 테스트 크래시 버튼은 없다. 확인용 빌드에서만 임시로 `SentrySDK.capture(message: "I-43 test")`를 한 번 부르고, 이벤트의 스택에 함수 이름·줄 번호가 보이면 통과. 확인 뒤 그 줄은 되돌린다.

## 6. dSYM을 나중에 올리기

```sh
SENTRY_AUTH_TOKEN=<토큰> npx sentry-cli debug-files upload --org aram-augment-lab --project augment-lab-app --include-sources \
  ~/Library/Developer/Xcode/Archives/<날짜>/<아카이브>.xcarchive/dSYMs
```

## App Store '새로운 기능' 초안

> 초안이다. 2·3번째 줄은 확인 뒤에만 쓴다: "그대로 이어집니다"는 I-42(이관 리허설), "더 부드럽게"는 I-41(동일성 검수)·I-40(전환 측정) 결과가 받쳐 줄 때.
>
> **확인 결과(2026-11-27, 5d)**
> - 3번째 줄 "그대로 이어집니다"는 확정이다. I-42 리허설에서 빌드 3개·테마·언어·리뷰 상태·이미지 캐시가 모두 유지됐다.
> - 2번째 줄 "더 부드러워졌습니다"는 근거가 일부뿐이다. **사용자가 정한다.**
>   - 근거 있음: I-40 전환 측정에서 나가기 때 가로 홈이 보이는 시간이 0초다(RN 0.5초). 저장 경로도 빈 프레임 0이다.
>   - 반대 근거: 라이트 모드에서 드래프트를 띄울 때 흰 화면이 100~150ms 보인다(RN 0).
>   - 스크롤은 재지 않았다.
>   - 빼거나 "화면 전환이 더 매끄러워졌습니다" 정도로 줄이는 것도 방법이다.

**ko**
```
앱을 iOS 네이티브로 새로 만들었습니다.
· 화면 전환과 스크롤이 더 부드러워졌습니다.
· 저장한 빌드와 테마·언어 설정은 그대로 이어집니다.
· 칼바람·커스텀·티어리스트 등 기능은 그대로입니다.
```

**en**
```
We rebuilt the app natively for iOS.
· Smoother transitions and scrolling.
· Your saved builds, theme, and language carry over.
· ARAM, Custom, Tier List and everything else work just like before.
```
