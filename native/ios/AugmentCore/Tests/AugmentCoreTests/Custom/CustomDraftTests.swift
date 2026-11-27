import CryptoKit
import Foundation
import Testing
@testable import AugmentCore

// 정렬·필터 기대값은 RN `use-custom-draft.ts` 의 list/itemList 식을 tsx로 그대로 돌려 뽑았다(2026-11-27).
// 목록이 길어 id를 ","로 이은 문자열의 SHA-256 앞 16자로 비교한다. 데이터가 바뀌면 같은 식으로 다시 뽑는다.
struct CustomDraftTests {
    static let ko = try! RepoData.gameData(.ko)
    static let en = try! RepoData.gameData(.en)

    func digest(_ ids: [String]) -> String {
        SHA256.hash(data: Data(ids.joined(separator: ",").utf8)).map { String(format: "%02x", $0) }.joined().prefix(16).description
    }

    func draft(_ data: GameData, championId: String? = nil) -> CustomDraft {
        CustomDraft(data: data, championId: championId ?? data.champions[0].id)
    }

    @Test(arguments: [
        ("ko", CustomDraft.SortKey.name, nil as Rarity?, "", 233, "01fe824cb23abbbb", "tripleshot"),
        ("ko", .rarity, nil, "", 233, "5d17fa165776c8ca", "tripleshot"),
        ("ko", .name, .gold, "ㄱ", 35, "4603002f5e103bc0", "pursuit-of-haste"),
        ("en", .name, nil, "", 233, "92626f19ad1162cf", "adapt"),
        ("en", .rarity, nil, "", 233, "66ecc4370cfa42c7", "archmage"),
        ("en", .name, .gold, "b", 23, "074f8155ab638147", "bees"),
    ])
    func listMatchesRN(locale: String, sort: CustomDraft.SortKey, tier: Rarity?, query: String, count: Int, hash: String, first: String) {
        let d = draft(locale == "ko" ? Self.ko : Self.en)
        d.sort = sort
        d.tier = tier
        d.query = query
        let ids = d.list.map(\.id)
        #expect(ids.count == count)
        #expect(ids.first == first)
        #expect(digest(ids) == hash)
    }

    @Test func defaultSortKeepsPoolOrder() {
        let d = draft(Self.ko)
        #expect(d.list.map(\.id) == Self.ko.augmentPool.map(\.id))
    }

    @Test(arguments: [("ko", "ㄱ", 8, "b19d88daa3b2e6cf"), ("en", "a", 17, "8f0276bde88c00aa")])
    func itemListMatchesRN(locale: String, query: String, count: Int, hash: String) {
        let d = draft(locale == "ko" ? Self.ko : Self.en)
        d.itemFilter = ItemFilter.all.first { $0.id == "tank" }!
        d.query = query
        d.sort = .name // 아이템은 정렬을 안 탄다
        let ids = d.itemList.map(\.id)
        #expect(ids.count == count)
        #expect(digest(ids) == hash)
        #expect(draft(Self.ko).itemList.count == 111) // 기본 필터 = 전체
    }

    @Test func toggleTargetFlipsAndClearsQuery() {
        let d = draft(Self.ko)
        d.query = "ㄱ"
        d.toggleTarget()
        #expect(d.target == .item && d.query.isEmpty)
        d.toggleTarget()
        #expect(d.target == .augment)
    }

    @Test func rapidAddsRespectDuplicateAndLimit() {
        let d = draft(Self.ko)
        let pool = Self.ko.augmentPool
        // 같은 것을 연타
        #expect([d.add(pool[0]), d.add(pool[0]), d.add(pool[0])] == [.added, .duplicate, .duplicate])
        // 정원 5를 넘겨 연타
        let results = pool[1...7].map { d.add($0) }
        #expect(results == [.added, .added, .added, .added, .full, .full, .full])
        #expect(d.picked.map(\.id) == pool[0...4].map(\.id))
        #expect(d.add(pool[2]) == .duplicate) // 가득 차도 중복이 먼저

        let items = Self.ko.itemPool
        #expect([d.addItem(items[0]), d.addItem(items[0])] == [.added, .duplicate])
        let itemResults = items[1...7].map { d.addItem($0) }
        #expect(itemResults == [.added, .added, .added, .added, .added, .full, .full])
        #expect(d.items.count == 6 && Set(d.items.map(\.id)).count == 6)
    }

    @Test func removeAndClear() {
        let d = draft(Self.ko)
        let pool = Self.ko.augmentPool
        pool[0...2].forEach { d.add($0) }
        Self.ko.itemPool[0...1].forEach { d.addItem($0) }
        d.remove(pool[1].id)
        d.removeItem(Self.ko.itemPool[0].id)
        #expect(d.picked.map(\.id) == [pool[0].id, pool[2].id])
        #expect(d.items.map(\.id) == [Self.ko.itemPool[1].id])
        #expect(d.add(pool[1]) == .added) // 뺀 것은 다시 담을 수 있다
        d.clear()
        #expect(d.picked.isEmpty && d.items.isEmpty)
    }

    @Test func changingChampionKeepsPicks() {
        let d = draft(Self.ko)
        d.add(Self.ko.augmentPool[0])
        d.championId = Self.ko.champions[1].id
        #expect(d.picked.count == 1 && d.champion?.id == Self.ko.champions[1].id)
    }

    @Test func savePayload() {
        let d = draft(Self.ko)
        #expect(d.savePayload == nil) // 아무것도 안 담음
        d.addItem(Self.ko.itemPool[0])
        #expect(d.savePayload == .init(championId: Self.ko.champions[0].id, augmentIds: [], itemIds: [Self.ko.itemPool[0].id]))
        d.add(Self.ko.augmentPool[3])
        d.add(Self.ko.augmentPool[1])
        let p = d.savePayload!
        #expect(p.mode == "aram" && p.custom)
        #expect(p.augmentIds == [Self.ko.augmentPool[3].id, Self.ko.augmentPool[1].id]) // 담은 순서
        d.championId = "no-such-champion"
        #expect(d.champion == nil && d.savePayload == nil) // 챔피언을 못 찾음
    }
}
