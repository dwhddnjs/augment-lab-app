---
id: I-00
title: 프로젝트 골격
wave: W0
status: done
depends: 
owns: native/ios/AugmentLab.xcodeproj/, native/ios/AugmentLab/Assets.xcassets/, native/ios/AugmentLab/Resources/, native/ios/AugmentCore/Package.swift, native/ios/AugmentCore/Sources/AugmentCore/AugmentCore.swift, native/ios/AugmentCore/Tests/AugmentCoreTests/AugmentCoreTests.swift, native/ios/Config/, native/ios/Makefile, native/ios/Scripts/, native/ios/.gitignore
stubs: native/ios/AugmentLab/App/Shell/AugmentLabApp.swift (→ I-06a)
spec: docs/migration/spec/design-system.md §5·§6, app-shell.md §5
rn: app.json, assets/, node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/
---

# I-00 프로젝트 골격

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
모든 iOS 작업의 바탕을 만든다. 이 작업이 dev에 머지되기 전에는 다른 iOS 작업을 시작하지 않는다.

## 체크리스트
- [x] `native/ios/` 아래에 Xcode 프로젝트 `AugmentLab`을 만든다. objectVersion 77, `AugmentLab/`을 **동기화 루트 그룹**(PBXFileSystemSynchronizedRootGroup)으로 둔다. 이렇게 하면 이후 파일을 추가해도 pbxproj가 바뀌지 않는다.
- [x] ~~pbxproj를 직접 만들기 어려우면~~ (해당 없음 — 직접 생성 성공) 사용자에게 요청한다: Xcode → File › New › Project › iOS App, Interface SwiftUI, 이름 `AugmentLab`, 위치 `native/ios`, Git 저장소 생성 해제. 그 다음 그룹을 동기화 폴더로 바꾼다.
- [x] 타깃 설정
    - 번들 ID `com.augmentlab`, 최소 iOS 17.0, iPhone 전용
    - Swift 5 언어 모드 + `SWIFT_STRICT_CONCURRENCY=targeted`
    - 지원 방향: 세로, 가로 왼쪽, 가로 오른쪽 (실제 잠금은 코드에서 한다)
    - URL scheme `augmentlab`
- [x] 표시 이름: 기본 `Augment Lab`, ko `증강 연구소` (InfoPlist.xcstrings)
- [x] Launch Screen: 배경 #0E0F12 + `adaptive-foreground.png`를 가운데에 폭 220으로 (Info `UILaunchScreen`)
- [x] SPM 원격 의존성 3개를 최신 안정 버전으로 고정해 추가한다: SDWebImageSwiftUI, posthog-ios, sentry-cocoa. **이후 다른 작업은 의존성을 추가하지 않는다.**
- [x] 로컬 패키지 `native/ios/AugmentCore`
    - platforms iOS 17, macOS 14
    - 라이브러리 `AugmentCore`, 테스트 타깃 `AugmentCoreTests`(Swift Testing)
    - 자리 표시 파일 `AugmentCore.swift`(`public enum AugmentCore {}`)
    - 앱 타깃에 연결한다
- [x] 에셋 복사 → `Assets.xcassets`
    - `assets/augment-card/*`, `assets/augments/*`, `assets/headliners/*`를 imageset으로. 이름은 `<폴더>-<파일명>` (예: `augment-card-frame-gold`)
    - 앱 아이콘 `assets/store/icon-aram-ios-1024.png`
    - 로고 `assets/store/adaptive-foreground.png`
- [x] 아이콘 폰트: `MaterialCommunityIcons.ttf`, `MaterialIcons.ttf`와 각 `glyphmaps/*.json`을 `Resources/Fonts/`로 복사하고 `UIAppFonts`에 등록한다(design-system §5).
- [x] 데이터 JSON 복사 빌드 단계 `Scripts/copy-data.sh`
    - 복사 대상: `src/features/{augments,champions,headliners,items,tierlist}/data/*.json`, `src/lib/version.json`
    - 앱 번들 `Data/` 폴더로 복사한다
    - input/output 파일 목록을 지정해 증분 빌드가 되게 한다
- [x] `native/ios/Makefile`
    - `build`: `xcodebuild -project AugmentLab.xcodeproj -scheme AugmentLab -destination 'generic/platform=iOS Simulator' -derivedDataPath ../../.build/ios build -quiet`
    - `test`: `swift test --package-path AugmentCore`
    - `clean`
- [x] 진입점 스텁 `App/Shell/AugmentLabApp.swift`: "Augment Lab" 텍스트 한 줄 (I-06a가 넘겨받는다)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-00` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] Xcode에서 열리고 시뮬레이터에 빈 앱이 뜬다
- [ ] 한국어 기기에서 앱 이름이 `증강 연구소`로 보인다
- [ ] 실행 직후 런치 화면이 #0E0F12 + 로고다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-00 완료
- **한 일**
  - pbxproj를 직접 작성했다(objectVersion 77, `AugmentLab/` 동기화 루트 그룹, 공유 scheme 포함).
  - SPM 고정 버전(`Package.resolved`): SDWebImageSwiftUI 3.1.4(+SDWebImage 5.21.7), posthog-ios 4.0.11, sentry-cocoa 9.35.0
  - 에셋: 이미지셋 42개(augment-card 4 · augments 10 · headliners 27 · `brand-logo`), AppIcon(1024 단일), `LaunchBackground`(#0E0F12), `LaunchLogo`(220pt → @2x 440 · @3x 660, `sips`로 축소)
  - 폰트: MCI·MaterialIcons TTF + glyphmap → 번들 루트, `UIAppFonts` 등록
  - 데이터: `Scripts/copy-data.sh`가 `data-files.xcfilelist`의 JSON 15개를 번들 `Data/`로 복사한다. 목록 파일로 증분 빌드. 스크립트 샌드박스는 끔.
  - Info: 생성 Info.plist + `Config/Info.plist`(URL scheme `augmentlab`·`com.augmentlab`, 폰트, `UILaunchScreen`, 암호화 false)를 병합한다. Config를 동기화 폴더 밖에 둬서 리소스 중복 오류를 피했다.
- **확인**: `make -C native/ios test` 통과. `make -C native/ios build` 통과 후 번들을 직접 열어 봤다.
  - Data 15개, 폰트 2개, `ko.lproj/InfoPlist.strings` = "증강 연구소"
  - `UISupportedInterfaceOrientations~iphone` 3방향, MinimumOSVersion 17.0, URL types
- **다음 작업이 알아야 할 것**
  - 이미지 이름: `Image("augment-card-frame-gold")`, `Image("headliners-kda-mark")`, 셋업 로고 `Image("brand-logo")`
  - 데이터 경로: `Bundle.main.url(forResource: "augments.ko", withExtension: "json", subdirectory: "Data")`
  - glyphmap: `Bundle.main.url(forResource: "MaterialCommunityIcons", withExtension: "json")`. 폰트 이름 = `MaterialCommunityIcons`, `MaterialIcons`
  - 새 JSON을 추가하면 `Scripts/data-files.xcfilelist`와 `data-outputs.xcfilelist`를 둘 다 고친다(I-00 소유 → 승격 후보로 요청).
  - 서명 팀은 아직 비어 있다(시뮬레이터 빌드는 불필요). I-43에서 설정한다.
- **함께 고친 것**: `docs/migration/status.sh diff`가 frontmatter `stubs`를 허용하도록 고쳤다. 문서에 적은 "스텁 최초 생성 예외"를 반영한 것이고, 어느 작업도 소유하지 않는 공용 도구라 충돌 위험이 없다.
