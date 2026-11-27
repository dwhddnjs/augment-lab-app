import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["emptyHint": "빌드를 완료하면 여기에 쌓여요", "noMatch": "조건에 맞는 빌드가 없어요",
         "all": "전체", "week": "최근 7일", "prismatic": "프리즘", "custom": "커스텀"],
    en: ["emptyHint": "Finish a build to see it here", "noMatch": "No builds match this filter",
         "all": "All", "week": "7 days", "prismatic": "Prismatic", "custom": "Custom"]
)

/// 홈 "전체 보기" 필터 (RN `build-filter-bar.tsx`)
private enum BuildFilter: String, CaseIterable {
    case all, week, prismatic, custom
}

/// 내 빌드 2열 그리드 + 세그먼트 필터 (RN `build-list-screen.tsx`). spec home-builds.md §3. 제목(large)은 셸이 단다.
struct BuildListScreen: View {
    static let gridGap = Spacing.double

    @Environment(BuildStore.self) private var store
    @Environment(GameDataStore.self) private var gameData
    @Environment(AppSettings.self) private var settings
    @Environment(Router.self) private var router
    @Environment(\.palette) private var palette
    @State private var filter = BuildFilter.all
    @State private var deleting: SavedBuild?

    var body: some View {
        let t = L.t(settings.locale)
        let all = store.builds ?? []
        let prismaticIds = Set(gameData.data.augments.filter { $0.rarity == .prismatic }.map(\.id))
        let shown = all.filter { b in
            switch filter {
            case .all: true
            case .week: BuildDate.isWithinWeek(b.createdAt)
            case .prismatic: b.augmentIds.contains { prismaticIds.contains($0) }
            case .custom: b.custom
            }
        }

        GeometryReader { geo in
            let cardWidth = (geo.size.width - Spacing.three * 2 - Self.gridGap) / 2
            ScrollView {
                VStack(spacing: Self.gridGap) {
                    // 빌드가 하나라도 있을 때만
                    if !all.isEmpty {
                        Picker(selection: $filter) {
                            ForEach(BuildFilter.allCases, id: \.self) { Text(t($0.rawValue)).tag($0) }
                        } label: {
                            EmptyView()
                        }
                        .pickerStyle(.segmented)
                        .tint(palette.accent.default)
                        .frame(height: 32)
                    }
                    if shown.isEmpty {
                        // 로딩 중(nil)에는 깜빡임 없이 비워 둔다
                        if store.builds != nil {
                            Text(t(all.isEmpty ? "emptyHint" : "noMatch")).rnText(.caption).foregroundStyle(palette.text.tertiary)
                                .multilineTextAlignment(.center).frame(maxWidth: .infinity).padding(.top, Spacing.four)
                        }
                    } else {
                        LazyVGrid(columns: [GridItem(.fixed(cardWidth), spacing: Self.gridGap), GridItem(.fixed(cardWidth))],
                                  alignment: .leading, spacing: Self.gridGap) {
                            ForEach(shown) { b in
                                BuildCard(build: b, width: cardWidth, onPress: { router.push(.build(id: b.id)) }, onLongPress: { deleting = b })
                            }
                        }
                    }
                }
                .padding(.top, Spacing.two)
                .padding(.horizontal, Spacing.three)
                .padding(.bottom, bottomTabInset + Spacing.three)
            }
            .scrollIndicators(.hidden)
        }
        .background(palette.surface.base)
        .confirmDeleteBuild($deleting)
        .task { if store.builds == nil { store.load() } }
    }
}
