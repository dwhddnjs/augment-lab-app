/// 아이템 역할 필터 (RN `src/features/items/item-filters.ts`). 판정 규칙을 그대로 옮겼다.
public struct ItemFilter: Hashable, Identifiable, Sendable {
    public enum Icon: Hashable, Sendable {
        /// MaterialCommunityIcons 글리프 이름
        case mci(String)
        /// CDragon 역할 아이콘(`CDN.championClassIconURL`)
        case classTag(String)
    }

    public let id: String
    public let ko: String
    public let en: String
    public let icon: Icon
    private let rule: @Sendable (Item) -> Bool

    public func label(_ locale: AppLocale) -> String { locale == .ko ? ko : en }
    public func matches(_ item: Item) -> Bool { rule(item) }

    public static func == (a: ItemFilter, b: ItemFilter) -> Bool { a.id == b.id }
    public func hash(into h: inout Hasher) { h.combine(id) }

    /// 표시 순서: 전체 · 전사 · 원거리딜러 · 암살자 · 마법사 · 탱커 · 서포터 · 신발
    public static let all: [ItemFilter] = [
        ItemFilter(id: "all", ko: "전체", en: "All", icon: .mci("apps")) { _ in true },
        ItemFilter(id: "fighter", ko: "전사", en: "Fighter", icon: .classTag("Fighter")) { i in
            inCategory(i, "fighter") {
                has(i, "Damage") && (has(i, "Health") || has(i, "LifeSteal") || has(i, "Mana") || has(i, "Armor"))
                    && !has(i, "CriticalStrike") && !has(i, "SpellDamage") && !has(i, "Aura") && !has(i, "Boots")
            }
        },
        ItemFilter(id: "marksman", ko: "원거리딜러", en: "Marksman", icon: .classTag("Marksman")) { i in
            inCategory(i, "marksman") { has(i, "CriticalStrike") && !has(i, "Boots") }
        },
        ItemFilter(id: "assassin", ko: "암살자", en: "Assassin", icon: .classTag("Assassin")) { i in
            inCategory(i, "assassin") {
                has(i, "ArmorPenetration") && !has(i, "CriticalStrike") && !has(i, "Health") && !has(i, "SpellDamage") && !has(i, "Boots")
            }
        },
        ItemFilter(id: "mage", ko: "마법사", en: "Mage", icon: .classTag("Mage")) { i in
            inCategory(i, "mage") { (has(i, "SpellDamage") || has(i, "MagicPenetration")) && !has(i, "Boots") }
        },
        ItemFilter(id: "tank", ko: "탱커", en: "Tank", icon: .classTag("Tank")) { i in
            inCategory(i, "tank") {
                !has(i, "Damage") && !has(i, "CriticalStrike") && !has(i, "SpellDamage") && !has(i, "ArmorPenetration") && !has(i, "Boots")
                    && (has(i, "Armor") || has(i, "SpellBlock") || has(i, "Tenacity") || has(i, "HealthRegen"))
            }
        },
        ItemFilter(id: "support", ko: "서포터", en: "Support", icon: .classTag("Support")) { i in
            inCategory(i, "support") {
                !has(i, "Boots") && (has(i, "Aura") || has(i, "SpellVamp") || has(i, "GoldPer")
                    || (has(i, "ManaRegen") && !has(i, "Damage") && !has(i, "SpellDamage")))
            }
        },
        ItemFilter(id: "boots", ko: "신발", en: "Boots", icon: .mci("shoe-sneaker")) { i in
            inCategory(i, "boots") { has(i, "Boots") }
        },
    ]

    init(id: String, ko: String, en: String, icon: Icon, rule: @escaping @Sendable (Item) -> Bool) {
        self.id = id; self.ko = ko; self.en = en; self.icon = icon; self.rule = rule
    }
}

private func has(_ item: Item, _ tag: String) -> Bool { item.tags.contains(tag) }

/// 신발은 '전체'·'신발' 탭에만. 오버라이드 표가 태그 판정보다 우선한다.
private func inCategory(_ item: Item, _ key: String, _ tagFallback: () -> Bool) -> Bool {
    if key != "boots" && key != "all" && has(item, "Boots") { return false }
    if let cats = itemCategoryOverrides[item.id] { return cats.contains(key) }
    if key == "boots" { return has(item, "Boots") }
    return tagFallback()
}

/// 태그만으로는 역할이 틀리게 잡히는 아이템 32개 (RN `ITEM_CATEGORIES`)
let itemCategoryOverrides: [String: [String]] = [
    "2065": ["support"], "2517": ["fighter"], "2524": ["support"], "3050": ["support"],
    "3068": ["tank"], "3072": ["marksman"], "3087": ["marksman"], "3091": ["fighter"],
    "3107": ["support"], "3109": ["support"], "3110": ["tank"], "3139": ["marksman"],
    "3146": ["mage"], "3156": ["fighter"], "3190": ["support"], "3222": ["support"],
    "3302": ["marksman"], "3504": ["support"], "3814": ["assassin"], "4005": ["support"],
    "4633": ["mage"], "4646": ["mage"], "6616": ["support"], "6617": ["support"],
    "6620": ["support"], "6621": ["support"], "6664": ["tank"], "6672": ["marksman"],
    "6692": ["fighter"], "6697": ["assassin"], "3119": ["tank"], "3124": ["marksman"],
]
