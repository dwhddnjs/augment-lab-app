import AugmentCore
import SwiftUI

/// 챔피언 레벨 1 기본 스탯 + 아이템 합산 스탯 행 (RN `items/components/item-stat-panel.tsx`, spec data.md §6).
/// 핵심 13개는 항상(마나류는 마나 없는 챔피언이면 숨김), 나머지는 값이 있을 때만. 아이템으로 더해진 양은 "총합 (+추가분)".
public struct ItemStatPanel: View {
    let baseStats: ChampionStats
    let itemStats: [[String: Double]]
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    /// - itemStats: 담은 아이템들의 `Item.stats`
    public init(baseStats: ChampionStats, itemStats: [[String: Double]]) {
        self.baseStats = baseStats
        self.itemStats = itemStats
    }

    public var body: some View {
        let computed = computeStats(baseStats, itemStats)
        GlassSurface(cornerRadius: Radius.lg) {
            VStack(spacing: Spacing.one) {
                ForEach(StatKey.allCases, id: \.self) { key in
                    if let value = computed[key], Self.isVisible(key, value) {
                        HStack {
                            Text(key.meta.label(settings.locale))
                                .rnText(.caption)
                                .foregroundStyle(palette.text.secondary)
                                .lineLimit(1)
                            Spacer(minLength: 0)
                            Text(valueText(key, value)).rnText(.caption)
                        }
                        .padding(.horizontal, Spacing.half)
                    }
                }
            }
            .padding(Spacing.two + 1) // RN 테두리 1 + padding 8
        }
        .overlay(Radius.shape(Radius.lg).strokeBorder(palette.border.subtle, lineWidth: 1))
    }

    static func isVisible(_ key: StatKey, _ v: StatValue) -> Bool {
        if (key == .mp || key == .mpregen) && v.total == 0 { return false }
        return key.meta.core || v.total != 0 || v.added != 0
    }

    private func valueText(_ key: StatKey, _ v: StatValue) -> AttributedString {
        let unit = key.meta.unit ?? ""
        let decimals = key.meta.decimals
        var out = AttributedString(formatNumber(v.total, decimals) + unit)
        out.foregroundColor = palette.text.primary
        guard v.added > 0 else { return out }
        // 공격 속도는 총합을 절대값으로, 추가분은 아이템 % 증가율로(added = base × Σ% 이므로 added/base = Σ%).
        let added = key == .attackspeed && v.base > 0
            ? "+\(formatNumber(v.added / v.base * 100, 0))%"
            : "+\(formatNumber(v.added, decimals))\(unit)"
        var tail = AttributedString(" (\(added))")
        tail.foregroundColor = palette.accent.default
        return out + tail
    }
}

/// RN `formatNumber`: 0자리면 `Math.round(v).toString()`, 아니면 `parseFloat(v.toFixed(d)).toString()`.
private func formatNumber(_ value: Double, _ decimals: Int) -> String {
    if decimals == 0 { return String(Int((value + 0.5).rounded(.down))) } // JS Math.round = floor(x + 0.5)
    let v = Double(jsToFixed(value, decimals))!
    return v == v.rounded() && abs(v) < 1e15 ? String(Int(v)) : String(v)
}

// ponytail: AugmentCore `jsToFixed`(Tierlist.swift)가 internal이라 그대로 베꼈다. public이 되면 지운다(승격 후보).
/// JS `toFixed`: 이진 값의 정확한 십진 전개에서 반올림, 동률은 0에서 먼 쪽.
private func jsToFixed(_ x: Double, _ digits: Int) -> String {
    let exact = String(format: "%.80f", abs(x))
    let parts = exact.split(separator: ".")
    var kept = Array(parts[0]) + Array(parts[1].prefix(digits))
    if let next = parts[1].dropFirst(digits).first, next >= "5" {
        var i = kept.count - 1
        while i >= 0 {
            if kept[i] == "9" { kept[i] = "0"; i -= 1 } else { kept[i] = Character(String(kept[i].wholeNumberValue! + 1)); break }
        }
        if i < 0 { kept.insert("1", at: 0) }
    }
    let intCount = kept.count - digits
    let body = String(kept[..<intCount]) + (digits > 0 ? "." + String(kept[intCount...]) : "")
    return (x < 0 && kept.contains { $0 != "0" } ? "-" : "") + body
}

#Preview {
    @Previewable @State var settings = AppSettings(store: MemoryKeyValueStore())
    let data = try! GameData.bundled(locale: settings.locale)
    let items = ["3031", "3006", "3046"].compactMap { data.itemsById[$0]?.stats }
    HStack(alignment: .top, spacing: Spacing.three) {
        ItemStatPanel(baseStats: data.championsById["Jinx"]!.stats, itemStats: items)
        ItemStatPanel(baseStats: data.championsById["Garen"]!.stats, itemStats: [])
    }
    .padding(Spacing.three)
    .surfaceBackground()
    .appSettings(settings)
    .providesPalette()
}
