import Foundation
import Testing
@testable import AugmentCore

// pct 기대값은 node에서 `(n*100).toFixed(1)`로 뽑았다. 섹션·그룹은 원본 JSON에서 따로 다시 계산해 비교한다.
struct TierlistTests {
    @Test(arguments: [
        (0.583, "58.3%"), (0.1164, "11.6%"), (0.1225, "12.3%"), (0.0725, "7.2%"), (0.0005, "0.1%"),
        (0.99999, "100.0%"), (0, "0.0%"), (1, "100.0%"), (0.5555, "55.5%"), (0.12345, "12.3%"), (0.814, "81.4%"),
    ])
    func pctMatchesJsToFixed(n: Double, expected: String) {
        #expect(Tierlist.pct(n) == expected)
    }

    @Test(arguments: [(12.25, "12.3"), (0.05, "0.1"), (2.5, "2.5"), (1.45, "1.4"), (7.25, "7.3"), (9.96, "10.0"), (-1.25, "-1.3")])
    func toFixedTies(v: Double, expected: String) {
        #expect(jsToFixed(v, 1) == expected)
    }

    @Test func augTierMapping() {
        #expect((0...5).map(Tierlist.augTier) == [.D, .S, .A, .B, .C, .D])
    }

    @Test func sectionsCoverEveryRowInOrder() throws {
        let rows = try RepoData.gameData(.ko).tierlist.aram
        let sections = Tierlist.sections(rows)
        #expect(sections.flatMap { $0.rows.flatMap { $0 } } == rows) // 이미 티어순 — 순서 그대로
        #expect(sections.allSatisfy { s in s.rows.allSatisfy { $0.count <= Tierlist.columns && $0.allSatisfy { $0.tier == s.tier } } })
        #expect(sections.map(\.tier) == Tier.allCases.filter { t in rows.contains { $0.tier == t } })
    }

    @Test func searchHidesButKeepsTiers() throws {
        let d = try RepoData.gameData(.ko)
        let rows = d.tierlist.aram
        let match: (TierRow) -> Bool = { matchKey in d.championsByKey[matchKey.key]?.name.contains("아") == true }
        let filtered = Tierlist.sections(rows, match: match)
        for row in filtered.flatMap({ $0.rows.flatMap { $0 } }) {
            #expect(rows.first { $0.key == row.key }?.tier == row.tier)
        }
        #expect(filtered.allSatisfy { !$0.rows.isEmpty })
    }

    @Test func augmentGroupsMatchRawJoin() throws {
        let d = try RepoData.gameData(.ko)
        let row = try #require(d.tierlist.aram.first)
        let groups = Tierlist.augmentGroups(row, d)
        #expect(groups.map(\.rarity).allSatisfy { [.prismatic, .gold, .silver].contains($0) })
        #expect(groups.map(\.rarity) == [Rarity.prismatic, .gold, .silver].filter { r in groups.contains { $0.rarity == r } })
        // 원본에서 다시 계산: 풀에 있는 증강만, 희귀도별로 소스 티어 오름차순(동률은 원래 순서)
        let pool = Set(d.augmentPool.map(\.id))
        for g in groups {
            let expected = row.augments.enumerated()
                .compactMap { i, e -> (Int, Int, String)? in
                    let id = d.tierlist.augIds[e.index]
                    return pool.contains(id) && d.augmentsById[id]?.rarity == g.rarity ? (e.sourceTier, i, id) : nil
                }
                .sorted { ($0.0, $0.1) < ($1.0, $1.1) }.map(\.2)
            #expect(g.list.map(\.augment.id) == expected)
        }
        #expect(Tierlist.augmentGroups(nil, d).isEmpty)
    }

    @Test func formatSourceFillsOnce() throws {
        let f = try RepoData.gameData(.ko).tierlist
        #expect(Tierlist.formatSource("{patch} · {date} · {patch}", f) == "\(f.patch) · \(f.date) · {patch}")
        #expect(Tierlist.findRow(f.aram, key: f.aram[3].key) == f.aram[3])
        #expect(Tierlist.findRow(f.aram, key: "nope") == nil)
    }
}
