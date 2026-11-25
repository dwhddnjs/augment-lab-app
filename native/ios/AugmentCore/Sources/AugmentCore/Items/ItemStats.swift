/// 아이템 스탯 합산·표시 (RN `src/features/items/stats.ts`). spec/data.md §6.

/// 표시 항목. **선언 순서 = 표시 순서**(RN `STAT_DISPLAY_ORDER`). 앞 13개는 핵심 스탯(0이어도 표시).
public enum StatKey: String, CaseIterable, Sendable {
    case hp, hpregen, mp, mpregen, attackdamage, abilitypower, armor, spellblock
    case attackspeed, abilityhaste, crit, movespeed, attackrange
    case critdamage, lethality, armorpen, magicpenFlat, magicpenPercent
    case lifesteal, omnivamp, tenacity, healshield, adaptive

    public struct Meta: Sendable {
        public let ko: String, en: String
        /// "%" 등
        public let unit: String?
        /// 0이어도 항상 표시
        public let core: Bool
        public let decimals: Int
        public func label(_ locale: AppLocale) -> String { locale == .ko ? ko : en }
    }

    public var meta: Meta {
        switch self {
        case .hp: Meta(ko: "체력", en: "Health", unit: nil, core: true, decimals: 0)
        case .hpregen: Meta(ko: "체력 재생", en: "Health Regen", unit: nil, core: true, decimals: 1)
        case .mp: Meta(ko: "마나", en: "Mana", unit: nil, core: true, decimals: 0)
        case .mpregen: Meta(ko: "마나 재생", en: "Mana Regen", unit: nil, core: true, decimals: 1)
        case .attackdamage: Meta(ko: "공격력", en: "Attack Damage", unit: nil, core: true, decimals: 0)
        case .abilitypower: Meta(ko: "주문력", en: "Ability Power", unit: nil, core: true, decimals: 0)
        case .armor: Meta(ko: "방어력", en: "Armor", unit: nil, core: true, decimals: 0)
        case .spellblock: Meta(ko: "마법 저항력", en: "Magic Resist", unit: nil, core: true, decimals: 0)
        case .attackspeed: Meta(ko: "공격 속도", en: "Attack Speed", unit: nil, core: true, decimals: 3)
        case .abilityhaste: Meta(ko: "스킬 가속", en: "Ability Haste", unit: nil, core: true, decimals: 0)
        case .crit: Meta(ko: "치명타 확률", en: "Crit Chance", unit: "%", core: true, decimals: 1)
        case .movespeed: Meta(ko: "이동 속도", en: "Move Speed", unit: nil, core: true, decimals: 0)
        case .attackrange: Meta(ko: "사거리", en: "Attack Range", unit: nil, core: true, decimals: 0)
        case .critdamage: Meta(ko: "치명타 피해량", en: "Crit Damage", unit: "%", core: false, decimals: 1)
        case .lethality: Meta(ko: "물리 관통력", en: "Lethality", unit: nil, core: false, decimals: 0)
        case .armorpen: Meta(ko: "방어구 관통력", en: "Armor Pen", unit: "%", core: false, decimals: 1)
        case .magicpenFlat: Meta(ko: "마법 관통력", en: "Magic Pen", unit: nil, core: false, decimals: 0)
        case .magicpenPercent: Meta(ko: "마법 관통력(%)", en: "Magic Pen (%)", unit: "%", core: false, decimals: 1)
        case .lifesteal: Meta(ko: "생명력 흡수", en: "Life Steal", unit: "%", core: false, decimals: 1)
        case .omnivamp: Meta(ko: "모든 피해 흡혈", en: "Omnivamp", unit: "%", core: false, decimals: 1)
        case .tenacity: Meta(ko: "강인함", en: "Tenacity", unit: "%", core: false, decimals: 1)
        case .healshield: Meta(ko: "회복 및 보호막", en: "Heal & Shield", unit: "%", core: false, decimals: 1)
        case .adaptive: Meta(ko: "적응형 능력치", en: "Adaptive Force", unit: nil, core: false, decimals: 0)
        }
    }
}

