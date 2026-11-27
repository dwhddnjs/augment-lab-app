import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["recent": "최근 빌드", "seeAll": "전체 보기"],
    en: ["recent": "Recent Builds", "seeAll": "See All"]
)

/// 홈 탭 (RN `home-screen.tsx`, spec home-builds §1). 시작 카드 → 최근 빌드 캐러셀 → 지금 S티어.
/// 큰 제목은 셸(RootView)이 준다 — 루트 스크롤뷰라 스크롤에 맞춰 접힌다.
struct HomeScreen: View {
    @Environment(Router.self) private var router
    @Environment(AppSettings.self) private var settings
    @Environment(BuildStore.self) private var store
    @Environment(\.palette) private var palette
    @State private var deleting: SavedBuild?

    /// 세 번째 카드가 화면 끝에 걸쳐 옆으로 넘길 수 있다는 게 보이는 폭
    private static let recentCard: CGFloat = 148
    /// 캐러셀에 올리는 최근 빌드 수. 나머지는 전체 보기에서.
    private static let recentCount = 8

    var body: some View {
        let t = L.t(settings.locale)
        // nil = 로딩 중(깜빡임 없이 빈 상태와 구분)
        let recent = Array((store.builds ?? []).prefix(Self.recentCount))
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.five - Spacing.one) {
                StartCard(onStart: start)

                VStack(alignment: .leading, spacing: Spacing.double) {
                    HStack(alignment: .firstTextBaseline) {
                        Text(t("recent"))
                            .rnText(size: TypeStyle.heading.size, lineHeight: TypeStyle.heading.lineHeight, weight: .heavy)
                            .foregroundStyle(palette.text.primary)
                        Spacer()
                        if !recent.isEmpty { MoreLink(t("seeAll")) { router.push(.builds) } }
                    }
                    // 빈 자리도 카드 모양으로 둔다 — 첫 빌드가 그 자리에 들어선다는 게 보이고, 누르면 바로 시작한다
                    if store.builds != nil, recent.isEmpty {
                        EmptyBuildCard(width: Self.recentCard) { router.showModeSelect() }
                    }
                    if !recent.isEmpty { carousel(recent) }
                }

                TopTierSection()
            }
            .padding(.top, Spacing.two)
            .padding(.horizontal, Spacing.three)
            .padding(.bottom, bottomTabInset + Spacing.four)
        }
        .scrollIndicators(.hidden)
        .background(palette.surface.base)
        .confirmDeleteBuild($deleting)
        .task { store.load() }
    }

    private func carousel(_ builds: [SavedBuild]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.double) {
                ForEach(builds) { build in
                    BuildCard(build: build, width: Self.recentCard,
                              onPress: { router.push(.build(id: build.id)) },
                              onLongPress: { deleting = build })
                }
            }
            .padding(.horizontal, Spacing.three)
            // 카드 아래로 번지는 조명 그림자가 스크롤 경계에 잘리지 않게 아래를 비운다
            .padding(.bottom, Spacing.three)
        }
        // 화면 끝까지 넘어가게 본문 여백만큼 바깥으로 빼고, 안쪽에서 다시 채운다
        .padding(.horizontal, -Spacing.three)
        .padding(.bottom, -Spacing.three)
    }

    /// 고른 헤드라이너를 챔피언 선택 → 드래프트까지 나른다.
    /// 타일 연타로 시트가 두 장 쌓이지 않게, 시트가 떠 있는 동안은 무시한다(presentChampionSelect가 sheet를 바로 세운다).
    private func start(_ headliner: HeadlinerId) {
        guard router.sheet == nil else { return }
        router.presentChampionSelect(.aram, headliner: headliner)
    }
}
