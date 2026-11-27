import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["searchPlaceholder": "챔피언 검색 (초성 가능)", "empty": "검색 결과가 없습니다", "pickShort": "픽",
         "source": "aram.gg 집계 · 패치 {patch} · {date} 기준\n티어는 aram.gg 자체 등급(승률·픽률 종합)을 그대로 씁니다. 챔피언 승률·픽률은 칼바람 광란(아수라장) 기준 중국(텐센트) 서버 통계, 증강 승률은 이용자 클라이언트가 업로드한 표본입니다. 아이템은 일반 칼바람(ARAM) 통계입니다. 표본 편향이 있을 수 있습니다."],
    en: ["searchPlaceholder": "Search champions", "empty": "No champions found", "pickShort": "Pick",
         "source": "Data by aram.gg · Patch {patch} · as of {date}\nTiers are aram.gg's own grades (win rate + pick rate combined). Champion win/pick rates are from ARAM Mayhem on CN (Tencent) servers; augment win rates come from user-uploaded samples. Item stats are from standard ARAM. Sampling bias may apply."]
)

/// 칼바람 챔피언 티어표 (tierlist.md §1). 큰 제목·검색창(스크롤 시 숨김) + S~D 배너 + 2열 격자.
/// 앱은 티어를 계산하지 않는다 — 검색은 보여 줄 챔피언만 고르고 티어는 그대로다.
struct TierlistScreen: View {
    @Environment(Router.self) private var router
    @Environment(AppSettings.self) private var settings
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette
    @State private var query = ""
    @State private var search = TierlistSearch()

    /// 격자·배너 공통 좌우 인셋
    private static let inset = Spacing.three

    var body: some View {
        let t = L.t(settings.locale)
        let data = store.data
        let sections = Tierlist.sections(data.tierlist.aram) { row in
            data.championsByKey[row.key].map { matchName($0.name, query) } ?? false
        }
        ScrollView {
            LazyVStack(spacing: 0) {
                if sections.isEmpty {
                    Text(t("empty"))
                        .rnText(.body)
                        .foregroundStyle(palette.text.tertiary)
                        .multilineTextAlignment(.center)
                        .padding(.top, Spacing.five)
                }
                // 띠 하나 = LazyVStack 자식 하나(tier로 식별). 띠와 행을 형제로 펼치고 행을 순번(\.offset)으로 식별하면
                // 검색으로 화면 밖에 있던 띠가 들어올 때 행이 비어 나왔다(fd: "te" → B·D 띠만 있고 칸이 빔).
                ForEach(sections, id: \.tier) { section in
                    VStack(spacing: 0) {
                        TierMark(section.tier, size: .heading, cornerRadius: Radius.full)
                            .frame(height: Spacing.five)
                            .background(palette.surface.raised, in: Capsule())
                            .padding(.horizontal, Self.inset)
                            .padding(.top, Spacing.three)
                            .padding(.bottom, Spacing.two)
                        ForEach(Array(section.rows.enumerated()), id: \.offset) { _, row in
                            HStack(spacing: Spacing.two) {
                                ForEach(row, id: \.key) { entry in
                                    if let champion = data.championsByKey[entry.key] {
                                        TierlistChampionCell(champion: champion, row: entry, cdn: data.cdn, pickShort: t("pickShort")) {
                                            router.presentTierlistChampion(entry.key)
                                        }
                                    }
                                }
                                // 덜 찬 마지막 행의 빈 칸 — 없으면 마지막 카드가 폭 전체로 늘어난다
                                ForEach(0..<(Tierlist.columns - row.count), id: \.self) { _ in
                                    Color.clear.frame(maxWidth: .infinity, maxHeight: 0)
                                }
                            }
                            .padding(.horizontal, Self.inset)
                            .padding(.bottom, Spacing.two)
                        }
                    }
                }
                // 마지막 행 paddingBottom(8)과 합쳐 16 — 티어 구간 사이(배너 위 여백)와 같은 간격
                Text(Tierlist.formatSource(t("source"), data.tierlist))
                    .rnText(.caption)
                    .foregroundStyle(palette.text.tertiary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, Self.inset)
                    .padding(.top, Spacing.two)
            }
            .padding(.bottom, Spacing.five)
            .background(
                SearchControllerAttacher(search: search, placeholder: t("searchPlaceholder"),
                                         tint: UIColor(palette.accent.default), text: UIColor(palette.text.primary))
                    .allowsHitTesting(false)
            )
        }
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .modifier(CancelEmptySearchOnDrag(query: query) { search.controller.isActive = false })
        .background(palette.surface.base)
        .onAppear { search.onChange = { query = $0 } }
    }
}

/// 검색창은 SwiftUI `.searchable` 대신 UIKit `UISearchController`를 내비 아이템에 직접 붙인다(RN react-native-screens와 같은 방식).
/// SwiftUI 서랍은 처음에 펼쳐져 목록이 ≈60pt 내려갔고, 오프셋으로 접는 방식은 큰 제목 레이아웃과 계속 어긋났다(I-41-02 진행 기록).
/// UIKit 기본값(`hidesSearchBarWhenScrolling = true`)이면 처음엔 접혀 있고 끌어내려야 나온다 = RN `hideWhenScrolling: true`.
@MainActor
final class TierlistSearch: NSObject, UISearchResultsUpdating {
    let controller = UISearchController(searchResultsController: nil)
    var onChange: (String) -> Void = { _ in }

