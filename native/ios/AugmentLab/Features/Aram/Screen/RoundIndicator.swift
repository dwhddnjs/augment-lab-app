import SwiftUI

/// 라운드 점 + "n / total" (RN `round-indicator.tsx`)
struct RoundIndicator: View {
    let round: Int
    var total = 4

    @Environment(\.palette) private var palette

    private static let dot: CGFloat = 8

    var body: some View {
        HStack(spacing: Spacing.one) {
            ForEach(0..<total, id: \.self) { i in
                Circle()
                    .fill(i < round ? palette.accent.default : palette.border.strong)
                    .frame(width: Self.dot, height: Self.dot)
            }
            Text(verbatim: "\(round) / \(total)")
                .rnText(.caption)
                .foregroundStyle(palette.text.secondary)
                .padding(.leading, Spacing.two)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(verbatim: "\(round) / \(total)"))
    }
}
