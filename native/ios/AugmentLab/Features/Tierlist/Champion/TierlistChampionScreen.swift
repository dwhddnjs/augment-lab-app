import AugmentCore
import SwiftUI
import UIKit

private let L = L10n(
    ko: ["screenTitle": "챔피언 정보", "close": "닫기", "notFound": "이 챔피언의 티어 정보가 없습니다", "winRate": "승률", "pickRate": "픽률"],
    en: ["screenTitle": "Champion Info", "close": "Close", "notFound": "No tier data for this champion", "winRate": "Win", "pickRate": "Pick"]
)

/// 티어리스트 챔피언 상세 모달 (tierlist.md §2). 챔피언 지표 + 어울리는 증강(희귀도 3그룹) + 아이템(빌드 순서·상황별 + 스펠).
/// `key` = 챔피언 숫자 key. 다른 챔피언으로 다시 열리면 새로 만든다(펼침 개수·스크롤 위치가 넘어가지 않게).
/// 닫기는 `router.back()` — 딥링크로 열렸으면 Router가 이미 티어리스트 탭을 깔아 두었다.
struct TierlistChampionScreen: View {
    let key: String

    @Environment(Router.self) private var router
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    private static let closeIcon: CGFloat = 18
    private static let largeTitleSize: CGFloat = 28

    var body: some View {
        let t = L.t(settings.locale)
        NavigationStack {
            ChampionDetail(championKey: key)
                .id(key)
                // 챔피언 이름은 본문 헤더에 이미 있다 — 큰 제목까지 이름이면 두 번 나온다
                .navigationTitle(t("screenTitle"))
                .navigationBarTitleDisplayMode(.large)
                .background(LargeTitleSize(size: Self.largeTitleSize))
                .toolbar {
                    // 챔피언을 못 찾아도 닫기는 있어야 모달을 빠져나갈 수 있다
                    ToolbarItem(placement: .topBarLeading) {
                        Button { router.back() } label: {
                            Image(systemName: "xmark").resizable().scaledToFit()
                                .frame(width: Self.closeIcon, height: Self.closeIcon)
                                .foregroundStyle(palette.text.secondary)
                                .hitSlop(Spacing.double)
                        }
                        .accessibilityLabel(t("close"))
                    }
                }
        }
        .tint(palette.accent.default)
    }
}

private struct ChampionDetail: View {
    let championKey: String

    @Environment(AppSettings.self) private var settings
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    /// 본문 하단 여백 — 마지막 아이템 줄이 홈 인디케이터에 붙지 않고 넉넉히 떠 있게
    private static let bottomInset: CGFloat = 120
    private static let top = "top"

    var body: some View {
        let t = L.t(settings.locale)
        let data = store.data
        let champion = data.championsByKey[championKey]
        let row = Tierlist.findRow(data.tierlist.aram, key: championKey)

        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.two) {
                    Color.clear.frame(height: 0).id(Self.top)
                    if let champion, let row {
                        TierlistChampionHeader(champion: champion, row: row, t: t)
                        // 펼칠 때 증강이 버튼 자리에서 쏟아지면 어지러워 맨 위로 올린다
                        TierlistAugmentSection(groups: Tierlist.augmentGroups(row, data)) {
                            withAnimation { proxy.scrollTo(Self.top, anchor: .top) }
                        }
                        TierlistItemSection(row: row)
                    } else {
                        Text(t("notFound"))
                            .rnText(.body)
                            .foregroundStyle(palette.text.tertiary)
                            .frame(maxWidth: .infinity)
                            .multilineTextAlignment(.center)
                            .padding(.top, Spacing.five)
                    }
                }
                .padding(Spacing.three)
                .padding(.bottom, Self.bottomInset - Spacing.three)
            }
            .background(palette.surface.base)
        }
    }
}

/// 맨 위 — 초상화(테두리는 티어색) + 티어 배지·이름 + 역할 + 승률·픽률
private struct TierlistChampionHeader: View {
    let champion: Champion
    let row: TierRow
    let t: (String) -> String

    @Environment(AppSettings.self) private var settings
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette
    /// 초상화는 옆 글 세 줄 높이에 맞춘다(RN alignSelf stretch + aspectRatio 1).
    /// 줄높이 heading 28 + caption 16 + label 20 — 글자 크기 설정을 따라 같이 커진다.
    @ScaledMetric(relativeTo: .body) private var textLines: CGFloat = 64

    /// heading(20/28) 한 줄 안에 들어가는 티어 배지 한 변
    private static let tierBadge: CGFloat = 26
    private static let border: CGFloat = 1.5

    var body: some View {
        let side = textLines + Spacing.one * 2
        let tierColor = Color(token: TierColors.hex(row.tier, palette.scheme))
        HStack(spacing: Spacing.three) {
            RemoteImage(store.data.cdn.championSquareURL(champion.imageKey), size: side)
                .clipShape(Radius.shape(Radius.lg))
                .overlay(Radius.shape(Radius.lg).strokeBorder(tierColor, lineWidth: Self.border))
            VStack(alignment: .leading, spacing: Spacing.one) {
                HStack(spacing: Spacing.two) {
                    // 티어리스트 배너와 같은 결 — 티어색을 좌우로 흘리고 글자는 흰색
                    TierMark(row.tier, size: .label, cornerRadius: Radius.md)
                        .frame(width: Self.tierBadge, height: Self.tierBadge)
                    Text(champion.name).rnText(.heading).foregroundStyle(palette.text.primary)
                }
                Text(champion.tags.map { championTagLabel($0, settings.locale) }.joined(separator: " · "))
                    .rnText(.caption)
                    .foregroundStyle(palette.text.secondary)
                (Text("\(t("winRate")) \(Tierlist.pct(row.score))").foregroundStyle(palette.accent.default)
                    + Text(" · \(t("pickRate")) \(Tierlist.pct(row.sub))").foregroundStyle(palette.text.secondary))
                    .rnText(.label)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// 이 화면만 큰 제목 28 (RN `ModalLargeTitleStyle`). SwiftUI엔 화면별 큰 제목 크기 API가 없어 navigationItem 외형을 바꾼다.
/// I-23 `ChampionSelectScreen`과 같은 코드 — 승격 후보.
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
