import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["hp": "체력", "ad": "공격력", "armor": "방어력", "mr": "마저", "ms": "이속"],
    en: ["hp": "HP", "ad": "AD", "armor": "Armor", "mr": "MR", "ms": "MS"]
)

/// 챔피언 아이콘·이름·역할 + 핵심 스탯 칩(체력·공격력·방어력·마저·이속) (RN `champion-summary.tsx`)
struct ChampionSummary: View {
    let champion: Champion

    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let t = L.t(settings.locale)
        let s = champion.stats
        let stats: [(String, Double)] = [("hp", s.hp), ("ad", s.attackdamage), ("armor", s.armor), ("mr", s.spellblock), ("ms", s.movespeed)]

        VStack(alignment: .leading, spacing: Spacing.three) {
            HStack(spacing: Spacing.three) {
                RemoteImage(store.data.cdn.championSquareURL(champion.imageKey), size: 56)
                    .clipShape(Radius.shape(Radius.md))
                    .overlay(Radius.shape(Radius.md).strokeBorder(palette.accent.default, lineWidth: 1.5))
                VStack(alignment: .leading, spacing: Spacing.one) {
                    Text(champion.name).rnText(.heading).lineLimit(1)
                    WrapLayout(spacing: Spacing.one) {
                        ForEach(champion.tags, id: \.self) { tag in
                            Text(championTagLabel(tag, settings.locale))
                                .rnText(.caption)
                                .foregroundStyle(palette.accent.default)
                                .padding(.horizontal, Spacing.two)
                                .padding(.vertical, Spacing.half)
                                .background(palette.accent.subtle, in: Capsule())
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            WrapLayout(spacing: Spacing.two) {
                ForEach(stats, id: \.0) { key, value in
                    VStack(spacing: Spacing.half) {
                        Text(t(key)).rnText(.caption).foregroundStyle(palette.text.tertiary)
                        Text("\(Int(value.rounded()))").rnText(.label)
                    }
                    .frame(minWidth: 56)
                    .padding(.horizontal, Spacing.two)
                    .padding(.vertical, Spacing.one)
                    .background(palette.surface.raised, in: Radius.shape(Radius.md))
                    .overlay(Radius.shape(Radius.md).strokeBorder(palette.border.subtle, lineWidth: 1))
                }
            }
        }
    }
}

/// 가로로 늘어놓다 넘치면 다음 줄 (RN `flexDirection: row, flexWrap: wrap, gap`). 줄 안은 위 정렬.
struct WrapLayout: Layout {
    var spacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = rows(subviews, width: proposal.width ?? .infinity)
        let width = rows.map { $0.width }.max() ?? 0
        let height = rows.map(\.height).reduce(0, +) + spacing * CGFloat(max(rows.count - 1, 0))
        return CGSize(width: proposal.width ?? width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var y = bounds.minY
        for row in rows(subviews, width: bounds.width) {
            var x = bounds.minX
            for i in row.indices {
                let size = subviews[i].sizeThatFits(.unspecified)
                subviews[i].place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += row.height + spacing
        }
    }

    private struct Row { var indices: [Int] = []; var width: CGFloat = 0; var height: CGFloat = 0 }

    private func rows(_ subviews: Subviews, width: CGFloat) -> [Row] {
        var rows: [Row] = []
        var row = Row()
        for i in subviews.indices {
            let size = subviews[i].sizeThatFits(.unspecified)
            let needed = row.indices.isEmpty ? size.width : row.width + spacing + size.width
            if needed > width, !row.indices.isEmpty {
                rows.append(row)
                row = Row()
            }
            row.width = row.indices.isEmpty ? size.width : row.width + spacing + size.width
            row.height = max(row.height, size.height)
            row.indices.append(i)
        }
        if !row.indices.isEmpty { rows.append(row) }
        return rows
    }
}
