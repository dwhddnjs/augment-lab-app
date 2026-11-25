// 번들 JSON 모델 — RN `src/features/*/types.ts`와 1:1. 형태는 docs/migration/spec/data.md §1.

public enum Rarity: String, Codable, CaseIterable, Sendable {
    case silver, gold, prismatic
}

public struct Augment: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var name: String
    public var description: String
    public var rarity: Rarity
    /// CDragon 상대 경로. URL은 `CDN.augmentImageURLs(_:)`.
    public var iconPath: String
    /// 값이 없는 항목이 1개 있다(`one-trick`은 빈 문자열).
    public var augmentNameId: String?
    /// 빈 배열이면 어느 풀에도 없다(미출시·제거). 조회용으로만 남는다.
    public var modes: [String]
    /// 전환 증강으로 얻었다. 드래프트 결과에만 붙고 데이터 JSON에는 없다.
    public var transmuted: Bool

    enum CodingKeys: String, CodingKey {
        case id, name, description, rarity, iconPath, augmentNameId, modes, transmuted
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        description = try c.decode(String.self, forKey: .description)
        rarity = try c.decode(Rarity.self, forKey: .rarity)
        iconPath = try c.decode(String.self, forKey: .iconPath)
        augmentNameId = try c.decodeIfPresent(String.self, forKey: .augmentNameId)
        modes = try c.decodeIfPresent([String].self, forKey: .modes) ?? []
        transmuted = try c.decodeIfPresent(Bool.self, forKey: .transmuted) ?? false
    }
}

public struct ChampionStats: Codable, Hashable, Sendable {
    public var hp, hpperlevel, mp, mpperlevel, movespeed: Double
    public var armor, armorperlevel, spellblock, spellblockperlevel, attackrange: Double
    public var hpregen, hpregenperlevel, mpregen, mpregenperlevel: Double
    public var crit, critperlevel, attackdamage, attackdamageperlevel: Double
    public var attackspeedperlevel, attackspeed: Double
}

public struct Champion: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    /// 숫자 문자열. 티어리스트(`TierRow.key`)와 잇는 키다.
    public var key: String
    public var name: String
    public var title: String
    public var blurb: String
    public var tags: [String]
    public var stats: ChampionStats
    /// ddragon 이미지 파일 키(예: "Aatrox.png")
    public var imageKey: String
}

public struct ChampionSpell: Codable, Hashable, Sendable {
    public var name: String
    /// ddragon img/spell 파일 키(예: "ApheliosW.png")
    public var image: String
}

public struct ChampionSpells: Codable, Hashable, Sendable {
    public var q, w, e, r: ChampionSpell
}

public struct Item: Codable, Hashable, Identifiable, Sendable {
    /// 한 빌드에 담는 아이템 수 (RN `MAX_ITEMS`)
    public static let maxPerBuild = 6

    public struct Gold: Codable, Hashable, Sendable {
        public var base, total, sell: Int
        public var purchasable: Bool
    }

    public var id: String
    public var name: String
    public var description: String
    public var plaintext: String
    public var gold: Gold
    public var tags: [String]
    /// 정규화된 스탯. flat 키는 절대값, 비율 키는 0.4 = 40% (RN `ItemStats`). 계산은 I-02c.
    public var stats: [String: Double]
    public var imageKey: String
    /// `stats`의 원본 JSON 키 순서. RN `formatItemStats`가 `Object.entries` 순서(= 설명문 순서)로 출력해서 필요하다.
    /// 딕셔너리는 순서를 잃으므로 `GameData`가 원문에서 따로 읽어 채운다. 못 읽으면 빈 배열.
    public var statOrder: [String] = []

    enum CodingKeys: String, CodingKey {
        case id, name, description, plaintext, gold, tags, stats, imageKey
    }
}

public struct HeadlinerTexts: Codable, Hashable, Sendable {
    public struct Entry: Codable, Hashable, Sendable { public var name, description: String }
    public struct Sticker: Codable, Hashable, Sendable { public var name, full: String }

    /// 키 = 헤드라이너 ID (규칙은 I-12a)
    public var headliners: [String: Entry]
    public var stickers: [String: Sticker]
    /// q/w/e/r → 스킬 이름
    public var skills: [String: String]
    /// `{spell}` 자리에 스킬 이름. [e]강화 [s]스킬명 [h]회복 [b]보호막은 색으로 그린다.
    public var skillTitle, skillBonus, skillBonusShort: String
    /// `{n}` 자리에 개수
    public var anvils: String
}

/// 표시 등급. 챔피언은 S~D, 증강은 S~C.
public enum Tier: String, Codable, CaseIterable, Sendable {
    case S, A, B, C, D
}

/// 증강 한 줄 — `[augIds 인덱스, 승률×10000, 소스 티어 1~4]`
public struct AugEntry: Codable, Hashable, Sendable {
    public var index: Int
    public var winRate: Int
    public var sourceTier: Int

    public init(from decoder: Decoder) throws {
        var c = try decoder.unkeyedContainer()
        index = try c.decode(Int.self)
        winRate = try c.decode(Int.self)
        sourceTier = try c.decode(Int.self)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.unkeyedContainer()
        try c.encode(index); try c.encode(winRate); try c.encode(sourceTier)
    }
}

public struct TierRow: Codable, Hashable, Sendable {
    /// `Champion.key`(숫자 문자열) — `Champion.id`가 아니다
    public var key: String
    /// 승률
    public var score: Double
    /// 픽률
    public var sub: Double
    public var tier: Tier
    public var augments: [AugEntry]
    public var build: [String]
    public var situational: [String]
    /// 스펠 id 0개 또는 2개 (`TierlistFile.spellIcons` 키)
    public var spells: [Int]
    public var spellPick: Double
}

public struct TierlistFile: Codable, Hashable, Sendable {
    public var patch: String
    public var date: String
    public var generatedAt: String
    public var augIds: [String]
    public var spellIcons: [String: String]
    /// 이미 티어순으로 정렬돼 있다 — 다시 정렬하지 않는다
    public var aram: [TierRow]
}

public struct TierItem: Codable, Hashable, Identifiable, Sendable {
    public var id: String
    public var name: String
    public var iconPath: String
}

public struct VersionInfo: Codable, Hashable, Sendable {
    public var ddragonVersion: String
    public var patch: String
    public var generatedAt: String
}
