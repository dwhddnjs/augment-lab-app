import AugmentCore
import SDWebImageSwiftUI
import SwiftUI

/// 아이템 필터 아이콘 (RN `items/components/filter-icon.tsx`). 역할은 CDragon 역할 아이콘을 색으로 칠하고,
/// 모르는 역할이면 MCI `sword`, 나머지는 MCI 글리프.
public struct FilterIcon: View {
    let filter: ItemFilter
    let color: Color
    let size: CGFloat

    public init(filter: ItemFilter, color: Color, size: CGFloat) {
        self.filter = filter
        self.color = color
        self.size = size
    }

    public var body: some View {
        switch filter.icon {
        case .classTag(let tag):
            if let url = CDN.championClassIconURL(tag) {
                // expo-image `tintColor` = 불투명 픽셀을 한 색으로
                WebImage(url: url) { $0.renderingMode(.template).resizable().scaledToFit() } placeholder: { Color.clear }
                    .foregroundStyle(color)
                    .frame(width: size, height: size)
            } else {
                IconView(.mci("sword"), size: size).foregroundStyle(color)
            }
        case .mci(let name):
            IconView(.mci(name), size: size).foregroundStyle(color)
        }
    }
}
