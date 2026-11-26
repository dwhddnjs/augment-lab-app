import AugmentCore
import SwiftUI

/// 8열 아이템 그리드 (RN `items/components/item-grid.tsx`). 위·좌·우 1pt `border.subtle`(아래는 없음).
struct ItemGrid: View {
    static let columns = 8
    /// 셀 사이 간격 — 셀 크기를 역산할 때 같은 값을 쓴다
    static let cellGap = Spacing.one
    static let areaPadding = Spacing.two
    static let border: CGFloat = 1

    /// 그리드 영역 폭 → 셀 크기. 8열을 정확히 채우고, 36보다 작아지지 않는다.
    static func cellSize(areaWidth: CGFloat) -> CGFloat {
        let scrollWidth = areaWidth - 2 * (areaPadding + border)
        guard scrollWidth > 0 else { return 48 }
        return max(36, ((scrollWidth - CGFloat(columns - 1) * cellGap) / CGFloat(columns)).rounded(.down))
    }

    let items: [Item]
    let cellSize: CGFloat
    let selectedIds: [String]
    let onItemPress: (Item) -> Void
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    var body: some View {
        let rows = stride(from: 0, to: items.count, by: Self.columns).map { Array(items[$0..<min($0 + Self.columns, items.count)]) }
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: Self.cellGap) {
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    HStack(spacing: Self.cellGap) {
                        ForEach(row) { cell($0) }
                    }
                }
            }
            .padding(.top, Spacing.two)
            .padding(.bottom, ItemSlotTray.height + Spacing.two * 2) // 아래 트레이에 가리지 않게
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, Self.areaPadding + Self.border)
        .padding(.top, Self.border)
        .overlay(alignment: .top) { palette.border.subtle.frame(height: Self.border) }
        .overlay(alignment: .leading) { palette.border.subtle.frame(width: Self.border) }
        .overlay(alignment: .trailing) { palette.border.subtle.frame(width: Self.border) }
    }

    private func cell(_ item: Item) -> some View {
        let selected = selectedIds.contains(item.id)
        let shape = Radius.shape(Radius.sm)
        return Button { onItemPress(item) } label: {
            RemoteImage(store.data.cdn.itemImageURL(item.imageKey), contentMode: .fit)
                .frame(width: cellSize - 4, height: cellSize - 4)
                .clipShape(shape)
                .frame(width: cellSize, height: cellSize)
                .background(selected ? palette.accent.subtle : palette.surface.raised)
                .overlay(alignment: .topTrailing) {
                    if selected {
                        Text(verbatim: "✓")
                            .font(.system(size: 8))
                            .foregroundStyle(palette.accent.onAccent)
                            .frame(width: 12, height: 12)
                            .background(palette.accent.default, in: Circle())
                            .padding(1)
                    }
                }
                .clipShape(shape)
                .overlay(shape.strokeBorder(selected ? palette.accent.default : palette.border.subtle, lineWidth: selected ? 2 : 1))
        }
        .buttonStyle(PressedOpacityStyle(opacity: 0.7))
        .accessibilityLabel(item.name)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

/// 떠 있는 6칸 트레이 (RN `item-slot-grid.tsx`). 채운 칸을 누르면 뺀다. 빈 칸은 점선 + "+".
/// 테두리는 두지 않는다 — 글라스가 가장자리를 스스로 그린다(26 미만 폴백만 `edge` hairline).
struct ItemSlotTray: View {
    static let slotCount = Item.maxPerBuild
    /// 칸 한 변 — 아이콘 소스가 64px라 작을수록 업스케일이 줄어 선명하다
    static let box: CGFloat = 40
    /// 트레이 높이 = 칸 + 위아래 패딩. 그리드 아래 여백 계산에 쓴다.
    static var height: CGFloat { box + Spacing.two * 2 }

    let items: [Item]
    let onRemove: (Item) -> Void
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    var body: some View {
        GlassSurface(cornerRadius: Radius.lg, edge: true) {
            HStack(spacing: Spacing.one) {
                ForEach(0..<Self.slotCount, id: \.self) { i in
                    if i < items.count { filled(items[i]) } else { empty }
                }
            }
            .padding(Spacing.two)
        }
    }

    private func filled(_ item: Item) -> some View {
        let shape = Radius.shape(Radius.sm)
        return Button { onRemove(item) } label: {
            RemoteImage(store.data.cdn.itemImageURL(item.imageKey), size: Self.box)
                .background(palette.surface.raised)
                .clipShape(shape)
                .overlay(shape.strokeBorder(palette.border.subtle, lineWidth: 1))
        }
        .buttonStyle(PressedOpacityStyle(opacity: 0.7))
        .accessibilityLabel(item.name)
    }

    private var empty: some View {
        let shape = Radius.shape(Radius.sm)
        // ponytail: RN 점선(RCTBorderDrawing dashed)을 선 3·간격 3으로 근사 — 다르면 dash 값만 조정
        return Text(verbatim: "+")
            .rnText(size: 20, lineHeight: 24)
            .foregroundStyle(palette.text.disabled)
            .frame(width: Self.box, height: Self.box)
            .background(palette.surface.base, in: shape)
            .overlay(shape.strokeBorder(palette.border.subtle, style: StrokeStyle(lineWidth: 1, dash: [3, 3])))
            .accessibilityHidden(true)
    }
}

/// 오른쪽 상세 패널 — 챔피언 · 합산 스탯 · 헤드라이너(compact) · 증강 카드 (RN `item-detail-panel.tsx`)
struct ItemDetailPanel: View {
    static let augmentColumns = 3
    static let championIcon: CGFloat = 52
    static let leading = Spacing.double
    static let trailing = Spacing.two

    let champion: Champion?
    let itemStats: [[String: Double]]
    let picked: [Augment]
    let headliner: BuildHeadliner?
    let width: CGFloat
    let statsLabel: String
    let augmentsLabel: String
    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let gridWidth = width - Self.leading - Self.trailing
        let cardSize = ((gridWidth - Spacing.two * CGFloat(Self.augmentColumns - 1)) / CGFloat(Self.augmentColumns)).rounded(.down)
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                if let champion {
                    championRow(champion)
                    VStack(alignment: .leading, spacing: Spacing.two) {
                        caption(statsLabel)
                        ItemStatPanel(baseStats: champion.stats, itemStats: itemStats)
                    }
                    .padding(.top, Spacing.two)
                }
                if let headliner {
                    HeadlinerSummary(id: headliner.id, skills: headliner.skills, stickers: headliner.stickers,
                                     championId: champion?.id, compact: true)
                        .padding(.top, Spacing.three)
                }
                if !picked.isEmpty && cardSize > 0 {
                    VStack(alignment: .leading, spacing: Spacing.two) {
                        caption(augmentsLabel)
                        LazyVGrid(columns: Array(repeating: GridItem(.fixed(cardSize), spacing: Spacing.two, alignment: .top),
                                                 count: Self.augmentColumns),
                                  alignment: .leading, spacing: Spacing.two) {
                            ForEach(Array(picked.enumerated()), id: \.offset) { _, aug in
                                ItemAugmentCard(augment: aug, size: cardSize)
                            }
                        }
                    }
                    .padding(.top, Spacing.three)
                }
            }
            .padding(.leading, Self.leading)
            .padding(.trailing, Self.trailing)
            .padding(.bottom, Spacing.five)
        }
    }

    private func caption(_ text: String) -> some View {
        Text(text).rnText(.caption).foregroundStyle(palette.text.tertiary)
    }

    private func championRow(_ champion: Champion) -> some View {
        let shape = Radius.shape(Radius.md)
        return HStack(spacing: Spacing.two) {
            RemoteImage(store.data.cdn.championSquareURL(champion.imageKey), size: Self.championIcon)
                .clipShape(shape)
                .overlay(shape.strokeBorder(palette.border.default, lineWidth: 1))
            VStack(alignment: .leading, spacing: 0) {
                Text(champion.name).rnText(.body).foregroundStyle(palette.text.primary).lineLimit(1)
                Text(champion.title).rnText(.caption).foregroundStyle(palette.text.tertiary).lineLimit(1)
                Text(champion.tags.map { championTagLabel($0, settings.locale) }.joined(separator: " · "))
                    .rnText(.caption).foregroundStyle(palette.text.disabled).lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.bottom, Spacing.two)
        .overlay(alignment: .bottom) { palette.border.subtle.frame(height: 1) }
    }
}

/// 증강 카드 — 어두운 타일 아이콘 + 이름 (RN `items/components/augment-card.tsx`).
/// 라이트 모드 희귀도 색은 11pt 글자 대비에 못 미쳐 이름을 보조색으로 둔다.
private struct ItemAugmentCard: View {
    let augment: Augment
    let size: CGFloat
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    var body: some View {
        VStack(spacing: Spacing.one) {
            AugmentTile(iconPath: augment.iconPath, rarity: augment.rarity, size: size, background: HeroOverlay.cardBase)
            Text(store.data.displayName(augment))
                .rnText(size: 11, lineHeight: 14)
                .foregroundStyle(palette.scheme == .dark ? RarityColors.color(augment.rarity, .dark) : palette.text.secondary)
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
        .frame(width: size)
    }
}
