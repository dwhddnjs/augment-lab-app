import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["title": "헤드라이너 선택", "pick": "{name}(으)로 시작"],
    en: ["title": "Choose a headliner", "pick": "Start with {name}"]
)

/// 홈 맨 위 시작 카드 (RN `start-card.tsx`). 타일을 누르면 그 헤드라이너로 고정해 드래프트를 시작한다.
/// 드래프트 이벤트가 있는 헤드라이너가 앞에, 설명만 있는 것은 뒤에 선다. 랜덤 시작은 탭바 + → 칼바람이다.
/// 앞 타일 넷의 색이 위에서 무대 조명처럼 내리꽂는다. 카드 위는 모드와 무관하게 어두운 톤이다.
struct StartCard: View {
    let onStart: (HeadlinerId) -> Void

    @Environment(AppSettings.self) private var settings
    @Environment(GameDataStore.self) private var store
    @Environment(\.displayScale) private var displayScale

    private static let pad = Spacing.three + Spacing.half
    /// 가장 긴 이름(HEARTSTEEL·귀염둥이 카페)이 그대로 들어가는 폭. 넷째 타일이 카드 끝에 살짝 걸친다.
    static let tileW: CGFloat = 96
    static let tileH: CGFloat = 92
    static let logo: CGFloat = 40

    /// 드래프트 이벤트가 있는 헤드라이너 먼저, 나머지는 뒤로. 각 묶음 안은 등장 순서다.
    static let lineup: [HeadlinerId] = {
        let events = HeadlinerRules.draftEventIds
        return HeadlinerId.allCases.filter(events.contains) + HeadlinerId.allCases.filter { !events.contains($0) }
    }()

    var body: some View {
        let t = L.t(settings.locale)
        let shape = Radius.shape(Radius.xxl)
        VStack(alignment: .leading, spacing: Spacing.two) {
            Text(t("title"))
                .rnText(size: TypeStyle.body.size, lineHeight: TypeStyle.body.lineHeight, weight: .heavy)
                .foregroundStyle(HeroOverlay.textPrimary)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.two) {
                    ForEach(Self.lineup, id: \.self) { id in
                        let name = store.data.headlinerTexts.headliners[id.rawValue]?.name ?? id.rawValue
                        Tile(id: id, name: name, a11y: t("pick").replacingOccurrences(of: "{name}", with: name)) { onStart(id) }
                    }
                }
                .padding(.horizontal, Self.pad)
            }
            // 카드 가장자리까지 넘어가게 카드 여백만큼 바깥으로 뺀다(둥근 모서리에서 잘린다)
            .padding(.horizontal, -Self.pad)
        }
        .padding(.horizontal, Self.pad)
        .padding(.bottom, Self.pad)
        // 제목(16/24)은 줄높이 여백 + 한글 윗여백만큼 아래에서 시작해 위를 덜어 낸다 — 윗변↔제목, 타일↔아랫변이 눈으로 같아진다
        .padding(.top, Spacing.double)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background { StageLights(colors: Self.lineup.prefix(4).map { HeadlinerColors[$0.rawValue]! }) }
        .background(HeroOverlay.cardBase)
        .clipShape(shape)
        .overlay(shape.strokeBorder(HeroOverlay.tileBorder, lineWidth: hairline(displayScale)))
    }
}

/// 카드 윗변 바깥에서 아래로 번지는 조명 — CSS `radial-gradient(34% 70% at x% -14%, C73 0%, C00 100%)` 넷.
/// SwiftUI엔 반지름이 따로인 타원 그라디언트가 없어 원을 세로로 늘려 그린다.
private struct StageLights: View {
    let colors: [String]

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width, h = geo.size.height
            let rx = w * 0.34, ry = h * 0.7
            ForEach(Array(colors.enumerated()), id: \.offset) { i, hex in
                // JS Math.round(((i + 0.5) / n) * 100) → 13·38·63·88
                let x = (((Double(i) + 0.5) / Double(colors.count)) * 100).rounded() / 100
                RadialGradient(colors: [Color(hex: hex, alpha: StageAlpha.light), Color(hex: hex, alpha: "00")],
                               center: .center, startRadius: 0, endRadius: rx)
                    .frame(width: rx * 2, height: rx * 2)
                    .scaleEffect(x: 1, y: ry / rx)
                    .position(x: w * x, y: -h * 0.14)
            }
        }
        .allowsHitTesting(false)
    }
}

/// 시작 타일 한 칸 — 로고 + 이름, 안쪽 위에서 그 색이 은은하게 비친다.
private struct Tile: View {
    let id: HeadlinerId
    let name: String
    let a11y: String
    let onPress: () -> Void

    @Environment(\.displayScale) private var displayScale

    /// CSS `circle at 50% 30%`의 기본 크기 farthest-corner(√(48² + 64.4²)) × 색이 다 빠지는 70%
    private static let washRadius = (pow(StartCard.tileW / 2, 2) + pow(StartCard.tileH * 0.7, 2)).squareRoot() * 0.7

    var body: some View {
        let color = HeadlinerColors[id.rawValue]!
        let art = HeadlinerAssets.logo(id)
        // 투명 여백을 뺀 그림이 40이 되게 상자를 키운다(빌드 카드·드래프트 헤더와 같은 logoBoxHeight).
        // 가로로 긴 로고(K/DA)는 타일 폭에 맞춰 줄인다. 그림 칸보다 큰 상자는 위아래로 넘친다.
        let logoW = min(HeadlinerAssets.logoBoxHeight(id, inkSize: StartCard.logo) * art.aspect, StartCard.tileW - Spacing.double)
        let shape = Radius.shape(Radius.lg)
        Button(action: onPress) {
            VStack(spacing: Spacing.two) {
                // 그림 칸 높이 고정 — 납작한 K/DA 로고 타일만 이름이 위로 올라가지 않게
                Image(decorative: art.small ?? art.asset)
                    .resizable().scaledToFit()
                    .frame(width: logoW, height: logoW / art.aspect)
                    .frame(maxWidth: .infinity)
                    .frame(height: StartCard.logo)
                // caption보다 한 단계 작게 — 로고가 주인공이고 이름은 받쳐 준다
                Text(name)
                    .rnText(size: 11, lineHeight: 14, weight: .semibold)
                    .lineLimit(1)
                    .foregroundStyle(Color(token: color))
            }
            .padding(.horizontal, Spacing.one)
            .frame(width: StartCard.tileW, height: StartCard.tileH)
            .background {
                RadialGradient(colors: [Color(hex: color, alpha: StageAlpha.wash), Color(hex: color, alpha: "00")],
                               center: UnitPoint(x: 0.5, y: 0.3), startRadius: 0, endRadius: Self.washRadius)
            }
            .background(Palette.dark.glassFill)
            .clipShape(shape)
            .overlay(shape.strokeBorder(HeroOverlay.tileBorder, lineWidth: hairline(displayScale)))
            .contentShape(shape)
        }
        .buttonStyle(PressedOpacityStyle(opacity: 0.7))
        .accessibilityLabel(a11y)
    }
}
