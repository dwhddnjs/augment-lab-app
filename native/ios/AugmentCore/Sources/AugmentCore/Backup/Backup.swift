import Foundation

/// 검증된 .alab 백업. `data`는 키 → 저장 원문 문자열(빌드는 JSON 안의 JSON 문자열). 저장된 적 없는 키는 빠진다.
public struct BackupFile: Equatable, Sendable {
    public var exportedAt: String
    public var data: [String: String]
}

/// .alab 백업 형식 (RN `backup-format.ts`). spec/storage.md §3. IO 없음.
public enum Backup {
    /// 백업·복원·초기화 대상. 리뷰 요청·프리웜 플래그는 뺀다.
    public static let keys = [BuildStore.key, ThemePreference.key, LocaleStore.key]
    static let appId = "augment-lab"

    /// parseBackup 실패 코드(검증 순서대로)
    public enum Failure: String, Error {
        case notJSON = "not-json"
        case notObject = "not-object"
        case notAugmentLab = "not-augment-lab"
        case unsupportedVersion = "unsupported-version"
        case noData = "no-data"
        case buildsCorrupt = "builds-corrupt"
    }

    /// JS `JSON.stringify(file, null, 2)`와 같은 모양. data 키는 `keys` 순서.
    public static func serialize(_ data: [String: String], exportedAt: String) -> String {
        func q(_ s: String) -> String { (try? JSONValue.string(s).stringified()) ?? "\"\"" }
        let entries = keys.compactMap { k in data[k].map { "    \(q(k)): \(q($0))" } }
        let body = entries.isEmpty ? "{}" : "{\n" + entries.joined(separator: ",\n") + "\n  }"
        return "{\n  \"app\": \(q(appId)),\n  \"version\": 1,\n  \"exportedAt\": \(q(exportedAt)),\n  \"data\": \(body)\n}"
    }

    /// `augment-lab-2026-08-20.alab` — 사용자가 보는 값이라 기기 로컬 날짜(UTC 아님).
    public static func fileName(_ date: Date, calendar: Calendar = .current) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "augment-lab-%04d-%02d-%02d.alab", c.year!, c.month!, c.day!)
    }

    /// 검증해서 읽는다. 우리 파일이 아니거나 손상됐으면 던진다 — 호출측은 실패만 알리고 저장소는 건드리지 않는다.
    public static func parse(_ text: String) throws -> BackupFile {
        guard let raw = JSONValue.parse(text) else { throw Failure.notJSON }
        guard case .object(let file) = raw else { throw Failure.notObject }
        guard file["app"] == .string(appId) else { throw Failure.notAugmentLab }
        guard file["version"] == .number(1) else { throw Failure.unsupportedVersion }
        guard case .object(let source)? = file["data"] else { throw Failure.noData }

        // 화이트리스트 밖 키·문자열 아닌 값은 조용히 버린다(미래 버전 파일도 아는 키만 복원).
        var data: [String: String] = [:]
        for key in keys {
            if case .string(let v)? = source[key] { data[key] = v }
        }
        // 빌드는 반드시 JSON 배열 — 깨진 값을 넣으면 목록이 통째로 비어 보인다.
        if let builds = data[BuildStore.key], JSONValue.parse(builds)?.array == nil { throw Failure.buildsCorrupt }
        return BackupFile(exportedAt: file["exportedAt"]?.string ?? "", data: data)
    }
}

/// 백업 대상 저장소 묶음 (RN `backup.ts`의 IO 부분). 빌드는 파일, 테마·언어는 설정 저장소에 있다.
@MainActor
public struct BackupStorage {
    let buildFile: KeyValueStore
    let settingsStore: KeyValueStore
    let builds: BuildStore
    let settings: AppSettings

    public init(buildFile: KeyValueStore, settingsStore: KeyValueStore, builds: BuildStore, settings: AppSettings) {
        self.buildFile = buildFile
        self.settingsStore = settingsStore
        self.builds = builds
        self.settings = settings
    }

    func store(_ key: String) -> KeyValueStore { key == BuildStore.key ? buildFile : settingsStore }

    /// 내보낼 .alab 텍스트. 빌드 원문은 화면에 보이는 정리된 목록으로 바꾼다(키가 있을 때만) — 복원 뒤 개수가 맞게.
    public func exportText(now: Date = Date()) throws -> String {
        var data: [String: String] = [:]
        for key in Backup.keys {
            if let v = try store(key).get(key) { data[key] = v }
        }
        // RN은 listBuilds() 캐시를 쓴다. 방금 읽은 원문을 같은 규칙으로 정리하면 같은 값이고,
        // 지난 읽기 실패로 캐시가 빈 경우에도 빈 목록을 내보내지 않는다.
        if let raw = data[BuildStore.key] { data[BuildStore.key] = try Builds.stringify(Builds.sortedDesc(Builds.parse(raw))) }
        return Backup.serialize(data, exportedAt: Builds.isoString(now))
    }

    /// 병합이 아니라 교체: 파일의 키를 쓰고 → 빠진 키를 지우고 → 다시 불러온다. 쓰기가 먼저라 중간 실패에도 빈 저장소가 남지 않는다.
    public func apply(_ file: BackupFile) throws {
        for key in Backup.keys {
            if let v = file.data[key] { try store(key).set(key, v) }
        }
        for key in Backup.keys where file.data[key] == nil {
            try store(key).remove(key)
        }
        reload()
    }

    /// 백업 대상 키만 지운다. 리뷰 요청·프리웜 플래그는 남는다.
    public func reset() throws {
        for key in Backup.keys { try store(key).remove(key) }
        reload()
    }

    private func reload() {
        builds.reload()
        settings.reload()
    }
}
