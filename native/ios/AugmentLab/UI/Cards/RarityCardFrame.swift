import AugmentCore
import SwiftUI

/// 카드 행 배치 상수와 카드 폭 계산 (RN `rarity-card-frame.tsx`). spec/design-system.md §2.6.
enum CardLayout {
    /// 카드 비율(세로/가로). 프레임을 쓰지 않는 아이템·프리즘 카드도 이 비율을 따른다.
    static let aspect: CGFloat = 14 / 9
    /// 모서리 반경(카드 폭 대비). Radius 토큰이 아니라 프레임 그림의 모서리 비율이다. 그림자·체크 베일도 이걸 쓴다.
    static let corner: CGFloat = 0.07
    /// 카드 행 좌우 여백
    static let rowPad = Spacing.four
    /// 드래프트 카드 사이 간격
    static let gap = Spacing.four
    /// 카드 높이의 화면 세로 대비 상한 — 헤더와 아래 리롤 버튼 자리를 남긴다.
    static let heightRatio: CGFloat = 0.56

    /// 카드 한 장 폭 — 가로 `count`장(보통 3, 마에스트로 4)이 들어가는 폭과 화면 높이 상한 중 작은 쪽.
    static func cardWidth(screenWidth: CGFloat, screenHeight: CGFloat, gap: CGFloat = gap, heightRatio: CGFloat = heightRatio, count: Int = 3) -> CGFloat {
        let n = CGFloat(count)
        let byWidth = ((screenWidth - rowPad * 2 - gap * (n - 1)) / n).rounded(.down)
        let byHeight = (screenHeight * heightRatio / aspect).rounded(.down)
        return min(byWidth, byHeight)
    }

    static func shape(width: CGFloat) -> RoundedRectangle { Radius.shape(width * corner) }
}

/// 게임 증강 카드 원본 그림(배경 + 등급 프레임). 카드 모서리로 잘라 그린다. 펜타킬 스킬 카드도 이걸(골드) 쓴다.
/// 아이콘 뒤 소용돌이 문양은 깔지 않는다 — 아수라장 증강 `_large` 아이콘에 이미 그려져 있다.
struct CardArt: View {
    let rarity: Rarity
    let width: CGFloat

    var body: some View {
        ZStack {
            Image("augment-card-bg").resizable()
            Image("augment-card-frame-\(rarity.rawValue)").resizable()
        }
        .frame(width: width, height: (width * CardLayout.aspect).rounded())
        .clipShape(CardLayout.shape(width: width))
    }
}

extension View {
    /// 등급색 카드 그림자. 라이트는 네 변에 고르게(아랫변 어두운 띠와 겹쳐 두꺼워지지 않게), 다크는 등급색 빛 두 겹.
    /// CSS blur ≈ 2 × 반경이라 SwiftUI `radius`에는 절반을 넣는다. 두 겹은 서로 겹쳐 번지지 않게 따로 그린다.
    func cardShadow(_ rarity: Rarity, width: CGFloat, scheme: ColorScheme) -> some View {
        let layers: [(Color, CGFloat)]
        if scheme == .light {
            let color = Color(hex: AugmentCardColors.lightShadowHex[rarity]!, alpha: AugmentCardColors.lightShadowAlpha)
            layers = [(color, 2), (color, 10)]
        } else {
            let glow = AugmentCardColors.darkGlow[rarity]!
            let blur = { (k: CGFloat) in (width * k * 10).rounded() / 10 } // RN toFixed(1)
            layers = [(Color(hex: glow.hex, alpha: glow.inner), blur(0.012)), (Color(hex: glow.hex, alpha: glow.outer), blur(0.056))]
        }
        return background {
            ZStack {
                ForEach(layers.indices, id: \.self) { i in
                    CardLayout.shape(width: width).fill(HeroOverlay.cardBase).shadow(color: layers[i].0, radius: layers[i].1 / 2)
                }
            }
        }
    }
}

/// 증강 카드 (RN `RarityCardFrame`). spec/design-system.md §2.7.
/// 배치는 실제 칼바람 카드 3장을 재서 얻은 비율 — 크기는 폭(W), 세로 위치는 높이(H) 기준(프레임이 높이에 맞춰 늘어난다).
struct RarityCardFrame: View {
    let augment: Augment
    let cardWidth: CGFloat
    /// 커스텀 그리드용 — 작은 글자, 그림자 없음(카드가 촘촘히 붙는다). 배치는 폭 비례라 그대로.
    var compact = false

    @Environment(\.colorScheme) private var scheme

