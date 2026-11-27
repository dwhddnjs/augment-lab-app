import Foundation
import Observation

/// 키 하나 = 파일 하나. `builds:v1`처럼 커질 수 있는 값을 앱 지원 폴더에 원자적으로 쓴다(storage.md §1).
public struct FileKeyValueStore: KeyValueStore {
    let directory: URL

    public init(directory: URL = .applicationSupportDirectory) {
        self.directory = directory
    }

    func url(_ key: String) -> URL { directory.appending(path: key) }

    public func get(_ key: String) throws -> String? {
        do {
            return try String(contentsOf: url(key), encoding: .utf8)
        } catch CocoaError.fileReadNoSuchFile {
            return nil
        }
    }

    public func set(_ key: String, _ value: String) throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try Data(value.utf8).write(to: url(key), options: .atomic)
    }

    public func remove(_ key: String) throws {
        do {
            try FileManager.default.removeItem(at: url(key))
        } catch CocoaError.fileNoSuchFile {}
    }
}

public enum BuildStoreError: Error {
    /// 지난 읽기가 실패한 채로 쓰면 빈 목록으로 디스크를 덮어쓴다 → 쓰기를 막는다.
    case unreadable
}

/// 저장된 빌드 목록(RN `build-storage` + `useBuilds`). 앱 루트에서 하나 만들어 환경으로 넘긴다.
/// 화면은 `builds`를 지켜보고, 로드 전(nil)이면 `load()`를 부른다.
@MainActor @Observable
public final class BuildStore {
    public static let key = "builds:v1"

    /// 최신순. nil = 아직 디스크에서 읽기 전.
    public private(set) var builds: [SavedBuild]?
    /// 디스크를 못 읽어 빈 목록으로 폴백한 상태(깨진 JSON은 아니다 — 그건 다음 저장이 덮어쓴다)
    @ObservationIgnored private(set) var readFailed = false
    @ObservationIgnored private let store: KeyValueStore
    @ObservationIgnored private let now: () -> Date

    public init(store: KeyValueStore = FileKeyValueStore(), now: @escaping () -> Date = Date.init) {
        self.store = store
        self.now = now
    }

    /// RN `readAll`. 캐시가 있으면 그대로. 읽기 예외(기기 잠김 중 데이터 보호 등)면 빈 목록 + readFailed.
    @discardableResult
    public func load() -> [SavedBuild] {
        if let builds { return builds }
        let loaded: [SavedBuild]
        do {
            loaded = Builds.sortedDesc(Builds.parse(try store.get(Self.key)))
            readFailed = false
        } catch {
            loaded = []
            readFailed = true
        }
        builds = loaded
        return loaded
    }

    /// 디스크에서 다시 읽는다(백업 복원·데이터 초기화 뒤).
    public func reload() {
        builds = nil
        load()
    }

    public func get(_ id: String) -> SavedBuild? {
        load().first { $0.id == id }
    }

    /// 새 빌드를 저장한다. id·createdAt은 여기서 만든다. 쓰기에 실패하면 목록을 되돌리고 던진다.
    @discardableResult
    public func save(
        championId: String, augmentIds: [String], itemIds: [String], transmutedIds: [String]? = nil,
        headliner: BuildHeadliner? = nil, custom: Bool = false
    ) throws -> SavedBuild {
        let date = now()
        var rng = SystemRandomNumberGenerator()
        let build = SavedBuild(
            id: Builds.generateId(now: date, using: &rng), championId: championId, augmentIds: augmentIds,
            transmutedIds: transmutedIds, itemIds: itemIds, headliner: headliner, custom: custom,
            createdAt: Builds.isoString(date)
        )
        let before = try readForWrite()
        try commit(Builds.sortedDesc([build] + before), rollback: before)
        return build
    }

    public func remove(id: String) throws {
        let before = try readForWrite()
        try commit(before.filter { $0.id != id }, rollback: before)
    }

    /// 지난 읽기가 실패했으면 다시 읽고, 또 실패하면 던진다.
    private func readForWrite() throws -> [SavedBuild] {
        if readFailed { builds = nil }
        let current = load()
        if readFailed { throw BuildStoreError.unreadable }
        return current
    }

    /// 목록을 먼저 바꾸고 쓴다. 실패하면 되돌린다 — 안 그러면 껐다 켜면 사라지는(또는 되살아나는) 빌드가 생긴다.
    private func commit(_ next: [SavedBuild], rollback: [SavedBuild]) throws {
        builds = next
        do {
            try store.set(Self.key, Builds.stringify(next))
        } catch {
            builds = rollback
            throw error
        }
    }
}
