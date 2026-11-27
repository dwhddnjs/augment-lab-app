import AugmentCore
import SDWebImageSwiftUI
import SwiftUI

private let L = L10n(
    ko: ["unknownChampion": "알 수 없는 챔피언", "custom": "커스텀 빌드"],
    en: ["unknownChampion": "Unknown champion", "custom": "Custom build"]
)

/// 홈 그리드·내 빌드의 저장된 빌드 카드 한 장 (RN `builds/components/build-card.tsx`, spec home-builds §2·design-system §4).
/// 챔피언 centered splash가 카드를 채우고, 헤드라이너 색(커스텀은 민트)은 테두리·글로우에만 묻힌다.
/// 왼쪽 위 배지는 헤드라이너 로고 / 커스텀 아이콘, 둘 다 없는 빌드(헤드라이너 도입 전 칼바람)는 배지·색 없이.
public struct BuildCard: View {
    /// 카드 가로:세로 — centered splash(1280×720)를 높이로 채우면 가운데 얼굴~상체가 남는 비율
    public static let aspect: CGFloat = 0.7

    enum Metrics {
        static let pad = Spacing.double
        static let augSize: CGFloat = 26
        static let augGap = Spacing.one
        /// 배지 그림의 긴 변(투명 여백 제외, logoBoxHeight). K/DA 워드마크는 높이가 이 절반이라 폭이 약 60pt.
        static let badgeInk: CGFloat = 24
        /// 날짜 캡슐 높이. 윗줄 높이도 이 값으로 고정한다.
        static let pill: CGFloat = 26
        /// 배지 상자 왼쪽 끝 — 아래 챔피언 이름(pad)과 같은 세로선. 그림 왼쪽 끝은 배지가 여백만큼 당겨 맞춘다.
        static let badgeLeft = pad - Spacing.two
        /// MCI 글리프는 24 격자 안에 사방 2씩 여백을 둔다.
        static let mdiInset: CGFloat = 2 / 24
        static let pressedOpacity = 0.92
        static let longPressSeconds = 0.5 // RN Pressable delayLongPress 기본값
    }

