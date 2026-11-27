import Foundation
import Testing
@testable import AugmentCore

/// RN `scripts/check-build-storage.ts` 항목 + 네이티브 쪽 안전장치(읽기 실패·모르는 필드·디스크 파일).
@MainActor
struct BuildStoreTests {
    let disk = MemoryKeyValueStore()
    var onDisk: [JSONValue] { JSONValue.parse(disk.values[BuildStore.key] ?? "[]")?.array ?? [] }

    func put(_ items: [[String: JSONValue]]) {
        disk.values[BuildStore.key] = try! JSONValue.array(items.map(JSONValue.object)).stringified()
    }

    func draft(_ id: String, _ extra: [String: JSONValue] = [:]) -> [String: JSONValue] {
        ["id": .string(id), "mode": .string("aram"), "championId": .string("Garen"), "augmentIds": .array([.string("a1")]),
         "itemIds": .array([.string("i1")])].merging(extra) { $1 }
    }

    func save(_ store: BuildStore, headliner: BuildHeadliner? = nil, augmentIds: [String] = ["a1"], transmutedIds: [String]? = nil) throws -> SavedBuild {
        try store.save(championId: "Garen", augmentIds: augmentIds, itemIds: ["i1"], transmutedIds: transmutedIds, headliner: headliner)
    }

    // 1–4. 저장·삭제와 쓰기 실패 롤백
    @Test func saveRemoveAndRollback() throws {
        let store = BuildStore(store: disk)
        let first = try save(store)
        #expect(store.builds?.count == 1)
        #expect(onDisk.count == 1)

        disk.failWrites = true
        #expect(throws: (any Error).self) { try save(store) }
        #expect(store.builds?.count == 1, "실패한 저장은 목록에 남지 않는다(유령 빌드 없음)")
        #expect(onDisk.count == 1)

        #expect(throws: (any Error).self) { try store.remove(id: first.id) }
        #expect(store.builds?.count == 1, "실패한 삭제는 목록에서 지워지지 않는다")
        #expect(onDisk.count == 1)
        disk.failWrites = false

        try store.remove(id: first.id)
        #expect(store.builds?.count == 0)
        #expect(onDisk.count == 0)
    }

    // 5. 아레나는 걸러지고 클래식은 칼바람으로 산다
    @Test func removedModes() {
        put([
            draft("old-arena", ["mode": .string("arena"), "createdAt": .string("2026-08-01T00:00:00.000Z")]),
            draft("old-classic", ["mode": .string("classic"), "createdAt": .string("2026-08-03T00:00:00.000Z")]),
            draft("keep", ["createdAt": .string("2026-08-02T00:00:00.000Z")]),
        ])
        let store = BuildStore(store: disk)
        store.reload()
        #expect(store.builds?.map(\.id) == ["old-classic", "keep"])
        #expect(store.builds?.first?.mode == .aram)
    }

    // 6. 깨진 항목 하나가 전체를 날리지 않는다 + 다음 저장 후 생존
    @Test func brokenItemsDropAlone() throws {
        disk.values[BuildStore.key] = """
        [null, 3, "x", [], \(try JSONValue.object(draft("no-date")).stringified()),
         \(try JSONValue.object(draft("future", ["mode": .string("swarm"), "createdAt": .string("2026-08-03T00:00:00.000Z")])).stringified()),
         \(try JSONValue.object(draft("legacy", ["createdAt": .string("2026-08-04T00:00:00.000Z")]).filter { $0.key != "mode" }).stringified()),
         \(try JSONValue.object(draft("falsy", ["mode": .string(""), "createdAt": .string("2026-08-01T00:00:00.000Z")])).stringified()),
         \(try JSONValue.object(draft("keep", ["createdAt": .string("2026-08-02T00:00:00.000Z")])).stringified())]
        """
        let store = BuildStore(store: disk)
        #expect(store.load().map { [$0.id, $0.mode.rawValue] } == [["legacy", "aram"], ["keep", "aram"], ["falsy", "aram"]])
        try save(store)
        #expect(onDisk.count == 4, "다음 저장이 살아남은 빌드를 지우지 않는다")
    }

    // 7. 복원 확인 다이얼로그 개수
    @Test func parseCounts() throws {
        let oldBackup = try JSONValue.array([
            draft("old-arena", ["mode": .string("arena"), "createdAt": .string("2026-08-01T00:00:00.000Z")]),
            draft("old-classic", ["mode": .string("classic"), "createdAt": .string("2026-08-03T00:00:00.000Z")]),
            draft("keep", ["createdAt": .string("2026-08-02T00:00:00.000Z")]),
        ].map(JSONValue.object)).stringified()
        #expect(Builds.parse(oldBackup).count == 2)
        #expect(Builds.parse(nil).isEmpty)
        #expect(Builds.parse("").isEmpty)
        #expect(Builds.parse("{oops").isEmpty)
        #expect(Builds.parse("{\"a\":1}").isEmpty)
    }

