import AugmentCore
import SwiftUI

private let L = L10n(ko: ["empty": "결과 없음"], en: ["empty": "No results"])

/// 커스텀 화면 왼쪽(6.5)의 아이템 판 — 헤더 토글이 증강 그리드와 맞바꾼다 (RN `item-pick-grid.tsx`).
/// 필터 레일은 아이템 선택 화면의 `ItemFilterBar` 그대로(폭 44 = 증강 티어 레일).
/// 칸 크기는 그리드 실측 폭에서 낸다. 아이콘 소스가 64px라 8열(≈50pt)이면 업스케일이 없다 — 열을 줄이면 흐려진다.
struct ItemPickGrid: View {
    let draft: CustomDraft
    let drag: PickDrag
    /// 홈 인디케이터 높이. 그리드가 화면 끝까지 흐르므로 여기서 띄운다.
    let bottomInset: CGFloat

    static let columns = 8
    static let pad = Spacing.two
    static let gap = Spacing.one

    /// 내리지 않는다 — 버린 소수가 8열만큼 쌓여 오른쪽 여백만 넓어진다.
    static func cellSize(gridWidth: CGFloat) -> CGFloat {
        max(36, (gridWidth - pad * 2 - gap * CGFloat(columns - 1)) / CGFloat(columns))
    }

    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        let t = L.t(settings.locale)
        let list = draft.itemList
        let picked = draft.itemIds
        HStack(spacing: 0) {
            // 드래프트는 "전체"를 필터 값으로 들고, 필터바는 nil로 쓴다
            ItemFilterBar(active: draft.itemFilter.id == ItemFilter.all[0].id ? nil : draft.itemFilter) {
                draft.itemFilter = $0 ?? ItemFilter.all[0]
            }

            GeometryReader { geo in
                let size = Self.cellSize(gridWidth: geo.size.width)
                ScrollView(showsIndicators: false) {
                    if list.isEmpty {
                        Text(t("empty")).rnText(.caption).foregroundStyle(palette.text.tertiary)
                            .frame(maxWidth: .infinity)
                            .padding(.top, Spacing.six)
                    } else {
                        LazyVGrid(columns: Array(repeating: GridItem(.fixed(size), spacing: Self.gap), count: Self.columns),
                                  alignment: .leading, spacing: Self.gap) {
                            ForEach(list) { item in
                                cell(item, size: size, picked: picked.contains(item.id))
                            }
                        }
                        .padding(Self.pad)
                        .padding(.bottom, bottomInset)
                    }
                }
                .scrollDisabled(drag.dragged != nil)
            }
            .overlay(Rectangle().strokeBorder(palette.border.subtle, lineWidth: hairline(displayScale)))
            .clipped()
        }
    }

    private func cell(_ item: Item, size: CGFloat, picked: Bool) -> some View {
        Button { if draft.quickMode { drag.commit(.item(item)) } } label: {
            RemoteImage(store.data.cdn.itemImageURL(item.imageKey), size: size - 4, contentMode: .fit)
                .clipShape(Radius.shape(Radius.sm))
                .frame(width: size, height: size)
                .background(picked ? palette.accent.subtle : palette.surface.raised)
                .clipShape(Radius.shape(Radius.sm))
                .overlay(Radius.shape(Radius.sm).strokeBorder(picked ? palette.accent.default : palette.border.subtle, lineWidth: picked ? 2 : 1))
                .overlay(alignment: .topTrailing) {
                    if picked { CheckBadge(size: 12, mark: 8, line: 12).padding(1) }
                }
        }
        .buttonStyle(PressDim(opacity: draft.quickMode ? 0.7 : 1))
        .dragCell(.item(item), enabled: !draft.quickMode, drag: drag)
    }
}
