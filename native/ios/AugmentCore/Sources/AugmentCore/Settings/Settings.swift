import Foundation
import Observation

/// 테마 선택. 창 전체 스타일을 강제로 바꾼다(storage.md §5).
public enum ThemePreference: String, CaseIterable, Sendable {
    case system, light, dark

    public static let key = "theme:v1"

    /// 저장값 보정: 없거나 모르는 값은 system.
    public init(stored: String?) {
        self = stored.flatMap(Self.init(rawValue:)) ?? .system
    }
}

/// `locale:v1` 읽기·쓰기. 없으면 기기 언어(ko면 ko, 아니면 en) — RN은 항상 ko였다(의도적 변경).
public struct LocaleStore {
    public static let key = "locale:v1"

    let store: KeyValueStore
    let preferredLanguages: [String]

    public init(store: KeyValueStore, preferredLanguages: [String] = Locale.preferredLanguages) {
        self.store = store
        self.preferredLanguages = preferredLanguages
    }

    public var deviceDefault: AppLocale {
        let code = preferredLanguages.first.flatMap { Locale(identifier: $0).language.languageCode?.identifier }
        return code == "ko" ? .ko : .en
    }

    /// 저장값 → 없거나 모르는 값이면 기기 언어. 읽기 오류면 `current` 유지.
    public func load(current: AppLocale) -> AppLocale {
        do {
            return try store.get(Self.key).flatMap(AppLocale.init(rawValue:)) ?? deviceDefault
        } catch {
            return current
        }
    }

    /// 쓰기 실패는 무시한다(RN과 같음).
    public func save(_ locale: AppLocale) {
        try? store.set(Self.key, locale.rawValue)
    }
}

/// 테마·언어 전역 상태. 앱 루트에서 하나 만들어 환경으로 넘긴다.
@MainActor @Observable
public final class AppSettings {
    public private(set) var theme: ThemePreference = .system
    public private(set) var locale: AppLocale

    @ObservationIgnored private let store: KeyValueStore
    @ObservationIgnored private let localeStore: LocaleStore

    public init(store: KeyValueStore, preferredLanguages: [String] = Locale.preferredLanguages) {
        self.store = store
        localeStore = LocaleStore(store: store, preferredLanguages: preferredLanguages)
        locale = localeStore.deviceDefault
        reload()
    }

    /// 저장값을 다시 읽는다. 시작할 때, 데이터 초기화·백업 복원 뒤에 부른다.
    /// 저장값이 없으면 기본값으로 돌아간다. 읽기 오류면 현재 값 유지.
    public func reload() {
        do {
            theme = ThemePreference(stored: try store.get(ThemePreference.key))
        } catch {}
        locale = localeStore.load(current: locale)
    }

    public func setTheme(_ next: ThemePreference) {
        theme = next
        try? store.set(ThemePreference.key, next.rawValue)
    }

    public func setLocale(_ next: AppLocale) {
        locale = next
        localeStore.save(next)
    }
}
