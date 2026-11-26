import SDWebImageSwiftUI
import SwiftUI

/// 원격(DDragon/CDragon) 이미지 공용 로더 (RN `remote-image.tsx`). spec/design-system.md §2.8.
/// - 로딩 중·투명 영역 뒤에 `surface.raised` 를 깔아 첫 설치 때 검은 박스가 깜빡이지 않게 한다.
/// - 200ms 페이드, cover, memory+disk 캐시(SDWebImage 기본).
/// 모서리는 호출측에서 `.clipShape(...)`. 증강 아이콘처럼 폴백이 필요하면 `AugmentImage`.
struct RemoteImage: View {
    let url: URL?
    var size: CGFloat?
    var contentMode: ContentMode
    var accessibilityLabel: String?

    @Environment(\.palette) private var palette

    init(_ url: URL?, size: CGFloat? = nil, contentMode: ContentMode = .fill, accessibilityLabel: String? = nil) {
        self.url = url
        self.size = size
        self.contentMode = contentMode
        self.accessibilityLabel = accessibilityLabel
    }

    var body: some View {
        WebImage(url: url) { image in
            image.resizable().aspectRatio(contentMode: contentMode)
        } placeholder: {
            Color.clear
        }
        .transition(.fade(duration: 0.2))
        .frame(width: size, height: size)
        .background(palette.surface.raised)
        .clipped()
        .accessibilityElement()
        .accessibilityLabel(accessibilityLabel ?? "")
        .accessibilityHidden(accessibilityLabel == nil)
    }
}
