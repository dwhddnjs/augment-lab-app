import AugmentCore
import SwiftUI

/// 빌드 상세의 공용 카드 행 (RN `components/ui/detail-card-row.tsx`, spec design-system §2.9).
/// 왼쪽 강조 테두리 + 아이콘 슬롯 + 이름(+메타) + 설명. 증강·아이템·헤드라이너가 같은 레이아웃을 쓴다.
/// 도메인 무관 — 아이콘·메타 뷰, 색, 문자열만 받는다.
public struct DetailCardRow<Leading: View, Meta: View>: View {
    static var accentWidth: CGFloat { 3 }

    let accentColor: Color
    let title: String
    let description: String?
    let compact: Bool
    let icon: Leading
    let meta: Meta
    @Environment(\.palette) private var palette
    @Environment(\.displayScale) private var displayScale

    /// - accentColor: 왼쪽 강조 테두리 색(희귀도 등)
    /// - meta: 제목 오른쪽(예: 강화 레벨 별)
    /// - compact: 좁은 가로 패널(픽 현황 서랍·아이템 화면) — 안쪽 여백과 간격을 줄인다
    public init(accentColor: Color, title: String, description: String? = nil, compact: Bool = false,
                @ViewBuilder icon: () -> Leading, @ViewBuilder meta: () -> Meta) {
        self.accentColor = accentColor
        self.title = title
        self.description = description
        self.compact = compact
        self.icon = icon()
        self.meta = meta()
    }

    public var body: some View {
        let pad = compact ? Spacing.double : Spacing.three
        let line = hairline(displayScale)
        let shape = Radius.shape(Radius.lg)
        HStack(alignment: .top, spacing: pad) {
            icon
            VStack(alignment: .leading, spacing: Spacing.one) {
                HStack(spacing: Spacing.one) {
                    Text(title)
                        .rnText(size: TypeStyle.label.size, lineHeight: TypeStyle.label.lineHeight, weight: .bold) // RN 700
                        .foregroundStyle(palette.text.primary)
                    meta
                }
                if let description, !description.isEmpty {
                    Text(description).rnText(.caption).foregroundStyle(palette.text.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        // RN 테두리는 상자 안쪽에 그려지고 내용은 테두리 두께만큼 더 들어간다.
        .padding(EdgeInsets(top: pad + line, leading: pad + Self.accentWidth, bottom: pad + line, trailing: pad + line))
        .background(palette.surface.raised, in: shape)
        .overlay(shape.strokeBorder(palette.border.subtle, lineWidth: line))
        .overlay(LeftBorder(width: Self.accentWidth, radius: Radius.lg).fill(accentColor))
    }
}

public extension DetailCardRow where Meta == EmptyView {
    init(accentColor: Color, title: String, description: String? = nil, compact: Bool = false,
         @ViewBuilder icon: () -> Leading) {
        self.init(accentColor: accentColor, title: title, description: description, compact: compact, icon: icon) { EmptyView() }
    }
}

/// RN `borderLeftWidth: 3` + 둥근 모서리: 바깥 모양에서 왼쪽만 `width`만큼 들인 같은 모양을 뺀 초승달.
/// 가운데는 3pt, 모서리를 따라 돌며 가늘어진다(RN처럼 위·아래 hairline 쪽으로 이어진다).
private struct LeftBorder: Shape {
    let width: CGFloat
    let radius: CGFloat

    func path(in rect: CGRect) -> Path {
        let shape = Radius.shape(radius)
        var inner = rect
        inner.origin.x += width
        inner.size.width -= width
        return shape.path(in: rect).subtracting(shape.path(in: inner))
    }
}

#Preview {
    VStack(spacing: Spacing.two) {
        DetailCardRow(accentColor: RarityColors.color(.gold, .dark), title: "골드 증강", description: "설명이 두 줄로 넘어가도 아이콘은 위에 붙어 있다. 설명이 두 줄로 넘어가도.") {
            HeroOverlay.cardBase.frame(width: 40, height: 40)
        } meta: {
            IconView(.mci("star"), size: 12)
        }
        DetailCardRow(accentColor: RarityColors.color(.prismatic, .dark), title: "compact", description: "좁은 패널", compact: true) {
            HeroOverlay.cardBase.frame(width: 32, height: 32)
        }
    }
    .padding(Spacing.three)
    .surfaceBackground()
    .providesPalette()
}
