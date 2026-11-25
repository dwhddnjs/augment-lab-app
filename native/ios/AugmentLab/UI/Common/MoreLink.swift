import SwiftUI

/// "전체 보기 ›" 링크 (RN `components/ui/more-link.tsx`). 홈 최근 빌드·S티어 섹션.
public struct MoreLink: View {
    let label: String
    let action: () -> Void
    @Environment(\.palette) private var palette

    public init(_ label: String, action: @escaping () -> Void) { self.label = label; self.action = action }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.half) {
                Text(label).rnText(.label)
                Image(systemName: "chevron.right").resizable().scaledToFit().frame(width: 12, height: 12)
            }
            .foregroundStyle(palette.accent.default)
            .hitSlop(Spacing.two)
        }
        .buttonStyle(NoFeedbackButtonStyle()) // RN Pressable은 눌림 표시가 없다
    }
}

/// 눌림 표시 없는 버튼 (RN `Pressable` 기본)
public struct NoFeedbackButtonStyle: ButtonStyle {
    public init() {}
    public func makeBody(configuration: Configuration) -> some View { configuration.label }
}

public extension View {
    /// RN `hitSlop` — 보이는 크기는 그대로 두고 터치 영역만 넓힌다
    func hitSlop(_ inset: CGFloat) -> some View {
        padding(inset).contentShape(Rectangle()).padding(-inset)
    }
}
