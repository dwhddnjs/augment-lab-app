import AugmentCore
import SDWebImageSwiftUI
import SwiftUI

/// 빌드 상세 상단 — 챔피언 아이콘/이름/타입 + 생성일 (RN `builds/components/build-champion-header.tsx`)
struct BuildChampionHeader: View {
    static let iconSize: CGFloat = 64
    static let iconBorder: CGFloat = 1.5

    let champion: Champion
    /// 로케일 포맷된 생성일
    let date: String
    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: Radius.md)
        HStack(spacing: Spacing.three) {
            WebImage(url: store.data.cdn.championSquareURL(champion.imageKey)) { $0.resizable().scaledToFill() } placeholder: { Color.clear }
                .frame(width: Self.iconSize, height: Self.iconSize)
                .clipShape(shape)
                .overlay(shape.strokeBorder(palette.accent.default, lineWidth: Self.iconBorder))
            VStack(alignment: .leading, spacing: Spacing.one) {
                Text(champion.name)
                    .rnText(size: TypeStyle.heading.size, lineHeight: TypeStyle.heading.lineHeight, weight: .heavy) // RN 800
                    .foregroundStyle(palette.text.primary)
                    .lineLimit(1)
                Text(champion.title).rnText(.caption).foregroundStyle(palette.text.tertiary).lineLimit(1)
                HStack(spacing: Spacing.one) {
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
            Text(date).rnText(.caption).foregroundStyle(palette.text.tertiary)
        }
    }
}

/// 섹션 머리 "증강 8" — 라벨 + 개수
private struct SectionLabel: View {
    let text: String
    @Environment(\.palette) private var palette
    var body: some View { Text(text).rnText(.label).foregroundStyle(palette.text.secondary) }
}

/// 빌드 상세 — 증강 목록(희귀도 카드 행 + 이름 + 설명) (RN `build-augment-list.tsx`)
struct BuildAugmentList: View {
    static let tileSize: CGFloat = 56

    let augments: [Augment]
    let label: String
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.two) {
            SectionLabel(text: "\(label) \(augments.count)")
            ForEach(Array(augments.enumerated()), id: \.offset) { _, aug in
                DetailCardRow(accentColor: RarityColors.color(aug.rarity, palette.scheme),
                              title: store.data.displayName(aug),
                              description: cleanAugmentDescription(aug.description)) {
                    AugmentTile(iconPath: aug.iconPath, rarity: aug.rarity, size: Self.tileSize, background: HeroOverlay.cardBase)
                }
            }
        }
    }
}

/// 빌드 상세 — 아이템 목록 (RN `build-item-row.tsx`). 증강은 "읽는" 카드, 아이템은 "훑는" 데이터라
/// iOS 인셋 그룹 리스트처럼 한 컨테이너 안에 행을 쌓고 사이는 홈만 판다.
struct BuildItemRow: View {
    static let iconSize: CGFloat = 40
    /// 구분선은 아이콘을 지나 텍스트 시작점부터 — iOS 인셋 스타일
    static var dividerInset: CGFloat { Spacing.three + iconSize + Spacing.double }

    let items: [Item]
    let label: String
    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        let group = Radius.shape(Radius.lg)
        let tile = Radius.shape(Radius.md)
        VStack(alignment: .leading, spacing: Spacing.two) {
            SectionLabel(text: "\(label) \(items.count)")
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                    if i > 0 {
                        // 카드(raised)보다 어두운 바탕색으로 홈을 판다 — border.subtle은 다크에서 raised와 명도가 거의 같아 묻혔다.
                        palette.surface.base
                            .frame(height: 1)
                            .padding(.leading, Self.dividerInset)
                            .padding(.trailing, Spacing.three)
                    }
                    HStack(alignment: .top, spacing: Spacing.double) {
                        RemoteImage(store.data.cdn.itemImageURL(item.imageKey), contentMode: .fit)
                            .frame(width: Self.iconSize, height: Self.iconSize)
                            .background(HeroOverlay.cardBase)
                            .clipShape(tile)
                            .overlay(tile.strokeBorder(palette.border.subtle, lineWidth: 1))
                        VStack(alignment: .leading, spacing: Spacing.half) {
                            Text(item.name).rnText(.label).foregroundStyle(palette.text.primary).lineLimit(1)
                            Text(formatItemStats(item, settings.locale))
                                .rnText(size: TypeStyle.caption.size, lineHeight: TypeStyle.caption.lineHeight, weight: .semibold)
                                .foregroundStyle(palette.accent.default)
                            let effect = cleanItemDescription(item.description)
                            if !effect.isEmpty {
                                Text(effect).rnText(.caption).foregroundStyle(palette.text.secondary).padding(.top, Spacing.half)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(Spacing.three)
                }
            }
            .padding(hairline(displayScale))
            .background(palette.surface.raised, in: group)
            .clipShape(group)
            .overlay(group.strokeBorder(palette.border.subtle, lineWidth: hairline(displayScale)))
        }
    }
}
