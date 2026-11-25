import Testing
@testable import AugmentCore

// 기대값은 RN `stats.ts`·`item-filters.ts`를 tsx로 실행해 뽑은 골든 값이다(2026-11-26).
// 입력을 고정해서 데이터 패치에 흔들리지 않는다.
struct ItemMathTests {
    static let base = ChampionStats(hp: 650.0, hpperlevel: 114.0, mp: 0.0, mpperlevel: 0.0, movespeed: 345.0, armor: 38.0, armorperlevel: 4.8, spellblock: 32.0, spellblockperlevel: 2.05, attackrange: 175.0, hpregen: 3.0, hpregenperlevel: 0.5, mpregen: 0.0, mpregenperlevel: 0.0, crit: 0.0, critperlevel: 0.0, attackdamage: 60.0, attackdamageperlevel: 0.0, attackspeedperlevel: 2.5, attackspeed: 0.651)

    /// [StatKey 순서대로 (키, base, added, total)] — 입력 목록 3개
    static let inputs: [[[String: Double]]] = [
        [["attackdamage": 40, "attackspeed": 0.25, "lifesteal": 0.1], ["crit": 0.25, "critdamage": 0.4, "movespeedPercent": 0.07]],
        [["hp": 300, "abilityhaste": 20, "movespeedFlat": 25, "hpregen": 1.0], ["crit": 0.5], ["crit": 0.5], ["crit": 0.5]],
        [],
    ]
    static let expected: [[(String, Double, Double, Double)]] = [
        [("hp", 650.0, 0.0, 650.0), ("hpregen", 3.0, 0.0, 3.0), ("mp", 0.0, 0.0, 0.0), ("mpregen", 0.0, 0.0, 0.0), ("attackdamage", 60.0, 40.0, 100.0), ("abilitypower", 0.0, 0.0, 0.0), ("armor", 38.0, 0.0, 38.0), ("spellblock", 32.0, 0.0, 32.0), ("attackspeed", 0.651, 0.16274999999999995, 0.81375), ("abilityhaste", 0.0, 0.0, 0.0), ("crit", 0.0, 25.0, 25.0), ("movespeed", 345.0, 24.150000000000034, 369.15000000000003), ("attackrange", 175.0, 0.0, 175.0), ("critdamage", 0.0, 40.0, 40.0), ("lethality", 0.0, 0.0, 0.0), ("armorpen", 0.0, 0.0, 0.0), ("magicpenFlat", 0.0, 0.0, 0.0), ("magicpenPercent", 0.0, 0.0, 0.0), ("lifesteal", 0.0, 10.0, 10.0), ("omnivamp", 0.0, 0.0, 0.0), ("tenacity", 0.0, 0.0, 0.0), ("healshield", 0.0, 0.0, 0.0), ("adaptive", 0.0, 0.0, 0.0)],
        [("hp", 650.0, 300.0, 950.0), ("hpregen", 3.0, 3.0, 6.0), ("mp", 0.0, 0.0, 0.0), ("mpregen", 0.0, 0.0, 0.0), ("attackdamage", 60.0, 0.0, 60.0), ("abilitypower", 0.0, 0.0, 0.0), ("armor", 38.0, 0.0, 38.0), ("spellblock", 32.0, 0.0, 32.0), ("attackspeed", 0.651, 0.0, 0.651), ("abilityhaste", 0.0, 20.0, 20.0), ("crit", 0.0, 100.0, 100.0), ("movespeed", 345.0, 25.0, 370.0), ("attackrange", 175.0, 0.0, 175.0), ("critdamage", 0.0, 0.0, 0.0), ("lethality", 0.0, 0.0, 0.0), ("armorpen", 0.0, 0.0, 0.0), ("magicpenFlat", 0.0, 0.0, 0.0), ("magicpenPercent", 0.0, 0.0, 0.0), ("lifesteal", 0.0, 0.0, 0.0), ("omnivamp", 0.0, 0.0, 0.0), ("tenacity", 0.0, 0.0, 0.0), ("healshield", 0.0, 0.0, 0.0), ("adaptive", 0.0, 0.0, 0.0)],
        [("hp", 650.0, 0.0, 650.0), ("hpregen", 3.0, 0.0, 3.0), ("mp", 0.0, 0.0, 0.0), ("mpregen", 0.0, 0.0, 0.0), ("attackdamage", 60.0, 0.0, 60.0), ("abilitypower", 0.0, 0.0, 0.0), ("armor", 38.0, 0.0, 38.0), ("spellblock", 32.0, 0.0, 32.0), ("attackspeed", 0.651, 0.0, 0.651), ("abilityhaste", 0.0, 0.0, 0.0), ("crit", 0.0, 0.0, 0.0), ("movespeed", 345.0, 0.0, 345.0), ("attackrange", 175.0, 0.0, 175.0), ("critdamage", 0.0, 0.0, 0.0), ("lethality", 0.0, 0.0, 0.0), ("armorpen", 0.0, 0.0, 0.0), ("magicpenFlat", 0.0, 0.0, 0.0), ("magicpenPercent", 0.0, 0.0, 0.0), ("lifesteal", 0.0, 0.0, 0.0), ("omnivamp", 0.0, 0.0, 0.0), ("tenacity", 0.0, 0.0, 0.0), ("healshield", 0.0, 0.0, 0.0), ("adaptive", 0.0, 0.0, 0.0)],
    ]

