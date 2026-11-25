---
id: I-03
title: 설정 저장소·번역 헬퍼
wave: W0
status: done
depends: I-00
owns: native/ios/AugmentCore/Sources/AugmentCore/Settings/, native/ios/AugmentCore/Tests/AugmentCoreTests/Settings/, native/ios/AugmentLab/Infra/Settings/
spec: storage.md §1·§5
rn: src/hooks/use-locale.ts, src/hooks/use-theme-preference.ts, src/hooks/use-theme.ts, src/lib/i18n.ts
---

# I-03 설정 저장소·번역 헬퍼

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
테마·언어 설정과 번역 패턴을 만든다. 키-값 저장소도 여기서 정한다(빌드 저장소가 이어서 쓴다).

## 체크리스트
- [x] `KeyValueStore` 프로토콜(get/set/remove) — UserDefaults 구현 + 테스트용 메모리 구현(실패 주입 가능)
- [x] `ThemePreference`(system/light/dark, 그 외 값은 system으로)
- [x] `LocaleStore`: 저장값 → 없으면 기기 언어(ko면 ko, 아니면 en). 읽기 오류면 현재 값 유지.
- [x] `@Observable AppSettings`(theme, locale)
- [x] 번역 헬퍼 `L10n(ko:en:)` + `t(key)`(없으면 en → '') — 파일별 사전 패턴
- [x] 앱 측(`Infra/Settings/`): 창 `overrideUserInterfaceStyle` 적용, 환경 주입
- [x] 테스트: 기본값, 보정, 기기 언어 기본값, 저장 왕복

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-03` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 마이페이지가 생긴 뒤(I-32) 테마를 바꾸면 즉시 반영된다 — I-32에서 함께 확인

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- `AppLocale`: I-02a가 `Data/AppLocale.swift`로 소유한다. I-03은 I-02a에 의존하지 않아 같은 정의를 `Settings/AppLocale.swift`에 임시로 뒀다. **I-02a와 I-03이 둘 다 dev에 들어가면 같은 모듈에 중복 정의라 빌드가 깨진다** → 나중에 머지되는 쪽에서 `Settings/AppLocale.swift`를 지운다(정의가 같아 다른 수정은 없음).

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-03 완료
- **한 일**
  - `KeyValueStore`(get/set/remove, throws) · `UserDefaultsStore` · `MemoryKeyValueStore`(`failReads`·`failWrites`). 메모리 구현은 Sources에 둬서 다른 작업 테스트·프리뷰도 쓴다.
  - `ThemePreference(stored:)` 보정, `LocaleStore`(`locale:v1`, 기기 언어는 `Locale.preferredLanguages.first`의 언어 코드로 판정 → `kok`(콘칸어)는 en).
  - `@MainActor @Observable AppSettings`: `theme`·`locale`은 `private(set)`, 바꾸기는 `setTheme(_:)`·`setLocale(_:)`(즉시 반영 + 저장, 쓰기 실패 무시). `reload()`: 저장값 없으면 기본값, 읽기 오류면 현재 값 유지.
  - `L10n(ko:en:)` → `let t = L.t(settings.locale)`; `t("key")`. 현재 언어 → en → "" 폴백.
  - 앱 측 `View.appSettings(_:)`: 환경 주입 + 모든 창 `overrideUserInterfaceStyle`(system → unspecified).
- **확인**: `make test` 11개 통과, `make build` 통과.
- **주의점**
  - `native/I-00`(PR #76, 미머지) 위에서 갈라졌다. 그래서 지금 `status.sh diff I-03`은 I-00 파일까지 잡는다. I-00 대비(`git diff native/I-00`)로는 owns 안 6개 파일뿐이다. I-00 머지 후 base를 dev로 바꾸면 깨끗해진다.
  - `AppLocale` 중복 → 승격 후보 참고.
- **다음 작업이 알아야 할 것**
  - I-06a: 루트에서 `@State private var settings = AppSettings(store: UserDefaultsStore())` 만들고 `RootView().appSettings(settings)`. 언어 변경을 `GameData`(I-02a)에 넘기는 연결도 I-06a에서.
  - I-33(데이터 초기화·백업 복원) 뒤에는 `settings.reload()`.
  - I-04a: 작은 값은 `KeyValueStore`로, 테스트는 `MemoryKeyValueStore`로.
  - 뷰: `@Environment(AppSettings.self) private var settings` → `settings.locale`·`settings.theme`. 피커 바인딩은 `Binding(get: { settings.theme }, set: settings.setTheme)`.
- **사용자가 볼 것**: 지금은 화면이 없다. I-32(마이페이지)에서 테마 즉시 반영을 확인.
