import AugmentCore
import SwiftUI

/// 증강 아이콘 타일 (RN `augment-tile.tsx`) — 빌드 카드·상세·커스텀. spec/design-system.md §2.8.
/// 희귀도 테두리 1 + 아이콘(0.75×). 아이콘은 어두운 배경 자산이라 모드와 무관하게 어두운 타일·다크 팔레트 색을 쓴다.
struct AugmentTile: View {
    let iconPath: String
    let rarity: Rarity
    let size: CGFloat
    /// 기본은 히어로 카드용 반투명 scrim(어두운 이미지 위 전제). 밝은 시트 위에선 불투명 어두운 톤을 넘긴다.
    var background: Color = HeroOverlay.tileBg

    var body: some View {
        let tint = RarityColors.color(rarity, .dark)
        AugmentImage(
            iconPath: iconPath,
            size: (size * 0.75).rounded(),
            tint: tint,
            fallbackGlyph: .mci(RarityColors.glyph[rarity]!),
            fallbackRatio: 0.8 // 이미지(0.75)의 0.8 = 타일의 0.6
        )
        .frame(width: size, height: size)
        .background(background, in: Radius.shape(Radius.md))
        .overlay(Radius.shape(Radius.md).strokeBorder(tint, lineWidth: 1))
    }
}

#Preview("타일 3종") {
    HStack(spacing: Spacing.two) {
        ForEach(Rarity.allCases, id: \.self) { r in
            AugmentTile(iconPath: "", rarity: r, size: 44)
        }
    }
    .padding(Spacing.four)
    .background(HeroOverlay.cardBase)
}
