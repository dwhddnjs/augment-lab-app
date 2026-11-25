import Foundation
import Testing
@testable import AugmentCore

@MainActor
struct SettingsTests {
    @Test func defaultsWhenEmpty() {
        let s = AppSettings(store: MemoryKeyValueStore(), preferredLanguages: ["en-US"])
        #expect(s.theme == .system)
        #expect(s.locale == .en)
    }

    @Test(arguments: [
        (["ko-KR"], AppLocale.ko), (["ko"], .ko), (["ko-Kore-KR"], .ko),
        (["kok-IN"], .en), (["ja-JP", "ko-KR"], .en), ([], .en),
    ])
    func deviceLanguageDefault(langs: [String], expected: AppLocale) {
        #expect(AppSettings(store: MemoryKeyValueStore(), preferredLanguages: langs).locale == expected)
    }

    @Test func correctsUnknownValues() {
        let store = MemoryKeyValueStore(["theme:v1": "sepia", "locale:v1": "fr"])
        let s = AppSettings(store: store, preferredLanguages: ["ko-KR"])
        #expect(s.theme == .system)
        #expect(s.locale == .ko)
    }

    @Test func savedValueBeatsDevice() {
        let store = MemoryKeyValueStore(["theme:v1": "dark", "locale:v1": "en"])
        let s = AppSettings(store: store, preferredLanguages: ["ko-KR"])
        #expect(s.theme == .dark)
        #expect(s.locale == .en)
    }

    @Test func roundTrip() {
        let store = MemoryKeyValueStore()
        let s = AppSettings(store: store, preferredLanguages: ["en"])
        s.setTheme(.light)
        s.setLocale(.ko)
        #expect(store.values == ["theme:v1": "light", "locale:v1": "ko"])

        let again = AppSettings(store: store, preferredLanguages: ["en"])
        #expect(again.theme == .light)
        #expect(again.locale == .ko)
    }

    @Test func readErrorKeepsCurrent() {
        let store = MemoryKeyValueStore()
        let s = AppSettings(store: store, preferredLanguages: ["en"])
        s.setTheme(.dark)
        s.setLocale(.ko)
        store.failReads = true
        s.reload()
        #expect(s.theme == .dark)
        #expect(s.locale == .ko)
    }

    @Test func reloadAfterResetFallsBackToDefaults() {
        let store = MemoryKeyValueStore()
        let s = AppSettings(store: store, preferredLanguages: ["en"])
        s.setTheme(.dark)
        s.setLocale(.ko)
        store.values = [:]
        s.reload()
        #expect(s.theme == .system)
        #expect(s.locale == .en)
    }

    @Test func writeErrorStillUpdatesMemory() {
        let store = MemoryKeyValueStore()
        store.failWrites = true
        let s = AppSettings(store: store, preferredLanguages: ["en"])
        s.setLocale(.ko)
        #expect(s.locale == .ko)
        #expect(store.values.isEmpty)
    }

    @Test func userDefaultsRoundTrip() throws {
        let suite = "SettingsTests.\(UUID().uuidString)"
        let defaults = try #require(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let store = UserDefaultsStore(defaults)
        store.set("locale:v1", "en")
        #expect(store.get("locale:v1") == "en")
        store.remove("locale:v1")
        #expect(store.get("locale:v1") == nil)
    }

    @Test func translationFallback() {
        let L = L10n(ko: ["a": "가"], en: ["a": "A", "b": "B"])
        let ko = L.t(.ko)
        #expect(ko("a") == "가")
        #expect(ko("b") == "B")
        #expect(ko("c") == "")
        #expect(L.t(.en)("a") == "A")
    }
}
