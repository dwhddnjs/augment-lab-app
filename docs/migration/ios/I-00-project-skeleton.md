---
id: I-00
title: 프로젝트 골격
wave: W0
status: todo
depends: 
owns: native/ios/AugmentLab.xcodeproj/, native/ios/AugmentLab/Assets.xcassets/, native/ios/AugmentLab/Resources/, native/ios/AugmentCore/Package.swift, native/ios/AugmentCore/Sources/AugmentCore/AugmentCore.swift, native/ios/Makefile, native/ios/Scripts/
stubs: native/ios/AugmentLab/App/Shell/AugmentLabApp.swift (→ I-06a)
spec: docs/migration/spec/design-system.md §5·§6, app-shell.md §5
rn: app.json, assets/, node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/
---

# I-00 프로젝트 골격

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
모든 iOS 작업의 바탕을 만든다. 이 작업이 dev에 머지되기 전에는 다른 iOS 작업을 시작하지 않는다.

## 체크리스트
- [ ] `native/ios/` 아래에 Xcode 프로젝트 `AugmentLab`을 만든다. objectVersion 77, `AugmentLab/`을 **동기화 루트 그룹**(PBXFileSystemSynchronizedRootGroup)으로 둔다. 이렇게 하면 이후 파일을 추가해도 pbxproj가 바뀌지 않는다.
- [ ] pbxproj를 직접 만들기 어려우면 사용자에게 요청한다: Xcode → File › New › Project › iOS App, Interface SwiftUI, 이름 `AugmentLab`, 위치 `native/ios`, Git 저장소 생성 해제. 그 다음 그룹을 동기화 폴더로 바꾼다.
- [ ] 타깃 설정
    - 번들 ID `com.augmentlab`, 최소 iOS 17.0, iPhone 전용
    - Swift 5 언어 모드 + `SWIFT_STRICT_CONCURRENCY=targeted`
    - 지원 방향: 세로, 가로 왼쪽, 가로 오른쪽 (실제 잠금은 코드에서 한다)
    - URL scheme `augmentlab`
- [ ] 표시 이름: 기본 `Augment Lab`, ko `증강 연구소` (InfoPlist.xcstrings)
- [ ] Launch Screen: 배경 #0E0F12 + `adaptive-foreground.png`를 가운데에 폭 220으로 (Info `UILaunchScreen`)
- [ ] SPM 원격 의존성 3개를 최신 안정 버전으로 고정해 추가한다: SDWebImageSwiftUI, posthog-ios, sentry-cocoa. **이후 다른 작업은 의존성을 추가하지 않는다.**
- [ ] 로컬 패키지 `native/ios/AugmentCore`
    - platforms iOS 17, macOS 14
    - 라이브러리 `AugmentCore`, 테스트 타깃 `AugmentCoreTests`(Swift Testing)
    - 자리 표시 파일 `AugmentCore.swift`(`public enum AugmentCore {}`)
    - 앱 타깃에 연결한다
- [ ] 에셋 복사 → `Assets.xcassets`
    - `assets/augment-card/*`, `assets/augments/*`, `assets/headliners/*`를 imageset으로. 이름은 `<폴더>-<파일명>` (예: `augment-card-frame-gold`)
    - 앱 아이콘 `assets/store/icon-aram-ios-1024.png`
    - 로고 `assets/store/adaptive-foreground.png`
- [ ] 아이콘 폰트: `MaterialCommunityIcons.ttf`, `MaterialIcons.ttf`와 각 `glyphmaps/*.json`을 `Resources/Fonts/`로 복사하고 `UIAppFonts`에 등록한다(design-system §5).
- [ ] 데이터 JSON 복사 빌드 단계 `Scripts/copy-data.sh`
    - 복사 대상: `src/features/{augments,champions,headliners,items,tierlist}/data/*.json`, `src/lib/version.json`
    - 앱 번들 `Data/` 폴더로 복사한다
    - input/output 파일 목록을 지정해 증분 빌드가 되게 한다
- [ ] `native/ios/Makefile`
    - `build`: `xcodebuild -project AugmentLab.xcodeproj -scheme AugmentLab -destination 'generic/platform=iOS Simulator' -derivedDataPath ../../.build/ios build -quiet`
    - `test`: `swift test --package-path AugmentCore`
    - `clean`
- [ ] 진입점 스텁 `App/Shell/AugmentLabApp.swift`: "Augment Lab" 텍스트 한 줄 (I-06a가 넘겨받는다)

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-00` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] Xcode에서 열리고 시뮬레이터에 빈 앱이 뜬다
- [ ] 한국어 기기에서 앱 이름이 `증강 연구소`로 보인다
- [ ] 실행 직후 런치 화면이 #0E0F12 + 로고다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
