import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["title": "내 빌드", "augments": "증강"],
    en: ["title": "My Build", "augments": "Augments"]
)

/// 칼바람 픽 현황 서랍 내용 (RN `picked-drawer.tsx`). spec/aram.md §3.
/// 챔피언 요약 → 헤드라이너 요약(compact) → 3열 증강 그리드("n/6").
/// 좌우 여백은 대칭이고 오른쪽 안전 영역을 두지 않는다 — 그리드가 서랍 끝까지 찬다.
struct PickedDrawer: View {
    let picked: [Augment]
    /// 서랍 실제 폭(`SideDrawer`가 넘겨 준다)
    let width: CGFloat
    var championId: String?
    /// 이번 판 헤드라이너(I-24 `HeadlinerProgress`의 id·skills·stickers)
    var headlinerId: String?
    var skills: [SkillKey] = []
    var stickers: [String] = []

    /// 칼바람 4픽에 보너스(K/DA·열혈 팬)·전환 증강으로 늘어나는 몫까지 3열 두 줄. 전환이 증강을 더 주면 그 이상으로 늘어난다.
    static let slots = 6
    static let columns = 3

    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let t = L.t(settings.locale)
        let pad = Spacing.three
        let cell = (width - pad * 2 - Spacing.two * CGFloat(Self.columns - 1)) / CGFloat(Self.columns)
        let cells: [Augment?] = (0..<max(Self.slots, picked.count)).map { $0 < picked.count ? picked[$0] : nil }

        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: Spacing.four) {
                Text(t("title")).rnText(.heading)

                if let champion = championId.flatMap({ store.data.championsById[$0] }) {
                    ChampionSummary(champion: champion)
                }

                if let headlinerId {
                    HeadlinerSummary(id: headlinerId, skills: skills, stickers: stickers, championId: championId, compact: true)
                }

                VStack(alignment: .leading, spacing: Spacing.two) {
                    Text("\(t("augments")) \(picked.count)/\(Self.slots)")
                        .rnText(.label)
                        .foregroundStyle(palette.text.secondary)
                    VStack(alignment: .leading, spacing: Spacing.two) {
                        ForEach(Array(stride(from: 0, to: cells.count, by: Self.columns)), id: \.self) { start in
                            HStack(alignment: .top, spacing: Spacing.two) {
                                ForEach(start..<min(start + Self.columns, cells.count), id: \.self) { i in
                                    AugmentCell(augment: cells[i], size: cell)
                                }
                            }
                        }
                    }
                }
            }
            .padding(pad)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct AugmentCell: View {
    let augment: Augment?
    let size: CGFloat

    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    var body: some View {
        if let augment {
            // 증강 아이콘은 어두운 배경 자산이라 모드와 무관하게 어두운 타일에 담고, 테두리·글리프도 다크 팔레트다.
            let tint = RarityColors.color(augment.rarity, .dark)
            VStack(spacing: Spacing.one) {
                AugmentImage(
                    iconPath: augment.iconPath,
                    size: (size * 0.78).rounded(),
                    tint: tint,
                    fallbackGlyph: .mci(RarityColors.glyph[augment.rarity] ?? "star-four-points")
                )
                .id(augment.id)
                .frame(width: size, height: size)
                .background(HeroOverlay.cardBase, in: Radius.shape(Radius.md))
                .overlay(Radius.shape(Radius.md).strokeBorder(tint, lineWidth: 1.5))

                // 라이트 모드 등급색은 11pt 글자 대비(4.5:1)에 못 미쳐 이름은 보조색으로 둔다.
                Text(store.data.displayName(augment))
                    .rnText(size: 11, lineHeight: 14, weight: .semibold)
                    .foregroundStyle(palette.scheme == .dark ? tint : palette.text.secondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .truncationMode(.tail)
                    .frame(width: size)
            }
        } else {
            Radius.shape(Radius.md)
                .fill(palette.surface.sunken)
                .overlay(Radius.shape(Radius.md).strokeBorder(palette.border.subtle, style: StrokeStyle(lineWidth: 1.5, dash: [4.5, 4.5])))
                .frame(width: size, height: size)
        }
    }
}

#Preview("서랍 — 열기·스와이프") {
    PickedDrawerPreview()
        .environment(try! GameDataStore(locale: .ko))
        .environment(AppSettings(store: MemoryKeyValueStore()))
}

private struct PickedDrawerPreview: View {
    @State private var open = false
    private let data = try! GameData.bundled(locale: .ko)

    var body: some View {
        SideDrawer(isOpen: $open) {
            Button("서랍 열기") { open = true }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .surfaceBackground()
        } panel: { width in
            PickedDrawer(picked: Array(data.augmentPool.prefix(4)), width: width, championId: data.champions.first?.id, headlinerId: "kda")
        }
    }
}
