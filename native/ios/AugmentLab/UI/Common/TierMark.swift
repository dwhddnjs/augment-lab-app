import AugmentCore
import SwiftUI

/// 티어 글자 배너·배지 (RN `tierlist/components/tier-mark.tsx`).
/// 가로 그라데이션 C1A → CA6 → C1A, 1pt 테두리 C66, 글자 800. 목록 배너는 heading(자간 2), 상세 배지는 label(자간 1).
public struct TierMark: View {
    public enum Size { case heading, label }

    let tier: Tier
    let size: Size
    /// 모양 — 배너는 캡슐(`Radius.full`), 배지는 사각. 크기는 호출부가 frame으로 정한다.
    let cornerRadius: CGFloat
    @Environment(\.palette) private var palette

    public init(_ tier: Tier, size: Size, cornerRadius: CGFloat) { self.tier = tier; self.size = size; self.cornerRadius = cornerRadius }

    public var body: some View {
        let hex = TierColors.hex(tier, palette.scheme)
        let shape = Radius.shape(cornerRadius)
        Text(tier.rawValue)
            .rnText(size: style.size, lineHeight: style.lineHeight, weight: .heavy)
            .tracking(size == .heading ? 2 : 1)
            .foregroundStyle(palette.text.primary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(LinearGradient(
                colors: [Color(hex: hex, alpha: TierColors.edge), Color(hex: hex, alpha: TierColors.center), Color(hex: hex, alpha: TierColors.edge)],
                startPoint: .leading, endPoint: .trailing))
            .clipShape(shape)
            .overlay(shape.strokeBorder(Color(hex: hex, alpha: TierColors.border), lineWidth: 1))
    }

    private var style: TypeStyle { size == .heading ? .heading : .label }
}

#Preview {
    VStack(spacing: Spacing.three) {
        ForEach(Tier.allCases, id: \.self) { TierMark($0, size: .heading, cornerRadius: Radius.full).frame(width: 120, height: 36) }
        TierMark(.S, size: .label, cornerRadius: Radius.sm).frame(width: 28, height: 22)
        MoreLink("전체 보기") {}
    }
    .padding()
    .providesPalette()
}
