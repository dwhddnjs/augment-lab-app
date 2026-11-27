import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["all": "전체", "silver": "실버", "gold": "골드", "prismatic": "프리즘", "empty": "결과 없음"],
    en: ["all": "All", "silver": "Silver", "gold": "Gold", "prismatic": "Prism", "empty": "No results"]
)

/// 커스텀 화면 왼쪽(6.5) — 티어 레일 + 증강 카드 3열 그리드 (RN `augment-pick-grid.tsx`).
/// 카드를 길게 눌러 오른쪽 패널로 끌면 담긴다(빠른 모드면 탭 한 번). 끄는 조작은 `dragCell`이 맡는다.
struct AugmentPickGrid: View {
    let draft: CustomDraft
    let drag: PickDrag
    /// 홈 인디케이터 높이. 그리드가 화면 끝까지 흐르므로 여기서 띄운다.
    let bottomInset: CGFloat

    static let columns = 3
    static let pad = Spacing.two
    static let gap = Spacing.two

    /// 레일을 뺀 그리드 실측 폭 → 카드 한 장 폭.
    /// 내리지 않는다 — 버린 소수가 열 수만큼 쌓여 오른쪽 여백만 넓어진다.
    static func cardWidth(gridWidth: CGFloat) -> CGFloat {
        max(72, (gridWidth - pad * 2 - gap * CGFloat(columns - 1)) / CGFloat(columns))
    }

    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        let t = L.t(settings.locale)
        let list = draft.list
        let picked = draft.pickedIds
        HStack(spacing: 0) {
            TierRail(tier: draft.tier, label: t) { draft.tier = $0 }

            GeometryReader { geo in
                let card = Self.cardWidth(gridWidth: geo.size.width)
                ScrollView(showsIndicators: false) {
                    if list.isEmpty {
                        Text(t("empty")).rnText(.caption).foregroundStyle(palette.text.tertiary)
                            .frame(maxWidth: .infinity)
                            .padding(.top, Spacing.six)
                    } else {
                        LazyVGrid(columns: Array(repeating: GridItem(.fixed(card), spacing: Self.gap, alignment: .top), count: Self.columns),
                                  alignment: .leading, spacing: Self.gap) {
                            ForEach(list) { augment in
                                cell(augment, width: card, checked: picked.contains(augment.id))
                            }
                        }
                        .padding(Self.pad)
                        .padding(.bottom, bottomInset)
                    }
                }
                // 드래그가 시작된 뒤 그리드가 같이 흐르지 않게(RN blocksExternalGesture)
                .scrollDisabled(drag.dragged != nil)
            }
            .overlay(Rectangle().strokeBorder(palette.border.subtle, lineWidth: hairline(displayScale)))
            .clipped()
        }
    }

    private func cell(_ augment: Augment, width: CGFloat, checked: Bool) -> some View {
        Button { if draft.quickMode { drag.commit(.augment(augment)) } } label: {
            RarityCardFrame(augment: augment, cardWidth: width, compact: true)
                .overlay(alignment: .topTrailing) {
                    // 담긴 카드는 눌러 앉힌다 — 체크 배지만으로는 훑어볼 때 안 보인다.
                    if checked {
                        ZStack(alignment: .topTrailing) {
                            CardLayout.shape(width: width).fill(HeroOverlay.tileBg)
                            CheckBadge(size: 16, mark: 10, line: 14).padding(Spacing.one)
                        }
                    }
                }
        }
        .buttonStyle(PressDim(opacity: draft.quickMode ? 0.7 : 1))
        .dragCell(.augment(augment), enabled: !draft.quickMode, drag: drag)
    }
}

/// 담김 체크 — 증강 카드 16 · 아이템 칸 12
struct CheckBadge: View {
    let size: CGFloat
    let mark: CGFloat
    let line: CGFloat

    @Environment(\.palette) private var palette

    var body: some View {
        Text("✓")
            .rnText(size: mark, lineHeight: line, weight: .bold)
            .foregroundStyle(palette.accent.onAccent)
            .frame(width: size, height: size)
            .background(palette.accent.default, in: Circle())
    }
}

/// 티어 세로 레일 — 아이템 필터바(`ItemFilterBar.width`)와 같은 44. 헤더 토글로 맞바뀌는 두 레일이다.
/// 아이콘은 레일 전용(육각형 채움 정도로 등급이 올라간다). `RarityColors.glyph`는 아이콘을 못 받았을 때의 폴백이라 뜻이 달라 쓰지 않는다.
private struct TierRail: View {
    let tier: Rarity?
    let label: (String) -> String
    let onChange: (Rarity?) -> Void

    static let tiers: [Rarity?] = [nil, .silver, .gold, .prismatic]
    static let icons: [String: String] = ["all": "view-grid-outline", "silver": "hexagon-outline", "gold": "hexagon-slice-6", "prismatic": "hexagon-multiple"]

    @Environment(\.palette) private var palette

    var body: some View {
        VStack(spacing: Spacing.double) {
            ForEach(Self.tiers, id: \.self) { key in
                let active = tier == key
                let name = key?.rawValue ?? "all"
                // 전체 칩만 테마색 — 나머지는 증강 티어 고유색
                let tint = active ? (key.map { RarityColors.color($0, palette.scheme) } ?? palette.text.tertiary) : palette.text.tertiary
                Button { onChange(active ? nil : key) } label: {
                    VStack(spacing: Spacing.half) {
                        IconView(.mci(Self.icons[name]!), size: 20)
                        Text(label(name)).rnText(size: 9, lineHeight: 11, weight: .semibold)
                        Circle().fill(active ? tint : .clear).frame(width: 4, height: 4)
                    }
                    .foregroundStyle(tint)
                    .contentShape(Rectangle().inset(by: -Spacing.two)) // RN hitSlop 8
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(active ? .isSelected : [])
            }
        }
        .padding(.top, Spacing.two)
        .frame(width: ItemFilterBar.width)
        .frame(maxHeight: .infinity, alignment: .top)
    }
}