public struct StatValue: Hashable, Sendable {
    /// 챔피언 기본값
    public let base: Double
    /// 아이템으로 더해진 양
    public let added: Double
    public let total: Double
    init(_ base: Double, _ total: Double) { self.base = base; added = total - base; self.total = total }
}

/// 챔피언 레벨 1 기본 스탯 + 아이템 스탯. 비율 키(0.4 = 40%) 중 % 표시 항목은 ×100으로 돌려준다.
public func computeStats(_ base: ChampionStats, _ items: [[String: Double]]) -> [StatKey: StatValue] {
    func sum(_ k: String) -> Double { items.reduce(0) { $0 + ($1[k] ?? 0) } }
    return [
        .hp: StatValue(base.hp, base.hp + sum("hp")),
        .hpregen: StatValue(base.hpregen, base.hpregen * (1 + sum("hpregen"))),
        .mp: StatValue(base.mp, base.mp + sum("mp")),
        .mpregen: StatValue(base.mpregen, base.mpregen * (1 + sum("mpregen"))),
        .attackdamage: StatValue(base.attackdamage, base.attackdamage + sum("attackdamage")),
        .abilitypower: StatValue(0, sum("abilitypower")),
        .armor: StatValue(base.armor, base.armor + sum("armor")),
        .spellblock: StatValue(base.spellblock, base.spellblock + sum("spellblock")),
        .attackspeed: StatValue(base.attackspeed, base.attackspeed * (1 + sum("attackspeed"))),
        .abilityhaste: StatValue(0, sum("abilityhaste")),
        .crit: StatValue(0, min(100, base.crit + sum("crit") * 100)),
        .critdamage: StatValue(0, sum("critdamage") * 100),
        .lethality: StatValue(0, sum("lethality")),
        .armorpen: StatValue(0, sum("armorpen") * 100),
        .magicpenFlat: StatValue(0, sum("magicpenFlat")),
        .magicpenPercent: StatValue(0, sum("magicpenPercent") * 100),
        .lifesteal: StatValue(0, sum("lifesteal") * 100),
        .omnivamp: StatValue(0, sum("omnivamp") * 100),
        .movespeed: StatValue(base.movespeed, (base.movespeed + sum("movespeedFlat")) * (1 + sum("movespeedPercent"))),
        .tenacity: StatValue(0, sum("tenacity") * 100),
        .healshield: StatValue(0, sum("healshield") * 100),
        .attackrange: StatValue(base.attackrange, base.attackrange),
        .adaptive: StatValue(0, sum("adaptive")),
    ]
}

/// % 로 표기하는 비율 키(0.4 = 40%)
private let ratioKeys: Set<String> = [
    "attackspeed", "movespeedPercent", "hpregen", "mpregen", "crit", "critdamage",
    "armorpen", "magicpenPercent", "lifesteal", "omnivamp", "tenacity", "healshield",
]

/// 아이템 한 개 스탯 요약 "체력 250 · 공격력 20" — 빌드 상세 아이템 행 설명. 순서는 원본 JSON 키 순서(`Item.statOrder`).
public func formatItemStats(_ item: Item, _ locale: AppLocale) -> String {
    formatItemStats(item.stats, order: item.statOrder.isEmpty ? item.stats.keys.sorted() : item.statOrder, locale)
}

public func formatItemStats(_ stats: [String: Double], order: [String], _ locale: AppLocale) -> String {
    order.compactMap { key -> String? in
        guard let value = stats[key], value != 0 else { return nil }
        let alias = key == "movespeedFlat" || key == "movespeedPercent" ? "movespeed" : key
        guard let meta = StatKey(rawValue: alias)?.meta else { return nil }
        let ratio = ratioKeys.contains(key)
        return "\(meta.label(locale)) \(jsNumber(oneDecimal(ratio ? value * 100 : value)))\(ratio ? "%" : "")"
    }.joined(separator: " · ")
}

/// JS `parseFloat(v.toFixed(1))`
func oneDecimal(_ v: Double) -> Double { (v * 10).rounded() / 10 }

/// JS 숫자 → 문자열 (정수면 소수점 없이)
func jsNumber(_ v: Double) -> String { v == v.rounded() && abs(v) < 1e15 ? String(Int(v)) : String(v) }
