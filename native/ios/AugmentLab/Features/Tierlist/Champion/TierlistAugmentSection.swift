import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["augments": "증강", "showAll": "모든 증강 보기", "showLess": "증강 접기", "silver": "실버", "gold": "골드", "prismatic": "프리즘"],
    en: ["augments": "Augments", "showAll": "Show all augments", "showLess": "Show fewer augments", "silver": "Silver", "gold": "Gold", "prismatic": "Prismatic"]
)

/// 추천 증강 — 제목 + 희귀도 그룹 격자 + "모든 증강 보기" (tierlist.md §2, design-system §3.7).
/// 기본은 그룹마다 상위 6개. 펼치면 맨 위로 스크롤한 뒤 50ms마다 그룹당 12개씩 붙인다
/// — 챔피언당 74~157개를 한 프레임에 붙이면 끊겨 보인다. 가장 큰 그룹(61개)도 0.3초 안팎에 다 펼쳐진다.
struct TierlistAugmentSection: View {
    let groups: [Tierlist.AugmentGroup]
    /// 펼치기 직전 — 화면이 맨 위로 올라가 프리즘부터 차례로 보게 한다
    let onExpand: () -> Void

    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @State private var limit = Self.preview

    static let preview = 6
    private static let step = 12
    private static let interval: Duration = .milliseconds(50)

    var body: some View {
        let t = L.t(settings.locale)
        let largest = groups.map(\.list.count).max() ?? 0
        let expanded = limit > Self.preview
        if !groups.isEmpty {
            Text(t("augments")).rnText(.heading).foregroundStyle(palette.text.primary).padding(.top, Spacing.three)
                // 펼치기 시작하면 가장 큰 그룹이 다 보일 때까지 늘린다. 접거나 limit이 바뀌면 예약이 취소된다.
                // (부모 VStack 간격이 생기지 않게 빈 뷰 대신 제목에 붙인다)
                .task(id: limit) {
                    guard limit > Self.preview, limit < largest else { return }
                    try? await Task.sleep(for: Self.interval)
                    if !Task.isCancelled { limit += Self.step }
                }
            ForEach(groups, id: \.rarity) { group in
                AugmentGrid(rarity: group.rarity, label: t(group.rarity.rawValue), entries: Array(group.list.prefix(limit)), fadeFrom: Self.preview)
            }
            if largest > Self.preview {
                Button {
                    // 접을 때는 내용이 줄며 스크롤이 끝으로 당겨져 이 버튼·아이템 섹션이 화면에 남는다
                    if !expanded { onExpand() }
                    limit = expanded ? Self.preview : Self.preview + Self.step
                } label: {
                    // label(14) 굵기·줄높이는 두고 글자만 caption 크기 — 버튼 높이 38
                    Text(t(expanded ? "showLess" : "showAll"))
                        .rnText(size: TypeStyle.caption.size, lineHeight: TypeStyle.label.lineHeight, weight: TypeStyle.label.weight)
                        .foregroundStyle(palette.text.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.two)
                        .background(palette.surface.raised, in: Radius.shape(Radius.lg))
                        .overlay(Radius.shape(Radius.lg).strokeBorder(palette.border.subtle, lineWidth: 1))
                }
                .buttonStyle(NoFeedbackButtonStyle())
                .accessibilityValue(expanded ? Text(t("showLess")) : Text(t("showAll")))
            }
        }
    }
}

/// 희귀도 그룹 하나 — 라벨 + 2열 증강 카드
private struct AugmentGrid: View {
    let rarity: Rarity
    let label: String
    let entries: [Tierlist.TierAugment]
    /// 이 인덱스부터의 카드는 붙을 때 페이드로 나온다(처음부터 보이는 카드는 깜빡이지 않게)
    let fadeFrom: Int

    @Environment(\.palette) private var palette
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private static let columns = Array(repeating: GridItem(.flexible(), spacing: Spacing.two), count: 2)
    private static let fade = AnyTransition.opacity.animation(.easeInOut(duration: 0.22))

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.two) {
            Text(label).rnText(.label).foregroundStyle(palette.text.secondary)
            LazyVGrid(columns: Self.columns, spacing: Spacing.two) {
                ForEach(Array(entries.enumerated()), id: \.element.augment.id) { i, entry in
                    AugmentCard(entry: entry, rarity: rarity)
                        .transition(i >= fadeFrom && !reduceMotion ? Self.fade : .identity)
                }
            }
        }
        .padding(.bottom, Spacing.two)
    }
}

/// 카드 한 장 — 아이콘 하단에 증강 티어 배지, 오른쪽 선은 티어색(희귀도색은 아이콘·배지 테두리가 맡는다)
private struct AugmentCard: View {
    let entry: Tierlist.TierAugment
    let rarity: Rarity

    @Environment(\.palette) private var palette

    private static let icon: CGFloat = 40
    private static let badge: CGFloat = 18
    private static let rightLine: CGFloat = 2.5

    var body: some View {
        let tier = Tierlist.augTier(entry.tier)
        let tierColor = Color(token: TierColors.hex(tier, palette.scheme))
        HStack(spacing: Spacing.two) {
            AugmentTile(iconPath: entry.augment.iconPath, rarity: rarity, size: Self.icon, background: HeroOverlay.cardBase)
                // 아이콘 하단 가운데에 걸친 티어 배지. 아이콘 위라 배경은 불투명이어야 읽힌다
                .overlay(alignment: .bottom) {
                    // 배지 글자는 caption보다 한 단계 작아야 18pt 원 안에 들어간다
                    Text(tier.rawValue)
                        .rnText(size: 10, lineHeight: 14, weight: .heavy)
                        .foregroundStyle(tierColor)
                        .frame(width: Self.badge, height: Self.badge)
                        .background(palette.surface.sunken, in: Circle())
                        // 테두리는 아이콘과 같은 희귀도색(카드 아트 위 팔레트 = 항상 다크) — 타일에 이어 붙은 것처럼
                        .overlay(Circle().strokeBorder(RarityColors.color(rarity, .dark), lineWidth: 1))
                        .offset(y: Spacing.two)
                }
            Text(entry.augment.name)
                .rnText(.caption)
                .lineLimit(2)
                .foregroundStyle(palette.text.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(Spacing.two)
        .background(palette.surface.raised)
        .overlay(alignment: .trailing) { tierColor.frame(width: Self.rightLine) }
        .clipShape(Radius.shape(Radius.lg))
    }
}
