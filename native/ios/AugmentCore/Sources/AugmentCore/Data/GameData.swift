import Foundation
import Observation

/// 한 로케일의 번들 데이터 스냅샷과 조회 인덱스. RN `use-augments`·`use-items`·`use-champions`… 훅을 합친 것.
/// 앱은 번들 `Data/`에서, 테스트는 저장소 경로에서 읽는다(`url`로 주입).
public struct GameData: Sendable {
    public enum LoadError: Error { case missing(String) }

    public let locale: AppLocale
    public let version: VersionInfo
    public let cdn: CDN

    /// 전체 증강 — 저장된 빌드 **조회용**(지금 풀에 없는 증강도 포함)
    public let augments: [Augment]
    public let augmentsById: [String: Augment]
    /// 칼바람에서 실제로 뽑히는 증강만(`modes`에 "aram"). 뽑기·목록은 반드시 이걸 쓴다.
    public let augmentPool: [Augment]

    public let champions: [Champion]
    public let championsById: [String: Champion]
    public let championsByKey: [String: Champion]
    public let championSpells: [String: ChampionSpells]

    /// 전체 아이템 — 조회용
    public let items: [Item]
    public let itemsById: [String: Item]
    /// 칼바람 상점 아이템만(`aram-item-ids.json`, 원래 순서 유지)
    public let itemPool: [Item]

    public let headlinerTexts: HeadlinerTexts
    public let tierlist: TierlistFile
    public let tierItemsById: [String: TierItem]

    public init(locale: AppLocale, url: (String) throws -> URL) throws {
        func load<T: Decodable>(_ name: String) throws -> T {
            try JSONDecoder().decode(T.self, from: Data(contentsOf: url(name)))
        }
        let l = locale.rawValue
        self.locale = locale
        version = try load("version.json")
        cdn = CDN(ddragonVersion: version.ddragonVersion)

        augments = try load("augments.\(l).json")
        augmentsById = Dictionary(augments.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        augmentPool = augments.filter { $0.modes.contains("aram") }

        champions = try load("champions.\(l).json")
        championsById = Dictionary(champions.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        championsByKey = Dictionary(champions.map { ($0.key, $0) }, uniquingKeysWith: { a, _ in a })
        championSpells = try load("champion-spells.\(l).json")

        items = try load("items.\(l).json")
        itemsById = Dictionary(items.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        let poolIds = Set(try load("aram-item-ids.json") as [String])
        itemPool = items.filter { poolIds.contains($0.id) }

        headlinerTexts = try load("headliners.\(l).json")
        tierlist = try load("tierlist.json")
        let tierItems: [TierItem] = try load("tierlist-items.\(l).json")
        tierItemsById = Dictionary(tierItems.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
    }

    /// 앱 번들 `Data/`(I-00 빌드 단계가 복사)에서 읽는다.
    public static func bundled(locale: AppLocale) throws -> GameData {
        try GameData(locale: locale) { name in
            guard let u = Bundle.main.url(forResource: name, withExtension: nil, subdirectory: "Data") else {
                throw LoadError.missing(name)
            }
            return u
        }
    }

    /// 증강 표시 이름. 전환으로 얻은 증강은 앞에 "전환: " / "Transmute: " (RN `useAugmentName`)
    public func displayName(_ augment: Augment) -> String {
        guard augment.transmuted else { return augment.name }
        return (locale == .ko ? "전환: " : "Transmute: ") + augment.name
    }
}

/// id 목록을 실제 객체로. 데이터 갱신으로 사라진 id는 조용히 버린다 — 저장된 빌드가 죽으면 안 된다 (RN `resolveIds`).
public func resolveIds<T>(_ ids: [String]?, in table: [String: T]) -> [T] {
    (ids ?? []).compactMap { table[$0] }
}

/// 현재 로케일 데이터를 들고, 로케일이 바뀌면 다시 읽는다. 앱이 환경으로 주입한다(I-06a).
@Observable
public final class GameDataStore {
    public private(set) var data: GameData
    private let load: (AppLocale) throws -> GameData

    public init(locale: AppLocale, load: @escaping (AppLocale) throws -> GameData = GameData.bundled) throws {
        self.load = load
        data = try load(locale)
    }

    /// 실패하면 지금 데이터를 유지한다.
    public func setLocale(_ locale: AppLocale) {
        guard locale != data.locale, let next = try? load(locale) else { return }
        data = next
    }
}
