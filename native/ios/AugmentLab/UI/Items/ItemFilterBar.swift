import AugmentCore
import SwiftUI

/// 세로 아이템 필터 탭 (RN `items/components/item-filter-bar.tsx`, spec item-select.md §3).
/// 탭 8개(전체·전사·원딜·암살자·마법사·탱커·서포터·신발). 활성 탭이나 "전체"를 다시 누르면 필터가 풀린다(nil).
public struct ItemFilterBar: View {
    /// 세로 필터 사이드 탭 너비 — 그리드/트레이 정렬에 공유 (RN `SIDE_TAB_WIDTH`)
    public static let width: CGFloat = 44
    /// 커스텀 화면 증강 티어 레일과 같은 크기 — 헤더 토글로 맞바뀌는 두 레일이라 다르면 전환할 때 눈에 띈다.
    static let iconSize: CGFloat = 20
    static let dotSize: CGFloat = 4
    static let iconDotGap: CGFloat = 3
    static let hitSlop: CGFloat = 10

    /// nil = 전체
    let active: ItemFilter?
    let onChange: (ItemFilter?) -> Void
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    public init(active: ItemFilter?, onChange: @escaping (ItemFilter?) -> Void) {
        self.active = active
        self.onChange = onChange
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: Spacing.double) {
                ForEach(ItemFilter.all) { filter in
                    let isActive = active == filter || (filter.id == "all" && active == nil)
                    let tint = isActive ? palette.accent.default : palette.text.tertiary
                    Button {
                        onChange(filter.id == "all" || isActive ? nil : filter)
                    } label: {
                        VStack(spacing: Self.iconDotGap) {
                            FilterIcon(filter: filter, color: tint, size: Self.iconSize)
                            Circle().fill(isActive ? palette.accent.default : .clear).frame(width: Self.dotSize, height: Self.dotSize)
                        }
                        .contentShape(Rectangle().inset(by: -Self.hitSlop))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(filter.label(settings.locale))
                    .accessibilityAddTraits(isActive ? .isSelected : [])
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.top, Spacing.one)
            .padding(.bottom, Spacing.three)
        }
        .frame(width: Self.width)
        .padding(.top, Spacing.one)
    }
}

private struct FilterBarPreview: View {
    @State private var active: ItemFilter?
    var body: some View {
        HStack(alignment: .top) {
            ItemFilterBar(active: active) { active = $0 }
            Text(active?.id ?? "all").rnText(.caption)
            Spacer()
        }
    }
}

#Preview {
    @Previewable @State var settings = AppSettings(store: MemoryKeyValueStore())
    FilterBarPreview()
        .surfaceBackground()
        .appSettings(settings)
        .providesPalette()
}
