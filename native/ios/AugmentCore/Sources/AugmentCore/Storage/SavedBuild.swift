import Foundation

/// 게임 모드. 칼바람만 남았다(아레나·클래식 제거). RN `GameMode`(build-storage) 그대로.
public enum GameMode: String, CaseIterable, Codable, Sendable {
    case aram
}

/// 빌드에 남긴 이번 판 헤드라이너. 모르는 id·스티커도 그대로 둔다(spec storage.md §2.1).
public struct BuildHeadliner: Equatable, Sendable {
    public var id: String
    public var skills: [SkillKey]
    public var stickers: [String]

    public init(id: String, skills: [SkillKey] = [], stickers: [String] = []) {
        self.id = id
        self.skills = skills
        self.stickers = stickers
    }

    /// RN `parseBuildHeadliner`. 라우트 파라미터·백업 복원도 이걸 거친다. 깨진 값이면 nil(빌드는 산다).
    public init?(json: JSONValue?) {
        guard case .object(let o)? = json, let id = o["id"]?.string else { return nil }
        self.id = id
        skills = o["skills"]?.array?.compactMap { $0.string.flatMap(SkillKey.init(rawValue:)) } ?? []
        stickers = o["stickers"]?.strings ?? []
    }

    var json: JSONValue {
        .object(["id": .string(id), "skills": .array(skills.map { .string($0.rawValue) }), "stickers": .array(stickers.map(JSONValue.string))])
    }
}

/// 저장된 빌드(spec storage.md §2). 값이 없는 선택 필드는 쓸 때 키째 생략한다.
public struct SavedBuild: Equatable, Identifiable, Sendable {
    public var id: String
    public var mode: GameMode
    public var championId: String
    /// 얻은 증강 id. 전환 증강 자체는 빠지고 그걸로 얻은 증강이 들어간다.
    public var augmentIds: [String]
    /// augmentIds 중 전환으로 얻은 것. 도입 전 빌드·커스텀 빌드에는 없다.
    public var transmutedIds: [String]?
    /// 0–6개
    public var itemIds: [String]
    public var headliner: BuildHeadliner?
    /// 커스텀 화면에서 만든 빌드
    public var custom: Bool
    /// ISO 8601 (`2026-08-20T00:00:00.000Z`)
    public var createdAt: String
    /// 모르는 필드 — 미래 버전이 쓴 값이 다음 저장에서 지워지지 않게 그대로 다시 쓴다.
    var extra: [String: JSONValue] = [:]

    static let knownKeys: Set<String> = ["id", "mode", "championId", "augmentIds", "transmutedIds", "itemIds", "headliner", "custom", "createdAt"]

    public init(
        id: String, mode: GameMode = .aram, championId: String, augmentIds: [String], transmutedIds: [String]? = nil,
        itemIds: [String], headliner: BuildHeadliner? = nil, custom: Bool = false, createdAt: String
    ) {
        self.id = id
        self.mode = mode
        self.championId = championId
        self.augmentIds = augmentIds
        self.transmutedIds = transmutedIds
        self.itemIds = itemIds
        self.headliner = headliner
        self.custom = custom
        self.createdAt = createdAt
    }

    /// RN `parseBuilds`의 항목 하나. 남기는 조건을 못 넘으면 nil.
    init?(json o: [String: JSONValue]) {
        // mode: 없음·falsy·classic → aram. 그 밖의 모르는 값(아레나 등)은 버린다.
        let mode: GameMode? = switch o["mode"] {
        case nil: .aram
        case let v? where v.isFalsy || v == .string("classic"): .aram
        case let v?: v.string.flatMap(GameMode.init(rawValue:))
        }
        guard let mode,
              let id = o["id"]?.string, let championId = o["championId"]?.string, let createdAt = o["createdAt"]?.string,
              let augmentIds = o["augmentIds"]?.array, let itemIds = o["itemIds"]?.array
        else { return nil }
        // ponytail: 배열 원소 타입은 RN도 보지 않는다. 여기선 문자열만 남기므로 비문자 원소(깨진 데이터)는 다음 저장에서 빠진다.
        self.init(
            id: id, mode: mode, championId: championId, augmentIds: augmentIds.compactMap(\.string),
            transmutedIds: o["transmutedIds"]?.strings, itemIds: itemIds.compactMap(\.string),
            headliner: BuildHeadliner(json: o["headliner"]), custom: o["custom"] == .bool(true), createdAt: createdAt
        )
        extra = o.filter { !Self.knownKeys.contains($0.key) }
    }

    var json: JSONValue {
        var o = extra
        o["id"] = .string(id)
        o["mode"] = .string(mode.rawValue)
        o["championId"] = .string(championId)
        o["augmentIds"] = .array(augmentIds.map(JSONValue.string))
        o["itemIds"] = .array(itemIds.map(JSONValue.string))
        o["createdAt"] = .string(createdAt)
        if let transmutedIds { o["transmutedIds"] = .array(transmutedIds.map(JSONValue.string)) }
        if let headliner { o["headliner"] = headliner.json }
        if custom { o["custom"] = .bool(true) }
        return .object(o)
    }
}

public enum Builds {
    /// RN `parseBuilds`. 항목 단위로 거른다 — 목록 전체를 버리면 다음 저장이 나머지 빌드를 덮어써 지운다.
    /// 백업 복원 확인 다이얼로그의 개수도 이걸로 센다.
    public static func parse(_ raw: String?) -> [SavedBuild] {
        guard let raw, !raw.isEmpty, let items = JSONValue.parse(raw)?.array else { return [] }
        return items.compactMap { item in
            guard case .object(let o) = item else { return nil }
            return SavedBuild(json: o)
        }
    }

    /// 디스크·백업에 쓸 JSON 문자열
    public static func stringify(_ builds: [SavedBuild]) throws -> String {
        try JSONValue.array(builds.map(\.json)).stringified()
    }

    /// createdAt 문자열 내림차순(최신 먼저)
    public static func sortedDesc(_ builds: [SavedBuild]) -> [SavedBuild] {
        builds.sorted { $0.createdAt > $1.createdAt }
    }

    /// RN `generateId`: base36 밀리초 + `-` + base36 6자 (예: `mf3k2x1a-4h7k2p`)
    public static func generateId(now: Date = Date(), using rng: inout some RandomNumberGenerator) -> String {
        let digits = Array("0123456789abcdefghijklmnopqrstuvwxyz")
        let suffix = String((0..<6).map { _ in digits.randomElement(using: &rng)! })
        return String(Int64((now.timeIntervalSince1970 * 1000).rounded(.down)), radix: 36) + "-" + suffix
    }

    /// JS `toISOString()` — UTC, 밀리초 3자리
    public static func isoString(_ date: Date) -> String {
        date.formatted(Date.ISO8601FormatStyle(includingFractionalSeconds: true))
    }
}
