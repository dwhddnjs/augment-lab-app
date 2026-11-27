import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["home": "메인", "tierlist": "티어리스트", "mypage": "마이페이지", "plus": "추가",
         "homeTitle": "증강 연구소", "builds": "내 빌드", "data": "데이터 관리"],
    en: ["home": "Home", "tierlist": "Tier List", "mypage": "My Page", "plus": "Add",
         "homeTitle": "Augment Lab", "builds": "My Builds", "data": "Manage Data"]
)

/// 탭·탭별 스택·시트·모드 선택 오버레이·부팅 레이어 (app-shell §1·§4).
struct RootView: View {
    @Environment(Router.self) private var router
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        @Bindable var router = router
        ZStack {
            tabs
            if router.modeSelectShown {
                ModeSelectOverlay().transition(.opacity)
            }
            BootOverlay()
        }
        // §3.3 배경 FadeIn 150ms
        .animation(.easeOut(duration: 0.15), value: router.modeSelectShown)
        .sheet(item: $router.sheet) { sheet in
            Group {
                switch sheet {
                case .championSelect(let mode, let headliner): ChampionSelectScreen(mode: mode, headliner: headliner)
                case .tierlistChampion(let key): TierlistChampionScreen(key: key)
                }
            }
            .providesPalette()
        }
        .onOpenURL { url in
            if let route = Route(url: url) { router.open(route) }
        }
        .onChange(of: router.screenName, initial: true) { _, name in Analytics.trackScreen(name) }
    }

    private var t: (String) -> String { L.t(settings.locale) }

    // MARK: 탭

    @ViewBuilder private var tabs: some View {
        if #available(iOS 26, *) {
            // `+`는 search 역할 탭. 선택을 받지 않고 오버레이만 연다 → 현재 탭이 그대로 남는다(빈 화면 방지).
            TabView(selection: Binding<AppTab?>(
                get: { router.tab },
                set: { if let tab = $0 { router.selectTab(tab) } else { router.showModeSelect() } }
            )) {
                Tab(t("home"), systemImage: "house", value: AppTab?.some(.home)) { stack(.home) }
                Tab(t("tierlist"), systemImage: "chart.bar", value: AppTab?.some(.tierlist)) { stack(.tierlist) }
                Tab(t("mypage"), systemImage: "person.crop.circle", value: AppTab?.some(.mypage)) { stack(.mypage) }
                Tab(t("plus"), systemImage: "plus", value: AppTab?.none, role: .search) { Color.clear }
            }
            .tint(palette.accent.default)
        } else {
            // 26 미만: 시스템 탭바를 숨기고 CustomTabBar(§2.10)를 아래에 쌓는다(RN TabSlot 위 + TabList 아래).
            // 탭 상태 보존은 TabView에 맡긴다. 탭바가 빠지면(빌드 상세) 화면이 바닥까지 내려간다.
            GeometryReader { geo in
                VStack(spacing: 0) {
                    TabView(selection: Bindable(router).tab) {
                        ForEach(AppTab.allCases, id: \.self) { tab in
                            stack(tab).tag(tab)
                        }
                    }
                    .ignoresSafeArea(.container, edges: .bottom)
                    if !router.hidesTabBar { CustomTabBar(bottomInset: geo.safeAreaInsets.bottom) }
                }
            }
            .tint(palette.accent.default)
        }
    }

    // MARK: 스택

    private func stack(_ tab: AppTab) -> some View {
        NavigationStack(path: Binding(get: { router.paths[tab, default: []] }, set: { router.paths[tab] = $0 })) {
            root(tab)
                .hidesSystemTabBar()
                .navigationDestination(for: StackRoute.self) { destination($0).hidesSystemTabBar() }
        }
    }

    @ViewBuilder private func root(_ tab: AppTab) -> some View {
        switch tab {
        case .home: HomeScreen().navigationTitle(t("homeTitle")).navigationBarTitleDisplayMode(.large)
        case .tierlist: TierlistScreen().navigationTitle(t("tierlist")).navigationBarTitleDisplayMode(.large)
        case .mypage: MyPageScreen().navigationTitle(t("mypage")).navigationBarTitleDisplayMode(.large)
        }
    }

    /// 뒤로 버튼은 화살표만(`toolbarRole(.editor)` = RN `headerBackButtonDisplayMode: 'minimal'`).
    @ViewBuilder private func destination(_ route: StackRoute) -> some View {
        switch route {
        case .builds:
            BuildListScreen().navigationTitle(t("builds")).navigationBarTitleDisplayMode(.large).toolbarRole(.editor)
        case .build(let id, let saved):
            // 투명 헤더·휴지통·제목 페이드는 화면(I-22) 몫. 셸은 탭바만 덮는다.
            BuildDetailScreen(id: id, saved: saved).toolbarRole(.editor).toolbar(.hidden, for: .tabBar)
        case .data:
            DataManageScreen().navigationTitle(t("data")).navigationBarTitleDisplayMode(.inline).toolbarRole(.editor)
        }
    }
}

private extension View {
    /// 26 미만은 시스템 탭바 대신 CustomTabBar를 쓴다. push 된 화면마다 다시 숨겨야 한다.
    @ViewBuilder func hidesSystemTabBar() -> some View {
        if #available(iOS 26, *) { self } else { toolbar(.hidden, for: .tabBar) }
    }
}
