import AugmentCore
import SwiftUI

// 토큰 스와치 — RN theme.ts와 눈으로 비교할 때 Xcode Canvas에서 연다. 앱 화면에는 쓰지 않는다.
private struct TokenSwatches: View {
    @Environment(\.palette) private var p

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.three) {
                row("surface", [p.surface.base, p.surface.raised, p.surface.sunken, p.surface.overlay])
                row("text", [p.text.primary, p.text.secondary, p.text.tertiary, p.text.disabled, p.text.inverse])
                row("border", [p.border.default, p.border.subtle, p.border.strong])
                row("accent", [p.accent.default, p.accent.subtle, p.status.danger])
                row("rarity", Rarity.allCases.map { RarityColors.color($0, p.scheme) })
                row("tier", Tier.allCases.map { Color(token: TierColors.hex($0, p.scheme)) })
                ForEach(TypeStyle.allCases, id: \.self) { s in Text("증강 연구소 \(Int(s.size))").rnText(s).foregroundStyle(p.text.primary) }
                HStack(spacing: Spacing.two) {
                    IconView(.sf("house"), size: 24)
                    IconView(.mci("refresh"), size: 24)
                    IconView(.mci("snowflake"), size: 24)
                    IconView(.mi("account-circle"), size: 24)
                }.foregroundStyle(p.accent.default)
            }.padding(Spacing.three)
        }
        .surfaceBackground()
    }

    private func row(_ name: String, _ colors: [Color]) -> some View {
        HStack(spacing: Spacing.two) {
            Text(name).rnText(.caption).foregroundStyle(p.text.secondary).frame(width: 56, alignment: .leading)
            ForEach(colors.indices, id: \.self) { i in
                Radius.shape(Radius.md).fill(colors[i]).frame(width: 36, height: 36)
                    .overlay(Radius.shape(Radius.md).stroke(p.border.default, lineWidth: 1))
            }
        }
    }
}

#Preview("다크") { TokenSwatches().providesPalette().preferredColorScheme(.dark) }
#Preview("라이트") { TokenSwatches().providesPalette().preferredColorScheme(.light) }
