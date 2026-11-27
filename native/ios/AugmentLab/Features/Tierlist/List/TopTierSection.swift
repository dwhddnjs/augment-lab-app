import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["title": "지금 S티어", "more": "티어리스트"],
    en: ["title": "S Tier Now", "more": "Tier List"]
)

/// 홈 "지금 S티어" 줄 (tierlist.md §1). S티어 전원을 소스 순서(같은 티어는 승률순)로 가로로 넘긴다.
/// 누르면 티어리스트 챔피언 모달, "티어리스트"는 티어리스트 탭으로 간다.
/// 홈 본문(좌우 16 여백) 안에 놓인다고 보고, 캐러셀만 화면 끝까지 넘어가게 여백만큼 밖으로 뺀다.
struct TopTierSection: View {
    @Environment(Router.self) private var router
    @Environment(AppSettings.self) private var settings
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    private static let avatar: CGFloat = 56
    /// 한 칸 폭 — 아바타에 이름 말줄임 여유만 더한다. 칸 사이는 gap만 벌어진다.
    private static let item = avatar + Spacing.two
    private static let avatarBorder: CGFloat = 2

    var body: some View {
        let t = L.t(settings.locale)
        let data = store.data
        let top = data.tierlist.aram.filter { $0.tier == .S }
        let tierColor = Color(token: TierColors.hex(.S, palette.scheme))

        VStack(alignment: .leading, spacing: Spacing.double) {
            HStack(alignment: .firstTextBaseline) {
                Text(t("title"))
                    .rnText(size: TypeStyle.heading.size, lineHeight: TypeStyle.heading.lineHeight, weight: .heavy)
                    .foregroundStyle(palette.text.primary)
                Spacer()
                MoreLink(t("more")) { router.selectTab(.tierlist) }
            }

            ScrollView(.horizontal) {
                HStack(spacing: Spacing.one) {
                    ForEach(top, id: \.key) { row in
                        if let champion = data.championsByKey[row.key] {
                            Button { router.presentTierlistChampion(row.key) } label: {
                                VStack(spacing: Spacing.one + Spacing.half) {
                                    RemoteImage(data.cdn.championSquareURL(champion.imageKey), size: Self.avatar)
                                        .clipShape(Circle())
                                        .overlay(Circle().strokeBorder(tierColor, lineWidth: Self.avatarBorder))
                                    Text(champion.name)
                                        .rnText(.caption)
                                        .lineLimit(1)
                                        .foregroundStyle(palette.text.secondary)
                                }
                                .frame(width: Self.item)
                            }
                            .buttonStyle(NoFeedbackButtonStyle())
                        }
                    }
                }
                .padding(.horizontal, Spacing.three)
            }
            .scrollIndicators(.hidden)
            // 최근 빌드 캐러셀과 같이 화면 끝까지 넘어가게 본문 여백만큼 바깥으로 뺀다
            .padding(.horizontal, -Spacing.three)
        }
    }
}
