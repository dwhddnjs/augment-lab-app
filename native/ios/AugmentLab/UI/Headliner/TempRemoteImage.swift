import SwiftUI

/// 임시 — I-05 `RemoteImage`(Infra/Images)와 시그니처가 같다(승격 후보 참고).
/// 둘 다 dev에 들어오면 이 파일을 지우고 `TempRemoteImage` → `RemoteImage`로 이름만 바꾼다.
struct TempRemoteImage: View {
    let url: URL?
    let size: CGFloat?
    let contentMode: ContentMode
    let accessibilityLabel: String?
    @Environment(\.palette) private var palette

    init(_ url: URL?, size: CGFloat? = nil, contentMode: ContentMode = .fill, accessibilityLabel: String? = nil) {
        self.url = url
        self.size = size
        self.contentMode = contentMode
        self.accessibilityLabel = accessibilityLabel
    }

    var body: some View {
        AsyncImage(url: url) { $0.resizable().aspectRatio(contentMode: contentMode) } placeholder: { palette.surface.raised }
            .frame(width: size, height: size)
            .clipped()
            .accessibilityLabel(accessibilityLabel ?? "")
            .accessibilityHidden(accessibilityLabel == nil)
    }
}
