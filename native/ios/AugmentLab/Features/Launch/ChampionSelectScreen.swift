import AugmentCore
import SDWebImageSwiftUI
import SwiftUI
import UIKit

private let L = L10n(
    ko: ["title": "챔피언 선택", "searchPlaceholder": "챔피언 검색 (초성 가능)", "start": "시작하기", "cancel": "취소", "all": "전체"],
    en: ["title": "Select Champion", "searchPlaceholder": "Search champions", "start": "Start", "cancel": "Cancel", "all": "All"]
)

/// 챔피언 선택 시트 (launch.md §2). 큰 제목(28) + 시스템 검색창, 왼쪽 X · 오른쪽 ✓.
/// 시작하면 시트를 교체하지 않고 **그 위에** 드래프트를 띄운다 — 나가기·저장 때 시트까지 한꺼번에 닫힌다(CloseDraft).
struct ChampionSelectScreen: View {
    let mode: LaunchMode
    /// 홈 시작 카드에서 고른 헤드라이너. 여기선 해석하지 않고 드래프트로 그대로 넘긴다.
    let headliner: HeadlinerId?

    @Environment(Router.self) private var router
    @Environment(AppSettings.self) private var settings
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette
    @State private var selectedId: String?
    @State private var selectedTag: String?
    @State private var query = ""
    /// 드래프트가 뜨는 동안 ✓가 계속 눌린다 — 두 번 나가면 드래프트가 겹쳐 뜬다
    @State private var starting = false

    private static let headerIcon: CGFloat = 22
    private static let disabledOpacity = 0.4
    private static let largeTitleSize: CGFloat = 28

    var body: some View {
        let t = L.t(settings.locale)
        NavigationStack {
            ChampionGrid(champions: listData, cdn: store.data.cdn, query: query,
                         selectedId: $selectedId, selectedTag: $selectedTag)
                .navigationTitle(t("title"))
                .navigationBarTitleDisplayMode(.large)
                .background(LargeTitleSize(size: Self.largeTitleSize))
                .searchable(text: $query, placement: Self.searchPlacement, prompt: t("searchPlaceholder"))
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button { router.back() } label: { headerIcon("xmark", palette.text.secondary) }
                            .accessibilityLabel(t("cancel"))
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button(action: start) {
                            headerIcon("checkmark", selectedId != nil ? palette.accent.default : palette.text.disabled)
                        }
                        .disabled(selectedId == nil)
                        .opacity(selectedId != nil ? 1 : Self.disabledOpacity)
                        .accessibilityLabel(t("start"))
                    }
                }
        }
        .tint(palette.accent.default)
        // 첫 진입에 챔피언 아이콘·역할 아이콘을 디스크 캐시에 받아 둔다(첫 설치 때 검은 박스 깜빡임 방지)
        .task {
            let cdn = store.data.cdn
            let urls = store.data.champions.map { cdn.championSquareURL($0.imageKey) } + championTags.compactMap(CDN.championClassIconURL)
            SDWebImagePrefetcher.shared.prefetchURLs(urls)
        }
    }

    /// iOS 26+는 RN(react-native-screens)처럼 아래에 떠 있는 글라스 막대 — 키보드와 함께 올라온다.
    /// 그 아래는 RN도 제목 밑 서랍이다.
    private static var searchPlacement: SearchFieldPlacement {
        if #available(iOS 26, *) { .toolbar } else { .navigationBarDrawer(displayMode: .automatic) }
    }

    private var listData: [Champion] {
        let locale = Locale(identifier: settings.locale.rawValue)
        return store.data.champions
            .filter { selectedTag == nil || $0.tags.contains(selectedTag!) }
            .filter { matchName($0.name, query) }
            .sorted { $0.name.compare($1.name, locale: locale) == .orderedAscending }
    }

    private func start() {
        guard let championId = selectedId, !starting else { return }
        starting = true
        switch mode {
        case .aram: router.startDraft(.aram(AramParams(championId: championId, mode: .aram, headliner: headliner)))
        // 커스텀은 뽑기가 없어 championId만 나른다
        case .custom: router.startDraft(.custom(championId: championId))
        }
    }

    private func headerIcon(_ name: String, _ color: Color) -> some View {
        Image(systemName: name)
            .resizable()
            .scaledToFit()
            .frame(width: Self.headerIcon, height: Self.headerIcon)
            .foregroundStyle(color)
    }
}

/// 역할 칩(리스트 헤더) + 4열 그리드. 검색 환경(`dismissSearch`)을 읽으려고 `.searchable` 아래 뷰로 뗐다.
private struct ChampionGrid: View {
    let champions: [Champion]
    let cdn: CDN
    let query: String
    @Binding var selectedId: String?
    @Binding var selectedTag: String?

    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @Environment(\.dismissSearch) private var dismissSearch

    private static let chipIcon: CGFloat = 24
    private static let chipPadding: CGFloat = 6
    private static let border: CGFloat = 1.5, selectedBorder: CGFloat = 2.5
    private static let columns = Array(repeating: GridItem(.flexible(), spacing: 0), count: 4)

