import Foundation

/// DDragon·CommunityDragon URL (RN `src/lib/ddragon.ts`). spec/data.md §3.
public struct CDN: Hashable, Sendable {
    public static let ddragonBase = "https://ddragon.leagueoflegends.com"
    public static let cdragonBase = "https://raw.communitydragon.org/latest"

    public let ddragonVersion: String
    private var versioned: String { "\(Self.ddragonBase)/cdn/\(ddragonVersion)" }

    public init(ddragonVersion: String) { self.ddragonVersion = ddragonVersion }

    public func championSquareURL(_ imageKey: String) -> URL { url("\(versioned)/img/champion/\(imageKey)") }
    public func itemImageURL(_ imageKey: String) -> URL { url("\(versioned)/img/item/\(imageKey)") }
    public func spellImageURL(_ imageKey: String) -> URL { url("\(versioned)/img/spell/\(imageKey)") }

    /// 와이드 스플래시(버전 없음) — 빌드 상세 배너
    public static func championSplashURL(_ championId: String) -> URL {
        url("\(ddragonBase)/cdn/img/champion/splash/\(championId)_0.jpg")
    }

    /// 챔피언을 가운데 둔 스플래시(버전 없음) — 세로 카드
    public static func championCenteredURL(_ championId: String) -> URL {
        url("\(ddragonBase)/cdn/img/champion/centered/\(championId)_0.jpg")
    }

    /// ddragon에 없는 아이콘(소환사 주문·일부 아이템·증강 small)
    public static func cdragonIconURL(_ iconPath: String) -> URL {
        url("\(cdragonBase)/plugins/rcp-be-lol-game-data/global/default\(stripAssetPrefix(iconPath))")
    }

    /// 증강 아이콘 폴백 순서 large → base → small. 로더·프리웜이 같은 순서를 쓴다.
    /// 앱에 넣어 둔 아이콘(`localAugmentIcon`)이면 받을 게 없어 빈 목록.
    public static func augmentImageURLs(_ iconPath: String) -> [URL] {
        if localAugmentIcon(iconPath) != nil { return [] }
        let game = "\(cdragonBase)/game\(stripAssetPrefix(iconPath))"
        return [
            url(regexReplace(game, #"_small(\.\w+)$"#, "_large$1", ignoreCase: true)),
            url(regexReplace(game, #"_small(\.\w+)$"#, "$1", ignoreCase: true)),
            cdragonIconURL(iconPath),
        ]
    }

    /// CDragon에 컬러 원본이 없어 앱에 넣어 둔 증강 아이콘 10개 → 에셋 이름(I-00 `augments-<이름>`)
    public static func localAugmentIcon(_ iconPath: String) -> String? {
        let file = (iconPath as NSString).lastPathComponent.lowercased()
        guard file.hasSuffix("_small.png") else { return nil }
        let name = String(file.dropLast("_small.png".count))
        return localAugmentNames.contains(name) ? "augments-\(name)" : nil
    }

    static let localAugmentNames: Set<String> = [
        "armoredimpact", "bees", "bigshot", "bluenote", "enchantedbuttery",
        "heavyisthecrown", "stillhere", "takeemdowndowndown", "theboomandthebass", "totentanz",
    ]

    /// 역할 아이콘. 6개 역할 밖이면 nil.
    public static func championClassIconURL(_ tag: String) -> URL? {
        guard championTags.contains(tag) else { return nil }
        return url("\(cdragonBase)/plugins/rcp-fe-lol-static-assets/global/default/npe-ft-role-icon-\(tag.lowercased()).png")
    }

    /// `/lol-game-data/assets` 접두사(대소문자 무시)를 떼고 전체를 소문자로.
    static func stripAssetPrefix(_ iconPath: String) -> String {
        regexReplace(iconPath, "^/lol-game-data/assets", "", ignoreCase: true).lowercased()
    }

    private func url(_ s: String) -> URL { Self.url(s) }
    private static func url(_ s: String) -> URL { URL(string: s)! }
}
