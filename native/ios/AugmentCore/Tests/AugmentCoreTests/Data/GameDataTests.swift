import Foundation
import Testing
@testable import AugmentCore

// 데이터 내용 자체(개수 스냅샷·설명 길이 등)는 계속 `scripts/check-augment-data.mjs`가 지킨다.
// 여기서는 로더가 원본 JSON을 RN 훅과 같은 결과로 바꾸는지를 본다 — 기대값은 원본 JSON에서 따로 다시 계산한다.
struct GameDataTests {
    @Test(arguments: AppLocale.allCases)
    func loadsEveryFile(locale: AppLocale) throws {
        let d = try RepoData.gameData(locale)
        #expect(d.locale == locale)
        #expect(!d.augments.isEmpty && !d.champions.isEmpty && !d.items.isEmpty)
        #expect(!d.tierlist.aram.isEmpty && !d.tierItemsById.isEmpty)
        #expect(d.headlinerTexts.headliners.count == 13)
    }

    @Test(arguments: AppLocale.allCases)
    func augmentPoolMatchesRawModes(locale: AppLocale) throws {
        let d = try RepoData.gameData(locale)
        let raw = try RepoData.raw("augments.\(locale.rawValue).json") as! [[String: Any]]
        let expected = raw.filter { ($0["modes"] as? [String])?.contains("aram") == true }.map { $0["id"] as! String }
        #expect(d.augmentPool.map(\.id) == expected)
        #expect(d.augments.count == raw.count)
    }

    @Test func itemPoolKeepsItemOrder() throws {
        let d = try RepoData.gameData(.ko)
        let ids = Set(try RepoData.raw("aram-item-ids.json") as! [String])
        let raw = try RepoData.raw("items.ko.json") as! [[String: Any]]
        #expect(d.itemPool.map(\.id) == raw.map { $0["id"] as! String }.filter(ids.contains))
        #expect(d.itemPool.count == ids.count) // aram-item-ids는 전부 items에 있어야 한다
    }

    @Test func localesShareIdsAndOrder() throws {
        let ko = try RepoData.gameData(.ko), en = try RepoData.gameData(.en)
        #expect(ko.augments.map(\.id) == en.augments.map(\.id))
        #expect(ko.champions.map(\.id) == en.champions.map(\.id))
        #expect(ko.items.map(\.id) == en.items.map(\.id))
    }

    @Test func optionalAugmentFields() throws {
        let d = try RepoData.gameData(.ko)
        #expect(d.augments.allSatisfy { !$0.transmuted }) // 데이터에는 없다
        #expect(d.augments.filter { ($0.augmentNameId ?? "").isEmpty }.count <= 1)
    }

    @Test func tierRowsJoinChampionsByKey() throws {
        let d = try RepoData.gameData(.ko)
        #expect(d.tierlist.aram.allSatisfy { d.championsByKey[$0.key] != nil })
        let first = try #require(d.tierlist.aram.first)
        let raw = try RepoData.raw("tierlist.json") as! [String: Any]
        let rawFirst = (raw["aram"] as! [[String: Any]])[0]["augments"] as! [[Int]]
        #expect(first.augments.map { [$0.index, $0.winRate, $0.sourceTier] } == rawFirst)
    }

    @Test func transmutedDisplayName() throws {
        var aug = try #require(try RepoData.gameData(.ko).augments.first)
        let ko = try RepoData.gameData(.ko), en = try RepoData.gameData(.en)
        #expect(ko.displayName(aug) == aug.name)
        aug.transmuted = true
        #expect(ko.displayName(aug) == "전환: \(aug.name)")
        #expect(en.displayName(aug) == "Transmute: \(aug.name)")
    }

    @Test func resolveIdsDropsUnknown() throws {
        let d = try RepoData.gameData(.ko)
        let ids = [d.augments[0].id, "no-such-augment", d.augments[1].id]
        #expect(resolveIds(ids, in: d.augmentsById).map(\.id) == [d.augments[0].id, d.augments[1].id])
        #expect(resolveIds(nil, in: d.augmentsById).isEmpty)
    }

    @Test func storeSwitchesLocaleAndKeepsDataOnFailure() throws {
        let store = try GameDataStore(locale: .ko, load: RepoData.gameData)
        store.setLocale(.en)
        #expect(store.data.locale == .en)

        let failing = try GameDataStore(locale: .ko) { l in
            if l == .en { throw GameData.LoadError.missing("x") }
            return try RepoData.gameData(l)
        }
        failing.setLocale(.en)
        #expect(failing.data.locale == .ko)
    }

    @Test func championTagsAndLabels() {
        #expect(championTags == ["Fighter", "Assassin", "Mage", "Tank", "Marksman", "Support"])
        #expect(championTagLabel("Marksman", .ko) == "원거리")
        #expect(championTagLabel("Marksman", .en) == "Marksman")
    }
}