    // 8. 헤드라이너는 저장·재로드 후 그대로
    @Test func headlinerSurvivesReload() throws {
        let headliner = BuildHeadliner(id: "pentakill", skills: [.q, .r])
        let saved = try save(BuildStore(store: disk), headliner: headliner)
        let again = BuildStore(store: disk)
        #expect(again.get(saved.id)?.headliner == headliner)
    }

    // 9. 깨진 헤드라이너여도 빌드는 산다, 모르는 id·스티커 보존
    @Test func brokenHeadliner() throws {
        let at: [String: JSONValue] = ["createdAt": .string("2026-08-02T00:00:00.000Z")]
        let raw = try JSONValue.array([
            draft("text", at.merging(["headliner": .string("oops")]) { $1 }),
            draft("no-id", at.merging(["headliner": .object(["id": .number(3)])]) { $1 }),
            draft("future", at.merging(["headliner": .object([
                "id": .string("future-band"),
                "skills": .array([.string("q"), .string("x"), .number(1)]),
                "stickers": .array([.string("ahri"), .number(2)]),
            ])]) { $1 }),
            draft("older", at),
        ].map(JSONValue.object)).stringified()
        let parsed = Builds.parse(raw)
        #expect(parsed.map(\.id) == ["text", "no-id", "future", "older"])
        #expect(parsed.map(\.headliner) == [nil, nil, BuildHeadliner(id: "future-band", skills: [.q], stickers: ["ahri"]), nil])
    }

    // 10. 전환 표시 유지·필터
    @Test func transmutedIds() throws {
        let saved = try save(BuildStore(store: disk), augmentIds: ["a1", "a2"], transmutedIds: ["a2"])
        #expect(BuildStore(store: disk).get(saved.id)?.transmutedIds == ["a2"])

        let at: [String: JSONValue] = ["createdAt": .string("2026-08-02T00:00:00.000Z")]
        let raw = try JSONValue.array([
            draft("str", at.merging(["transmutedIds": .string("a1")]) { $1 }),
            draft("mixed", at.merging(["transmutedIds": .array([.string("a1"), .number(2)])]) { $1 }),
        ].map(JSONValue.object)).stringified()
        #expect(Builds.parse(raw).map(\.transmutedIds) == [nil, ["a1"]])
    }

    // 읽기 예외 → 빈 목록, 쓰기는 막혀 디스크가 덮이지 않는다. 다시 읽히면 기존 빌드 위에 쓴다.
    @Test func unreadableBlocksWrite() throws {
        put([draft("keep", ["createdAt": .string("2026-08-02T00:00:00.000Z")])])
        disk.failReads = true
        let store = BuildStore(store: disk)
        #expect(store.load().isEmpty)
        #expect(store.readFailed)
        #expect(throws: BuildStoreError.unreadable) { try save(store) }
        #expect(throws: BuildStoreError.unreadable) { try store.remove(id: "keep") }
        #expect(onDisk.count == 1, "빈 목록으로 디스크를 덮어쓰지 않는다")

        disk.failReads = false
        try save(store)
        #expect(onDisk.count == 2)
        #expect(!store.readFailed)
    }

    // 모르는 필드·선택 필드 생략·custom
    @Test func writeShape() throws {
        put([draft("keep", ["createdAt": .string("2026-08-02T00:00:00.000Z"), "rating": .number(5), "custom": .string("yes")])])
        let store = BuildStore(store: disk, now: { Date(timeIntervalSince1970: 1_787_184_000.125) })
        let saved = try store.save(championId: "Ahri", augmentIds: [], itemIds: [], custom: true)
        #expect(saved.createdAt == "2026-08-20T00:00:00.125Z")
        #expect(store.builds?.map(\.id) == [saved.id, "keep"])

        guard case .object(let new) = onDisk[0], case .object(let old) = onDisk[1] else { Issue.record(); return }
        #expect(Set(new.keys) == ["id", "mode", "championId", "augmentIds", "itemIds", "custom", "createdAt"], "없는 선택 필드는 키째 생략")
        #expect(new["custom"] == .bool(true))
        #expect(old["rating"] == .number(5), "모르는 필드는 다음 저장에서도 남는다")
        #expect(old["custom"] == nil, "custom은 정확히 true일 때만")
    }

    @Test func idAndDateFormat() {
        var rng = SystemRandomNumberGenerator()
        let id = Builds.generateId(now: Date(timeIntervalSince1970: 1_755_648_000), using: &rng)
        #expect(id.wholeMatch(of: try! Regex("mej7hmo0-[0-9a-z]{6}")) != nil, "\(id)")
        #expect(Builds.isoString(Date(timeIntervalSince1970: 1_787_184_000)) == "2026-08-20T00:00:00.000Z")
    }

    @Test func fileStore() throws {
        let dir = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: dir) }
        let file = FileKeyValueStore(directory: dir)
        #expect(try file.get(BuildStore.key) == nil)
        try file.set(BuildStore.key, "[]")
        #expect(try file.get(BuildStore.key) == "[]")
        try file.remove(BuildStore.key)
        try file.remove(BuildStore.key)
        #expect(try file.get(BuildStore.key) == nil)
    }
}
