import Foundation
import Testing
@testable import AugmentCore

// 기대값은 RN `src/lib/ddragon.ts`의 함수 본문을 node로 그대로 실행해 뽑았다(2026-11-26).
struct CDNTests {
    let cdn = CDN(ddragonVersion: "16.16.1")

    @Test func augmentChainLargeBaseSmall() {
        let urls = CDN.augmentImageURLs("/lol-game-data/assets/ASSETS/UX/Cherry/Augments/Icons/ADAPt_small.png")
        #expect(urls.map(\.absoluteString) == [
            "https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons/adapt_large.png",
            "https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons/adapt.png",
            "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/cherry/augments/icons/adapt_small.png",
        ])
    }

    @Test func localAugmentIconSkipsNetwork() {
        let path = "/lol-game-data/assets/ASSETS/UX/Kiwi/Augments/Icons/Bees_small.png"
        #expect(CDN.localAugmentIcon(path) == "augments-bees")
        #expect(CDN.augmentImageURLs(path).isEmpty)
        #expect(CDN.localAugmentIcon("/x/ADAPt_small.png") == nil)
    }

    @Test func localIconsCoverBundledAssets() throws {
        let dir = RepoData.root.appendingPathComponent("assets/augments")
        let bundled = try FileManager.default.contentsOfDirectory(atPath: dir.path)
            .filter { $0.hasSuffix(".png") }.map { String($0.dropLast(4)) }
        #expect(Set(bundled) == CDN.localAugmentNames)
    }

    @Test func ddragonAndCdragonUrls() {
        #expect(cdn.championSquareURL("Aatrox.png").absoluteString == "https://ddragon.leagueoflegends.com/cdn/16.16.1/img/champion/Aatrox.png")
        #expect(cdn.itemImageURL("1001.png").absoluteString == "https://ddragon.leagueoflegends.com/cdn/16.16.1/img/item/1001.png")
        #expect(cdn.spellImageURL("AatroxQ.png").absoluteString == "https://ddragon.leagueoflegends.com/cdn/16.16.1/img/spell/AatroxQ.png")
        #expect(CDN.championSplashURL("Aatrox").absoluteString == "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg")
        #expect(CDN.championCenteredURL("Aatrox").absoluteString == "https://ddragon.leagueoflegends.com/cdn/img/champion/centered/Aatrox_0.jpg")
        #expect(CDN.cdragonIconURL("/lol-game-data/assets/DATA/Spells/Icons2D/Summoner_flash.png").absoluteString
            == "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/data/spells/icons2d/summoner_flash.png")
    }

    @Test func classIcons() {
        #expect(CDN.championClassIconURL("Fighter")?.absoluteString
            == "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/npe-ft-role-icon-fighter.png")
        #expect(CDN.championClassIconURL("Unknown") == nil)
    }
}
