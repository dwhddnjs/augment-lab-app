import Foundation
import Testing
@testable import AugmentCore

/// RN `scripts/check-backup.ts` 항목 + RN 직렬화 골든 + 적용·초기화·내보내기.
@MainActor
struct BackupTests {
    static let builds = #"[{"id":"a","mode":"aram","championId":"Ahri","augmentIds":[],"itemIds":[],"createdAt":"2026-08-20T00:00:00.000Z"},{"id":"b","mode":"aram","championId":"Jinx","augmentIds":[],"itemIds":[],"createdAt":"2026-08-19T00:00:00.000Z"}]"#
    static let exportedAt = "2026-08-20T09:30:00.000Z"

    // 1. 왕복
    @Test func roundTrip() throws {
        let text = Backup.serialize(["builds:v1": Self.builds, "theme:v1": "dark", "locale:v1": "ko"], exportedAt: Self.exportedAt)
        let parsed = try Backup.parse(text)
        #expect(parsed == BackupFile(exportedAt: Self.exportedAt, data: ["builds:v1": Self.builds, "theme:v1": "dark", "locale:v1": "ko"]))
    }

    /// 기대값 = RN `serializeBackup` 출력(npx tsx로 뽑음)
    @Test func serializeMatchesRN() {
        #expect(Backup.serialize(["builds:v1": "[{\"id\":\"a\",\"note\":\"x/y\\n\"}]", "theme:v1": "dark", "locale:v1": "ko"], exportedAt: Self.exportedAt)
            == "{\n  \"app\": \"augment-lab\",\n  \"version\": 1,\n  \"exportedAt\": \"2026-08-20T09:30:00.000Z\",\n  \"data\": {\n    \"builds:v1\": \"[{\\\"id\\\":\\\"a\\\",\\\"note\\\":\\\"x/y\\\\n\\\"}]\",\n    \"theme:v1\": \"dark\",\n    \"locale:v1\": \"ko\"\n  }\n}")
        #expect(Backup.serialize([:], exportedAt: "") == "{\n  \"app\": \"augment-lab\",\n  \"version\": 1,\n  \"exportedAt\": \"\",\n  \"data\": {}\n}")
    }

    // 2. 로컬 날짜 파일명 — UTC로 자르면 KST 새벽에 하루 전이 된다.
    @Test func fileNameUsesLocalDate() {
        var kst = Calendar(identifier: .gregorian)
        kst.timeZone = TimeZone(identifier: "Asia/Seoul")!
        let date = ISO8601DateFormatter().date(from: "2026-08-19T19:57:00Z")!
        #expect(Backup.fileName(date, calendar: kst) == "augment-lab-2026-08-20.alab")
    }

    // 3–4. 일부 키만, 화이트리스트 밖·문자열 아닌 값 제거, exportedAt 없음
    @Test func partialAndWhitelist() throws {
        let partial = try Backup.parse(Backup.serialize(["locale:v1": "en"], exportedAt: Self.exportedAt))
        #expect(partial.data == ["locale:v1": "en"])

        let extra = try Backup.parse(#"{"app":"augment-lab","version":1,"data":{"locale:v1":"ko","session:v9":"secret-token","theme:v1":3}}"#)
        #expect(extra.data == ["locale:v1": "ko"])
        #expect(extra.exportedAt == "")
    }

    // 5. 거부 — 저장소를 건드리기 전에 막힌다.
    @Test(arguments: [
        ("{ not json", Backup.Failure.notJSON), ("", .notJSON),
        ("[1,2,3]", .notObject), ("null", .notObject), ("5", .notObject),
        (#"{"app":"other","version":1,"data":{}}"#, .notAugmentLab),
        (#"{"app":"augment-lab","version":2,"data":{}}"#, .unsupportedVersion),
        (#"{"app":"augment-lab","version":"1","data":{}}"#, .unsupportedVersion),
        (#"{"app":"augment-lab","version":1}"#, .noData),
        (#"{"app":"augment-lab","version":1,"data":[]}"#, .noData),
        (#"{"app":"augment-lab","version":1,"data":{"builds:v1":"{oops"}}"#, .buildsCorrupt),
        (#"{"app":"augment-lab","version":1,"data":{"builds:v1":"{\"a\":1}"}}"#, .buildsCorrupt),
    ])
    func rejects(text: String, expected: Backup.Failure) {
        #expect(throws: expected) { try Backup.parse(text) }
    }

    func storage(_ files: MemoryKeyValueStore, _ prefs: MemoryKeyValueStore) -> BackupStorage {
        BackupStorage(buildFile: files, settingsStore: prefs, builds: BuildStore(store: files),
                      settings: AppSettings(store: prefs, preferredLanguages: ["en"]))
    }

    /// 적용은 교체다: 파일 키 쓰기 → 빠진 키 지우기 → 저장소 다시 불러오기. 리뷰·프리웜 플래그는 그대로.
    @Test func applyReplaces() throws {
        let files = MemoryKeyValueStore(["builds:v1": "[]"])
        let prefs = MemoryKeyValueStore(["theme:v1": "dark", "locale:v1": "ko", "review:requested": "1"])
        let s = storage(files, prefs)
        s.builds.load()
        try s.apply(Backup.parse(Backup.serialize(["builds:v1": Self.builds, "locale:v1": "en"], exportedAt: Self.exportedAt)))
        #expect(files.values == ["builds:v1": Self.builds])
        #expect(prefs.values == ["locale:v1": "en", "review:requested": "1"])
        #expect(s.builds.builds?.map(\.id) == ["a", "b"])
        #expect(s.settings.theme == .system)
        #expect(s.settings.locale == .en)
    }

    @Test func resetKeepsFlags() throws {
        let files = MemoryKeyValueStore(["builds:v1": Self.builds])
        let prefs = MemoryKeyValueStore(["theme:v1": "dark", "review:requested": "1", "prewarm:done:16.23.1": "1"])
        let s = storage(files, prefs)
        try s.reset()
        #expect(files.values.isEmpty)
        #expect(prefs.values == ["review:requested": "1", "prewarm:done:16.23.1": "1"])
        #expect(s.builds.builds == [])
        #expect(s.settings.theme == .system)
    }

    /// 내보내기: 빌드 원문은 정리된 목록으로(아레나 제거·최신순). 저장된 적 없는 키는 빠진다.
    @Test func exportCleansBuilds() throws {
        let raw = #"[{"id":"old","mode":"aram","championId":"A","augmentIds":[],"itemIds":[],"createdAt":"2026-08-01T00:00:00.000Z"},{"id":"arena","mode":"arena","championId":"A","augmentIds":[],"itemIds":[],"createdAt":"2026-08-03T00:00:00.000Z"},{"id":"new","mode":"aram","championId":"A","augmentIds":[],"itemIds":[],"createdAt":"2026-08-02T00:00:00.000Z"}]"#
        let s = storage(MemoryKeyValueStore(["builds:v1": raw]), MemoryKeyValueStore(["locale:v1": "ko"]))
        let file = try Backup.parse(s.exportText(now: Date(timeIntervalSince1970: 1_787_184_000)))
        #expect(file.exportedAt == "2026-08-20T00:00:00.000Z")
        #expect(Set(file.data.keys) == ["builds:v1", "locale:v1"])
        #expect(Builds.parse(file.data["builds:v1"]).map(\.id) == ["new", "old"])

        let empty = try Backup.parse(storage(MemoryKeyValueStore(), MemoryKeyValueStore()).exportText())
        #expect(empty.data.isEmpty)
    }
}
