import AugmentCore
import Observation

/// 화면 이동의 유일한 입구 (app-shell §3). 루트에서 하나 만들어 `.environment(router)`로 넘긴다.
///
///     @Environment(Router.self) private var router
///     router.push(.build(id: build.id))
///     router.presentChampionSelect(.aram, headliner: .kda)
@MainActor @Observable
final class Router {
    var tab: AppTab = .home
    /// 탭마다 자기 스택
    var paths: [AppTab: [StackRoute]] = [:]
    var sheet: Sheet?
    var modeSelectShown = false

    /// 드래프트 표시(I-06b). 루트 환경을 다시 넣어야 해서 설정을 함께 들고 있다.
    @ObservationIgnored let settings: AppSettings
    @ObservationIgnored private(set) lazy var drafts = DraftPresenter(router: self)

    init(settings: AppSettings) { self.settings = settings }

    /// 현재 탭 스택에 쌓는다.
    func push(_ route: StackRoute) { paths[tab, default: []].append(route) }

    /// 모드 선택 오버레이에서 부르면 오버레이를 걷고 시트를 띄운다(RN `router.replace`).
    func presentChampionSelect(_ mode: LaunchMode, headliner: HeadlinerId? = nil) {
        modeSelectShown = false
        sheet = .championSelect(mode: mode, headliner: headliner)
    }

    func presentTierlistChampion(_ key: String) { sheet = .tierlistChampion(key: key) }

    func showModeSelect() { modeSelectShown = true }

    /// 챔피언 시트 위에 가로 풀스크린으로 띄운다.
    func startDraft(_ draft: Draft) { drafts.start(draft) }

    /// 칼바람 위에 쌓는다 — 갈아 끼우면 회전이 뒤집힌다.
    func pushItems(_ params: ItemSelectParams) { drafts.pushItems(params) }

    func selectTab(_ tab: AppTab) { self.tab = tab }

    /// 맨 위 하나를 닫는다: 오버레이 → 시트 → 현재 탭 스택. 드래프트는 `closeDraft`로만 닫는다.
    func back() {
        if modeSelectShown {
            modeSelectShown = false
        } else if sheet != nil {
            sheet = nil
        } else if paths[tab]?.isEmpty == false {
            paths[tab]?.removeLast()
        }
    }

    /// 드래프트 닫기 계약 — 저장(`openBuild`)·나가기(`confirmExit`)
    var closeDraft: CloseDraft { CloseDraft(router: self) }

    /// 딥링크 실행. 탭 화면(`builds`·`data`)은 그 탭으로 가서 연다.
    /// 티어리스트 챔피언 모달은 티어리스트 탭 위에 띄운다 — 콜드 스타트로 열고 닫으면 티어리스트가 보인다(§2).
    func open(_ route: Route) {
        switch route {
        case .tab(let tab): selectTab(tab)
        case .push(.builds): tab = .home; paths[.home] = [.builds]
        case .push(.data): tab = .mypage; paths[.mypage] = [.data]
        case .push(let r): push(r)
        case .sheet(let s):
            if case .tierlistChampion = s { tab = .tierlist }
            sheet = s
        case .modeSelect: showModeSelect()
        case .draft(let d): startDraft(d)
        case .items(let p): pushItems(p)
        }
    }

    /// 지금 보이는 화면의 분석 이름 (§7). 바뀔 때마다 셸이 `Analytics.trackScreen`을 부른다.
    var screenName: String {
        if let draft = drafts.screenName { return draft }
        if modeSelectShown { return "/mode-select" }
        if let sheet { return sheet.screenName }
        return paths[tab]?.last?.screenName ?? tab.screenName
    }

    /// 빌드 상세는 탭바를 덮는다.
    var hidesTabBar: Bool {
        if case .build? = paths[tab]?.last { true } else { false }
    }
}
