import AugmentCore
import Foundation

// 라우트 계약 (app-shell §1·§2). 피처는 이 타입으로 Router를 부르고, 서로의 View를 모른다.

/// 하단 탭. `+`는 탭이 아니라 버튼이다(누르면 모드 선택 오버레이).
enum AppTab: Hashable, CaseIterable {
    case home, tierlist, mypage

    /// 분석 화면 이름 (§7, RN 라우트 문자열 그대로)
    var screenName: String {
        switch self {
        case .home: "/(tabs)/(home)"
        case .tierlist: "/(tabs)/(tierlist)"
        case .mypage: "/(tabs)/(mypage)"
        }
    }
}

/// 탭 스택에 push 하는 화면.
/// 빌드 상세는 RN에선 루트 스택(탭바를 덮음)이지만, 여기선 현재 탭 스택에 쌓고 탭바를 숨긴다 — 탭 상태가 그대로 남는 같은 결과.
enum StackRoute: Hashable {
    case builds
    case build(id: String, saved: Bool = false)
    case data

    var screenName: String {
        switch self {
        case .builds: "/(tabs)/(home)/builds"
        case .build: "/build/[id]"
        case .data: "/(tabs)/(mypage)/data"
        }
    }
}

/// `+` 오버레이가 띄우는 진입점(RN `LaunchMode`). 저장 모드(`GameMode`)가 아니라 목적지 화면이다.
enum LaunchMode: String, CaseIterable {
    case aram, custom

    /// 모르는 값은 칼바람 (RN `parseLaunchMode`)
    init(param: String?) { self = param.flatMap(Self.init(rawValue:)) ?? .aram }
}

struct AramParams {
    var championId: String
    var mode: GameMode = .aram
    /// 홈 시작 카드에서 고른 헤드라이너. nil이면 판마다 무작위.
    var headliner: HeadlinerId?
}

struct ItemSelectParams {
    /// `transmuted` 포함
    var picked: [Augment]
    var headliner: BuildHeadliner?
    var championId: String
    var mode: GameMode = .aram
}

/// 가로 풀스크린 드래프트 (DraftPresenter가 띄운다)
enum Draft {
    case aram(AramParams)
    /// 모르는 ID면 champion = nil 상태로 연다(유효한 상태)
    case custom(championId: String)
}

/// 시트는 한 번에 하나. id가 종류별로 고정이라 같은 종류를 다시 띄워도 두 겹 쌓이지 않는다(RN `dangerouslySingular`).
enum Sheet: Identifiable {
    case championSelect(mode: LaunchMode, headliner: HeadlinerId?)
    /// 챔피언 **숫자 key**(id 아님)
    case tierlistChampion(key: String)

    var id: String {
        switch self {
        case .championSelect: "champion-select"
        case .tierlistChampion: "tierlist-champion"
        }
    }

    var screenName: String {
        switch self {
        case .championSelect: "/select-champion-modal"
        case .tierlistChampion: "/tierlist-champion-modal"
        }
    }
}

/// 전 라우트 — 딥링크(`augmentlab://`) 한 개가 이것 하나로 풀린다. `Router.open`이 실행한다.
enum Route {
    case tab(AppTab)
    case push(StackRoute)
    case sheet(Sheet)
    case modeSelect
    case draft(Draft)
    case items(ItemSelectParams)

    /// RN 경로 그대로 — 경로가 곧 화면이다(Expo Router처럼 `(tabs)` 같은 그룹은 건너뛴다).
    /// 모르는 경로면 nil. 파라미터가 깨지면 RN과 같은 폴백(picked → [], headliner → nil, mode → aram).
    init?(url: URL) {
        guard let scheme = url.scheme?.lowercased(), scheme == "augmentlab" || scheme == "com.augmentlab" else { return nil }
        // `augmentlab://build/abc`는 host가 첫 칸이다. `augmentlab:///build/abc`도 받는다.
        let path = ([url.host ?? ""] + url.pathComponents)
            .filter { !$0.isEmpty && $0 != "/" && !($0.hasPrefix("(") && $0.hasSuffix(")")) }
        var q: [String: String] = [:]
        for item in URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? [] where q[item.name] == nil {
            q[item.name] = item.value
        }
        let mode = q["mode"].flatMap(GameMode.init(rawValue:)) ?? .aram
        let headliner = q["headliner"].flatMap(HeadlinerId.init(rawValue:))

        switch (path.first ?? "", path.count) {
        case ("", _): self = .tab(.home)
        case ("builds", 1): self = .push(.builds)
        case ("data", 1): self = .push(.data)
        case ("build", 2): self = .push(.build(id: path[1], saved: q["saved"] == "1"))
        case ("mode-select", 1): self = .modeSelect
        case ("select-champion-modal", 1):
            self = .sheet(.championSelect(mode: LaunchMode(param: q["mode"]), headliner: headliner))
        case ("tierlist-champion-modal", 1):
            guard let key = q["key"], !key.isEmpty else { return nil }
            self = .sheet(.tierlistChampion(key: key))
        case ("aram", 1):
            self = .draft(.aram(AramParams(championId: q["championId"] ?? "", mode: mode, headliner: headliner)))
        case ("custom", 1):
            self = .draft(.custom(championId: q["championId"] ?? ""))
        case ("aram-items", 1):
            let picked = q["picked"].flatMap { try? JSONDecoder().decode([Augment].self, from: Data($0.utf8)) } ?? []
            let json = q["headliner"].flatMap { try? JSONDecoder().decode(JSONValue.self, from: Data($0.utf8)) }
            self = .items(ItemSelectParams(picked: picked, headliner: BuildHeadliner(json: json), championId: q["championId"] ?? "", mode: mode))
        default: return nil
        }
    }
}

#if DEBUG
extension Route {
    /// URL 파싱 자체 점검 — 디버그 실행 때 한 번 돈다(앱 타깃엔 테스트 타깃이 없다).
    static func selfCheck() {
        func parse(_ s: String) -> Route? { URL(string: s).flatMap(Route.init(url:)) }
        guard case .push(.build("abc", false))? = parse("augmentlab://build/abc") else { return assertionFailure("build") }
        guard case .push(.build("abc", true))? = parse("augmentlab:///build/abc?saved=1") else { return assertionFailure("build saved") }
        guard case .push(.builds)? = parse("augmentlab://(tabs)/(home)/builds") else { return assertionFailure("group") }
        guard case .sheet(.championSelect(.custom, nil))? = parse("augmentlab://select-champion-modal?mode=custom&headliner=nope") else { return assertionFailure("champion") }
        guard case .sheet(.championSelect(.aram, .kda))? = parse("augmentlab://select-champion-modal?mode=??&headliner=kda") else { return assertionFailure("champion fallback") }
        guard case .items(let p)? = parse("augmentlab://aram-items?picked=%5Bbroken&headliner=%7B%7D&championId=Ahri"),
              p.picked.isEmpty, p.headliner == nil, p.championId == "Ahri" else { return assertionFailure("items fallback") }
        guard case .items(let h)? = parse(#"augmentlab://aram-items?headliner={"id":"pentakill","skills":["q"],"stickers":[]}"#.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!),
              h.headliner == BuildHeadliner(id: "pentakill", skills: [.q]) else { return assertionFailure("items headliner") }
        guard case .tab(.home)? = parse("augmentlab://"), parse("augmentlab://nope") == nil, parse("https://build/abc") == nil,
              parse("augmentlab://tierlist-champion-modal") == nil else { return assertionFailure("misc") }
    }
}
#endif