    /// 글자 크기는 인게임 비율이 아니다(그대로 줄이면 6.6pt). 설명 줄 간격은 글자의 1.4배 안팎.
    private struct TextSpec { let name, desc, descLine, gap: CGFloat }
    private static let normal = TextSpec(name: 12, desc: 9, descLine: 12.5, gap: Spacing.one)
    private static let small = TextSpec(name: 10, desc: 7.5, descLine: 10.5, gap: Spacing.one)
    /// 이름 줄 상자 윗선 → 한글 글자 윗선(글자 크기 대비). 시뮬레이터에서 재서 맞춘 RN 값.
    private static let nameInkTop: CGFloat = 0.18
    /// 설명 속 골드 금액("250골드", "250 gold") — 등급과 무관하게 금색 굵게
    private static let amount = try! NSRegularExpression(pattern: #"\d[\d,]*\s*(?:골드|gold|원)"#, options: .caseInsensitive)

    var body: some View {
        let w = cardWidth
        let h = (w * CardLayout.aspect).rounded()
        let iconSize = (w * 0.5).rounded()
        let spec = compact ? Self.small : Self.normal
        let nameLine = spec.name * 1.2
        let textTop = h * 0.459 - Self.nameInkTop * spec.name
        let textBottom = h * 0.9
        let side = w * 0.14
        let textWidth = w - side * 2

        let name = CardLabel.finish(
            CardLabel.paragraph(augment.name, size: spec.name, weight: .bold, lineHeight: nameLine, color: HeroOverlay.textPrimary, hangulWord: true),
            lineHeight: nameLine
        )
        // 이름이 두 줄이면 설명 한 줄을 내준다(고정 높이 상자라 넘치면 마지막 줄이 잘린다).
        let nameLines = min(2, CardLabel.lineCount(name, width: textWidth, lineHeight: nameLine))
        let descLines = max(1, Int(((textBottom - textTop - nameLine * CGFloat(nameLines) - spec.gap) / spec.descLine).rounded(.down)))

        ZStack(alignment: .topLeading) {
            CardArt(rarity: augment.rarity, width: w)

            AugmentImage(
                iconPath: augment.iconPath,
                size: iconSize,
                tint: RarityColors.color(augment.rarity, .dark), // 카드 안은 모드와 무관하게 어둡다
                fallbackGlyph: .mci(RarityColors.glyph[augment.rarity]!)
            )
            .offset(x: (w - iconSize) / 2, y: h * 0.227 - iconSize / 2)

            VStack(spacing: spec.gap) {
                CardLabel(text: name, lines: 2)
                CardLabel(text: description(spec), lines: descLines)
            }
            .frame(width: textWidth, height: textBottom - textTop, alignment: .top)
            .clipped()
            .offset(x: side, y: textTop)
        }
        .frame(width: w, height: h, alignment: .topLeading)
        .modifier(OptionalCardShadow(enabled: !compact, rarity: augment.rarity, width: w, scheme: scheme))
        .accessibilityElement(children: .combine)
    }

    private func description(_ spec: TextSpec) -> NSAttributedString {
        let text = CardLabel.paragraph(cleanAugmentDescription(augment.description), size: spec.desc, weight: .medium, lineHeight: spec.descLine, color: HeroOverlay.textSecondary)
        for match in Self.amount.matches(in: text.string, range: NSRange(location: 0, length: text.length)) {
            text.addAttributes([
                .font: UIFont.systemFont(ofSize: spec.desc, weight: .bold),
                .foregroundColor: UIColor(AugmentCardColors.amount),
            ], range: match.range)
        }
        return CardLabel.finish(text, lineHeight: spec.descLine)
    }
}

private struct OptionalCardShadow: ViewModifier {
    let enabled: Bool
    let rarity: Rarity
    let width: CGFloat
    let scheme: ColorScheme

    func body(content: Content) -> some View {
        if enabled { content.cardShadow(rarity, width: width, scheme: scheme) } else { content }
    }
}

#Preview("카드 3종 × 일반·compact") {
    let data = try! GameData.bundled(locale: .ko)
    let samples = Rarity.allCases.compactMap { r in data.augmentPool.first { $0.rarity == r } }
    return ScrollView {
        ForEach([ColorScheme.light, .dark], id: \.self) { scheme in
            VStack(spacing: Spacing.four) {
                HStack(spacing: CardLayout.gap) {
                    ForEach(samples) { RarityCardFrame(augment: $0, cardWidth: 110) }
                }
                HStack(spacing: Spacing.two) {
                    ForEach(samples) { RarityCardFrame(augment: $0, cardWidth: 90, compact: true) }
                }
            }
            .padding(Spacing.four)
            .background(Palette.of(scheme).surface.base)
            .environment(\.colorScheme, scheme)
        }
    }
}