    override init() {
        super.init()
        controller.obscuresBackgroundDuringPresentation = false
        controller.hidesNavigationBarDuringPresentation = true
        controller.searchResultsUpdater = self
    }

    func updateSearchResults(for searchController: UISearchController) {
        onChange(searchController.searchBar.text ?? "")
    }
}

/// 이 화면을 띄운 뷰컨트롤러(내비 스택의 한 칸)를 찾아 `navigationItem.searchController`를 붙인다.
/// 첫 레이아웃 전에 붙이도록 superview에 들어오는 즉시 시도하고, 창에 들어올 때 한 번 더 확인한다.
// ponytail: UIKit 계층을 더듬는다. SwiftUI `.searchable`에 "처음엔 접힘" 옵션이 생기면 이 파일의 UIKit 부분을 지우고 되돌릴 것.
private struct SearchControllerAttacher: UIViewRepresentable {
    let search: TierlistSearch
    let placeholder: String
    let tint: UIColor
    let text: UIColor

    func makeUIView(context: Context) -> Probe { Probe(search: search) }

    func updateUIView(_ probe: Probe, context: Context) {
        let bar = search.controller.searchBar
        bar.placeholder = placeholder
        bar.tintColor = tint
        bar.searchTextField.textColor = text
        probe.attach()
    }

    final class Probe: UIView {
        private let search: TierlistSearch
        init(search: TierlistSearch) { self.search = search; super.init(frame: .zero) }
        required init?(coder: NSCoder) { nil }

        override func didMoveToSuperview() { super.didMoveToSuperview(); attach() }
        override func didMoveToWindow() { super.didMoveToWindow(); attach() }

        func attach() {
            guard let vc = stackController(), vc.navigationItem.searchController !== search.controller else { return }
            vc.navigationItem.searchController = search.controller
            vc.navigationItem.hidesSearchBarWhenScrolling = true
            vc.navigationItem.preferredSearchBarPlacement = .stacked
            vc.definesPresentationContext = true
        }

        /// 내비게이션 컨트롤러 스택에 직접 올라 있는 뷰컨트롤러 — 내비 바가 그 navigationItem을 그린다
        private func stackController() -> UIViewController? {
            var r: UIResponder? = self
            while let cur = r {
                if let vc = cur as? UIViewController, let nav = vc.navigationController, nav.viewControllers.contains(vc) { return vc }
                r = cur.next
            }
            return nil
        }
    }
}

/// 티어표 한 칸 — 아이콘(테두리는 티어색) + 이름 + 승률(accent) · 픽률. 누르면 상세 모달.
private struct TierlistChampionCell: View {
    let champion: Champion
    let row: TierRow
    let cdn: CDN
    let pickShort: String
    let onTap: () -> Void

    @Environment(\.palette) private var palette

    /// 셀 안에 이름·승률 두 줄과 높이를 맞춘다
    private static let icon: CGFloat = 46
    private static let border: CGFloat = 1.5

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: Spacing.two) {
                RemoteImage(cdn.championSquareURL(champion.imageKey), size: Self.icon)
                    .clipShape(Radius.shape(Radius.md))
                    .overlay(Radius.shape(Radius.md).strokeBorder(Color(token: TierColors.hex(row.tier, palette.scheme)), lineWidth: Self.border))
                VStack(alignment: .leading, spacing: Spacing.half) {
                    Text(champion.name)
                        .rnText(.label)
                        .lineLimit(1)
                        .foregroundStyle(palette.text.primary)
                    (Text(Tierlist.pct(row.score)).foregroundStyle(palette.accent.default)
                        + Text(" · \(pickShort) \(Tierlist.pct(row.sub))"))
                        .rnText(.caption)
                        .lineLimit(1)
                        .foregroundStyle(palette.text.tertiary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(Spacing.two)
            .background(palette.surface.raised, in: Radius.shape(Radius.lg))
            .contentShape(Rectangle())
        }
        .buttonStyle(NoFeedbackButtonStyle())
    }
}

/// 검색이 켜진(취소 버튼) 채로 스크롤하면 작은 제목이 안 뜬다 → 드래그를 시작하면 빈 검색은 끈다.
/// 검색어가 있으면 결과를 스크롤할 수 있게 키보드만 내린다(`scrollDismissesKeyboard`). launch.md §2와 같은 동작.
// ponytail: 스크롤 시작 신호(onScrollPhaseChange)가 iOS 18부터라 17은 키보드만 내린다. 17에서도 필요하면 UIScrollView 델리게이트로.
private struct CancelEmptySearchOnDrag: ViewModifier {
    let query: String
    let dismissSearch: () -> Void

    func body(content: Content) -> some View {
        if #available(iOS 18, *) {
            content.onScrollPhaseChange { _, phase in
                if phase == .interacting, query.isEmpty { dismissSearch() }
            }
        } else {
            content
        }
    }
}
