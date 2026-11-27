import AugmentCore
import SwiftUI

/// 헤드라이너 로고 (RN `headliners/components/headliner-logo.tsx`).
/// 로고는 대부분 흰색이라 기본은 라이트 모드에서도 보이도록 어두운 판 위에 그린다.
/// `plain`은 판 없이 로고만(헤더) — size는 상자 높이, 폭은 로고 aspect를 따른다.
public struct HeadlinerLogo: View {
    /// 흰 로고 — 판 없이 그리면 라이트 모드에서 배경에 묻혀 글자색으로 칠한다.
    /// HEARTSTEEL은 검은 윤곽이 있어 그대로 보이고, 칠하면 글자와 윤곽이 합쳐진다.
    static let whiteLogos: Set<HeadlinerId> = [.trueDamage, .disco, .cafeCuties, .worlds, .arcade, .laIlusion]

    let id: HeadlinerId
    let size: CGFloat
    let plain: Bool
    @Environment(\.palette) private var palette

    public init(_ id: HeadlinerId, size: CGFloat, plain: Bool = false) {
        self.id = id
        self.size = size
        self.plain = plain
    }

    public var body: some View {
        let art = HeadlinerAssets.logo(id)
        if plain {
            let isLight = palette.scheme == .light
            // 라이트 전용 그림이 있으면(금색 커맨드 라인) 칠하지 않고 그걸로 바꾼다.
            Image(decorative: (isLight ? art.light : nil) ?? art.asset)
                .renderingMode(isLight && Self.whiteLogos.contains(id) ? .template : .original)
                .resizable()
                .scaledToFit()
                .foregroundStyle(palette.text.primary)
                .frame(width: size * art.aspect, height: size)
        } else {
            Image(decorative: art.asset)
                .resizable()
                .scaledToFit()
                .padding(size * 0.12)
                .frame(width: size, height: size)
                .background(HeroOverlay.cardBase, in: Radius.shape(Radius.md))
        }
    }
}

/// 사용자 확인: 13종 로고가 잉크 기준으로 같은 세로선(빨간 선)에 붙는지, 라이트에서 흰 로고가 칠해지는지.
private struct HeadlinerLogoGallery: View {
    @Environment(\.palette) private var palette

    var body: some View {
        let inkSize: CGFloat = 28
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.two) {
                ForEach(HeadlinerId.allCases, id: \.self) { id in
                    let box = HeadlinerAssets.logoBoxHeight(id, inkSize: inkSize)
                    HStack(spacing: Spacing.three) {
                        HeadlinerLogo(id, size: 40)
                        HeadlinerLogo(id, size: box, plain: true)
                            .padding(.leading, -HeadlinerAssets.logoInkLeft(id, boxHeight: box))
                        Text(id.rawValue).rnText(.caption).foregroundStyle(palette.text.secondary)
                    }
                }
            }
            .padding(Spacing.three)
            .overlay(alignment: .leading) {
                palette.status.danger.frame(width: 1).padding(.leading, Spacing.three + 40 + Spacing.three)
            }
        }
        .surfaceBackground()
    }
}

#Preview("다크") { HeadlinerLogoGallery().providesPalette().preferredColorScheme(.dark) }
#Preview("라이트") { HeadlinerLogoGallery().providesPalette().preferredColorScheme(.light) }