    let build: SavedBuild
    let width: CGFloat
    let onPress: () -> Void
    let onLongPress: () -> Void
    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.displayScale) private var displayScale
    @State private var pressed = false

    public init(build: SavedBuild, width: CGFloat, onPress: @escaping () -> Void, onLongPress: @escaping () -> Void) {
        self.build = build
        self.width = width
        self.onPress = onPress
        self.onLongPress = onLongPress
    }

    /// 카드 조명색 — 커스텀은 민트, 헤드라이너는 그 색, 둘 다 없으면 nil. 카드 위는 어두운 톤이라 다크 토큰.
    static func stageColor(_ build: SavedBuild) -> Color? {
        if build.custom { return Palette.dark.accent.default }
        guard let id = build.headliner?.id, HeadlinerId(rawValue: id) != nil, let hex = HeadlinerColors[id] else { return nil }
        return Color(token: hex)
    }

    /// RN `${color}${alpha}` — 두 자리 hex 알파를 곱한다
    static func alpha(_ hex2: String) -> Double { Double(Int(hex2, radix: 16)!) / 255 }

    public var body: some View {
        let data = store.data
        let t = L.t(settings.locale)
        let champion = data.championsById[build.championId]
        let augments = resolveIds(build.augmentIds, in: data.augmentsById)
        let tone = Self.stageColor(build)
        let height = width / Self.aspect
        let shape = Radius.shape(Radius.xl)

        // 한 줄에 들어가는 만큼만. 넘치면(보너스 라운드·전환 증강) 마지막 칸을 +n으로.
        let fit = Int(((width - Metrics.pad * 2 + Metrics.augGap) / (Metrics.augSize + Metrics.augGap)).rounded(.down))
        let overflow = augments.count > fit
        let shown = overflow ? Array(augments.prefix(max(0, fit - 1))) : augments

        ZStack(alignment: .topLeading) {
            HeroOverlay.cardBase
            if let champion {
                WebImage(url: CDN.championCenteredURL(champion.id)) { $0.resizable().scaledToFill() } placeholder: { Color.clear }
                    .frame(width: width, height: height)
                    .clipped()
            }
            // 그림은 가리지 않는다 — 글자가 놓이는 아래쪽에만 scrim(모드 무관)
            LinearGradient(stops: zip(HeroOverlay.scrimDark, [0.52, 0.7, 0.85, 1]).map { .init(color: $0, location: $1) },
                           startPoint: .top, endPoint: .bottom)
            // 배지 자리만 어둡게 — 왼쪽 위 모서리에서 대각선으로 걷힌다. 테두리보다 먼저 깐다.
            if tone != nil {
                LinearGradient(stops: zip(HeroOverlay.scrimCorner, [0, 0.45, 1]).map { .init(color: $0, location: $1) },
                               startPoint: .topLeading, endPoint: UnitPoint(x: 0.6, y: 0.3))
            }

            topRow(customLabel: t("custom"))
                .padding([.top, .horizontal], Spacing.two)

            VStack(alignment: .leading, spacing: Spacing.two) {
                VStack(alignment: .leading, spacing: 0) {
                    if let champion {
                        Text(champion.title)
                            .rnText(.caption)
                            .lineLimit(1)
                            .foregroundStyle(HeroOverlay.textSecondary)
                            .heroTextShadow()
                    }
                    Text(champion?.name ?? t("unknownChampion"))
                        .rnText(size: TypeStyle.heading.size, lineHeight: TypeStyle.heading.lineHeight, weight: .heavy) // RN 800
                        .lineLimit(1)
                        .foregroundStyle(HeroOverlay.textPrimary)
                        .heroTextShadow()
                }
                if !augments.isEmpty {
                    HStack(spacing: Metrics.augGap) {
                        ForEach(Array(shown.enumerated()), id: \.offset) { _, aug in
                            AugmentTile(iconPath: aug.iconPath, rarity: aug.rarity, size: Metrics.augSize)
                        }
                        if overflow {
                            Text("+\(augments.count - shown.count)")
                                .rnText(.caption)
                                .foregroundStyle(HeroOverlay.textPrimary)
                                .frame(width: Metrics.augSize, height: Metrics.augSize)
                                .background(HeroOverlay.tileBg, in: Radius.shape(Radius.md))
                                .overlay(Radius.shape(Radius.md).strokeBorder(HeroOverlay.tileBorder, lineWidth: 1))
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            .padding(Metrics.pad)
        }
        .frame(width: width, height: height)
        .clipShape(shape)
        // 테두리는 그림·scrim 위에 따로 얹는다
        .overlay {
            if let tone {
                shape.strokeBorder(tone.opacity(Self.alpha(StageAlpha.edge)), lineWidth: 1)
            } else {
                shape.strokeBorder(HeroOverlay.tileBorder, lineWidth: hairline(displayScale))
            }
        }
        .background { if let tone { glow(tone) } }
        .opacity(pressed ? Metrics.pressedOpacity : 1)
        .contentShape(shape)
        .onTapGesture(perform: onPress)
        .onLongPressGesture(minimumDuration: Metrics.longPressSeconds, perform: onLongPress) { pressed = $0 }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(champion?.name ?? "")
        .accessibilityAddTraits(.isButton)
    }

    /// CSS `box-shadow: 0 6px 14px -8px C4D` — SwiftUI 그림자엔 spread가 없어 같은 걸 직접 그린다:
    /// 카드에서 8씩 들인 모양(반경도 16 − 8)을 아래로 6 내리고 blur 14 ÷ 2 = 7. 카드가 불투명해 바깥으로 삐져나온 것만 보인다.
    private func glow(_ tone: Color) -> some View {
        let spread: CGFloat = 8
        return Radius.shape(Radius.xl - spread)
            .fill(tone.opacity(Self.alpha(StageAlpha.glow)))
            .padding(spread)
            .offset(y: 6)
            .blur(radius: 7)
    }

    /// 높이를 캡슐에 고정한다 — 배지 상자는 로고마다 높이가 달라(bees 30 · K/DA 16) 그대로 두면 날짜 캡슐이 카드마다 내려간다.
    /// 캡슐보다 큰 배지는 위아래로 고르게 넘친다.
    private func topRow(customLabel: String) -> some View {
        HStack(spacing: 0) {
            badge(customLabel: customLabel)
            Spacer(minLength: 0)
            Text(BuildDate.dayLabel(build.createdAt, settings.locale))
                .rnText(size: 11, lineHeight: 13, weight: .semibold) // caption(12)은 26pt 캡슐 안에서 커 보여 한 단계 줄인다
                .foregroundStyle(HeroOverlay.textPrimary)
                .padding(.horizontal, Spacing.one + Spacing.half)
                .frame(minWidth: Metrics.pill, minHeight: Metrics.pill, maxHeight: Metrics.pill)
                .background(HeroOverlay.tileBg, in: Capsule())
        }
        .frame(height: Metrics.pill)
    }

    @ViewBuilder private func badge(customLabel: String) -> some View {
        if build.custom {
            IconView(.mci("tune-variant"), size: Metrics.badgeInk)
                .foregroundStyle(Palette.dark.accent.default)
                .padding(.leading, Metrics.badgeLeft - Metrics.badgeInk * Metrics.mdiInset)
                .accessibilityLabel(customLabel)
        } else if let raw = build.headliner?.id, let id = HeadlinerId(rawValue: raw) {
            // 판 위가 늘 어두워서 라이트 모드용 그림·흰 로고 칠하기 없이 원본(small)을 그린다.
            let art = HeadlinerAssets.logo(id)
            let h = HeadlinerAssets.logoBoxHeight(id, inkSize: Metrics.badgeInk)
            Image(decorative: art.small ?? art.asset)
                .resizable()
                .scaledToFit()
                .frame(width: h * art.aspect, height: h)
                .padding(.leading, Metrics.badgeLeft - HeadlinerAssets.logoInkLeft(id, boxHeight: h))
        }
    }
}

private extension View {
    /// scrim이 옅은 윗줄이 밝은 그림 위에 놓여도 읽히게. RN textShadowRadius 6(= CG blur) ≈ SwiftUI radius 3.
    func heroTextShadow() -> some View { shadow(color: HeroOverlay.scrimDark[3], radius: 3) }
}

#Preview {
    @Previewable @State var settings = AppSettings(store: MemoryKeyValueStore())
    let now = ISO8601DateFormatter().string(from: Date())
    let ids = try! GameData.bundled(locale: .ko).augments.prefix(8).map(\.id)
    let builds = [
        SavedBuild(id: "1", championId: "Jinx", augmentIds: ids, itemIds: [], headliner: BuildHeadliner(id: "kda"), createdAt: now),
        SavedBuild(id: "2", championId: "Garen", augmentIds: Array(ids.prefix(4)), itemIds: [], custom: true, createdAt: "2026-11-26T03:00:00Z"),
        SavedBuild(id: "3", championId: "Ahri", augmentIds: [], itemIds: [], headliner: BuildHeadliner(id: "bees"), createdAt: "2025-03-02T03:00:00.000Z"),
        SavedBuild(id: "4", championId: "Yasuo", augmentIds: [], itemIds: [], createdAt: "2026-10-01T03:00:00Z"),
    ]
    ScrollView(.horizontal) {
        HStack(spacing: Spacing.double) {
            ForEach(builds) { b in BuildCard(build: b, width: 160, onPress: {}, onLongPress: {}) }
        }
        .padding(Spacing.four)
    }
    .surfaceBackground()
    .environment(try! GameDataStore(locale: settings.locale))
    .appSettings(settings)
    .providesPalette()
}