    var body: some View {
        ScrollView {
            // 필터는 리스트 헤더로 함께 스크롤된다(고정 안 함)
            HStack(spacing: Spacing.two) {
                chip(active: selectedTag == nil, label: L.t(settings.locale)("all"), tap: { selectedTag = nil }) {
                    Image(systemName: "square.grid.2x2.fill").resizable().scaledToFit()
                }
                ForEach(championTags, id: \.self) { tag in
                    // 같은 칩을 다시 누르면 필터가 풀린다
                    chip(active: selectedTag == tag, label: championTagLabel(tag, settings.locale), tap: { selectedTag = selectedTag == tag ? nil : tag }) {
                        WebImage(url: CDN.championClassIconURL(tag)) { $0.resizable().renderingMode(.template).scaledToFit() } placeholder: { Color.clear }
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, Spacing.three + Spacing.one)
            .padding(.vertical, Spacing.two)

            LazyVGrid(columns: Self.columns, spacing: Spacing.two) {
                ForEach(champions) { cell($0) }
            }
            .padding(.horizontal, Spacing.three + Spacing.one)
            .padding(.bottom, Spacing.three)
        }
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .modifier(CancelEmptySearchOnDrag(query: query, dismissSearch: dismissSearch))
        .background(palette.surface.base)
    }

    /// `label`: VoiceOver 이름 — 없으면 SF 심볼 이름("격자 2x2")이나 빈 이름으로 읽힌다(I-41 검수)
    private func chip(active: Bool, label: String, tap: @escaping () -> Void, @ViewBuilder icon: () -> some View) -> some View {
        Button(action: tap) {
            icon()
                .frame(width: Self.chipIcon, height: Self.chipIcon)
                .foregroundStyle(active ? palette.accent.default : palette.text.secondary)
                .padding(Self.chipPadding)
                .background(active ? palette.accent.subtle : .clear, in: Radius.shape(Radius.md))
        }
        .buttonStyle(NoFeedbackButtonStyle())
        .accessibilityLabel(label)
        .accessibilityAddTraits(active ? .isSelected : [])
    }

    private func cell(_ champion: Champion) -> some View {
        let selected = selectedId == champion.id
        return Button { selectedId = selected ? nil : champion.id } label: {
            VStack(spacing: Spacing.one) {
                RemoteImage(cdn.championSquareURL(champion.imageKey))
                    .aspectRatio(1, contentMode: .fit)
                    .clipShape(Radius.shape(Radius.md))
                    .overlay(Radius.shape(Radius.md).strokeBorder(
                        selected ? palette.accent.default : palette.border.default,
                        lineWidth: selected ? Self.selectedBorder : Self.border))
                Text(champion.name)
                    .rnText(.label)
                    .lineLimit(1)
                    .foregroundStyle(selected ? palette.accent.default : palette.text.secondary)
            }
            .padding(Spacing.one)
            .contentShape(Rectangle())
        }
        .buttonStyle(NoFeedbackButtonStyle())
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

/// 검색이 켜진(취소 버튼) 채로 스크롤하면 작은 제목이 안 뜬다 → 드래그를 시작하면 검색을 끈다.
/// 검색어가 있으면 결과를 스크롤할 수 있게 키보드만 내린다(`scrollDismissesKeyboard`).
// ponytail: 스크롤 시작 신호(onScrollPhaseChange)가 iOS 18부터라 17은 키보드만 내린다. 17에서도 필요하면 UIScrollView 델리게이트로.
private struct CancelEmptySearchOnDrag: ViewModifier {
    let query: String
    let dismissSearch: DismissSearchAction

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

/// 이 화면만 큰 제목 28 (RN `ModalLargeTitleStyle`). SwiftUI엔 화면별 큰 제목 크기 API가 없어 navigationItem 외형을 바꾼다.
private struct LargeTitleSize: UIViewControllerRepresentable {
    let size: CGFloat

    func makeUIViewController(context: Context) -> Controller { Controller(size: size) }
    func updateUIViewController(_ controller: Controller, context: Context) {}

    final class Controller: UIViewController {
        let size: CGFloat
        init(size: CGFloat) { self.size = size; super.init(nibName: nil, bundle: nil) }
        required init?(coder: NSCoder) { fatalError() }

        override func viewWillAppear(_ animated: Bool) {
            super.viewWillAppear(animated)
            guard let item = parent?.navigationItem, let bar = navigationController?.navigationBar else { return }
            let font = UIFont.systemFont(ofSize: size, weight: .bold)
            item.standardAppearance = resized(bar.standardAppearance, font)
            item.scrollEdgeAppearance = resized(bar.scrollEdgeAppearance ?? bar.standardAppearance, font)
        }

        private func resized(_ base: UINavigationBarAppearance, _ font: UIFont) -> UINavigationBarAppearance {
            let a = base.copy()
            a.largeTitleTextAttributes[.font] = font
            return a
        }
    }
}