    @Test func computeStatsMatchesRN() {
        #expect(StatKey.allCases.map(\.rawValue) == Self.expected[0].map(\.0)) // 표시 순서
        for (items, exp) in zip(Self.inputs, Self.expected) {
            let got = computeStats(Self.base, items)
            for (k, b, a, t) in exp {
                let v = got[StatKey(rawValue: k)!]!
                #expect(v.base == b && v.added == a && v.total == t, "\(k): \(v)")
            }
        }
    }

    static let formats: [([String: Double], [String], String, String)] = [
        (["attackdamage": 40.0, "attackspeed": 0.25, "lifesteal": 0.1], ["attackdamage", "attackspeed", "lifesteal"], "공격력 40 · 공격 속도 25% · 생명력 흡수 10%", "Attack Damage 40 · Attack Speed 25% · Life Steal 10%"),
        (["movespeedFlat": 25.0], ["movespeedFlat"], "이동 속도 25", "Move Speed 25"),
        (["movespeedPercent": 0.07, "hp": 250.0], ["movespeedPercent", "hp"], "이동 속도 7% · 체력 250", "Move Speed 7% · Health 250"),
        (["hpregen": 1.0, "mpregen": 0.5], ["hpregen", "mpregen"], "체력 재생 100% · 마나 재생 50%", "Health Regen 100% · Mana Regen 50%"),
        (["abilityhaste": 0.0, "armor": 30.0], ["abilityhaste", "armor"], "방어력 30", "Armor 30"),
        (["crit": 0.155], ["crit"], "치명타 확률 15.5%", "Crit Chance 15.5%"),
        (["unknownStat": 5.0, "magicpenFlat": 18.0], ["unknownStat", "magicpenFlat"], "마법 관통력 18", "Magic Pen 18"),
        (["omnivamp": 0.035], ["omnivamp"], "모든 피해 흡혈 3.5%", "Omnivamp 3.5%"),
    ]

    @Test func formatItemStatsMatchesRN() {
        for (stats, order, ko, en) in Self.formats {
            #expect(formatItemStats(stats, order: order, .ko) == ko)
            #expect(formatItemStats(stats, order: order, .en) == en)
        }
    }

    static let items: [(String, [String])] = [
        ("2065", ["Health", "Aura"]),
        ("9001", ["Damage", "Health"]),
        ("9002", ["Damage", "Health", "CriticalStrike"]),
        ("9003", ["CriticalStrike"]),
        ("9004", ["ArmorPenetration"]),
        ("9005", ["ArmorPenetration", "Health"]),
        ("9006", ["SpellDamage"]),
        ("9007", ["MagicPenetration"]),
        ("9008", ["Armor"]),
        ("9009", ["HealthRegen", "Damage"]),
        ("9010", ["Aura"]),
        ("9011", ["ManaRegen"]),
        ("9012", ["ManaRegen", "Damage"]),
        ("9013", ["Boots", "Armor"]),
        ("3814", ["Damage", "CriticalStrike"]),
        ("9014", ["GoldPer", "Damage"]),
        ("9015", []),
    ]
    static let filterExpected: [String: [String]] = [
        "all": ["2065", "9001", "9002", "9003", "9004", "9005", "9006", "9007", "9008", "9009", "9010", "9011", "9012", "9013", "3814", "9014", "9015"],
        "fighter": ["9001"],
        "marksman": ["9002", "9003"],
        "assassin": ["9004", "3814"],
        "mage": ["9006", "9007"],
        "tank": ["9008"],
        "support": ["2065", "9010", "9011", "9014"],
        "boots": ["9013"],
    ]

    @Test func filtersMatchRN() throws {
        let template = try #require(try RepoData.gameData(.ko).items.first)
        let items = Self.items.map { id, tags in var i = template; i.id = id; i.tags = tags; return i }
        #expect(ItemFilter.all.map(\.id) == ["all", "fighter", "marksman", "assassin", "mage", "tank", "support", "boots"])
        for f in ItemFilter.all {
            #expect(items.filter(f.matches).map(\.id) == Self.filterExpected[f.id], "\(f.id)")
        }
        #expect(itemCategoryOverrides.count == 32)
    }

    @Test func formatUsesJsonKeyOrderFromData() throws {
        let d = try RepoData.gameData(.ko)
        #expect(formatItemStats(try #require(d.itemsById["3153"]), .ko) == "공격력 40 · 공격 속도 25% · 생명력 흡수 10%")
    }
}
