import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["changeTitle": "챔피언 변경", "search": "챔피언 검색 (초성 가능)", "empty": "결과 없음", "statTitle": "스탯", "close": "닫기"],
    en: ["changeTitle": "Change champion", "search": "Search champions", "empty": "No results", "statTitle": "Stats", "close": "Close"]
)

/// 화면을 나가지 않고 챔피언만 바꾸는 오버레이 (RN `champion-change-overlay.tsx`).
/// 라우트(챔피언 선택 모달)로 띄우지 않는다 — 돌아올 때 커스텀 화면이 다시 만들어지면 담은 것이 사라지고, 가로 잠금 위 모달은 회전이 풀린다.
/// 고르면 `onSelect(id)` → 화면이 `draft.championId = id`(담은 것은 유지).
struct ChampionChangeOverlay: View {
    let selectedId: String
    let onSelect: (String) -> Void
    let onClose: () -> Void

    static let columns = 8

    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @State private var query = ""

    var body: some View {
        let t = L.t(settings.locale)
        let data = store.data
        let locale = Locale(identifier: data.locale.rawValue)
        let filtered = data.champions
            .filter { matchName($0.name, query) }
            .sorted { $0.name.compare($1.name, locale: locale) == .orderedAscending }

        OverlaySheet(title: t("changeTitle"), closeLabel: t("close"), widthRatio: 1, headerGap: Spacing.two, onClose: onClose) {
            TextField("", text: $query, prompt: Text(t("search")).foregroundStyle(palette.text.tertiary))
                .font(.system(size: 14))
                .foregroundStyle(palette.text.primary)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .padding(.horizontal, Spacing.two)
                .frame(height: 36)
                .background(palette.surface.sunken, in: Radius.shape(Radius.md))
                .overlay(Radius.shape(Radius.md).strokeBorder(palette.border.subtle, lineWidth: 1))

            GeometryReader { geo in
                // 하한 32 — 시트가 좁아지면 칸이 음수로 뒤집힌다.
                let gap = Spacing.two
                let cell = max(32, ((geo.size.width - gap * CGFloat(Self.columns - 1)) / CGFloat(Self.columns)).rounded(.down))
                if filtered.isEmpty {
                    Text(t("empty")).rnText(.caption).foregroundStyle(palette.text.tertiary)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView(showsIndicators: false) {
                        LazyVGrid(columns: Array(repeating: GridItem(.fixed(cell), spacing: gap, alignment: .top), count: Self.columns),
                                  alignment: .leading, spacing: gap) {
                            ForEach(filtered) { champion in
                                championCell(champion, size: cell, url: data.cdn.championSquareURL(champion.imageKey))
                            }
                        }
                    }
                }
            }
        }
    }

    private func championCell(_ champion: Champion, size: CGFloat, url: URL) -> some View {
        let selected = champion.id == selectedId
        return Button { onSelect(champion.id) } label: {
            VStack(spacing: 2) {
                RemoteImage(url, size: size)
                    .clipShape(Radius.shape(Radius.md))
                    .overlay(Radius.shape(Radius.md).strokeBorder(selected ? palette.accent.default : palette.border.subtle, lineWidth: selected ? 2.5 : 1))
                Text(champion.name)
                    .rnText(size: 9, lineHeight: 11)
                    .foregroundStyle(selected ? palette.accent.default : palette.text.tertiary)
                    .lineLimit(1)
                    .frame(width: size)
            }
        }
        .buttonStyle(PressDim(opacity: 0.7))
    }
}

/// 챔피언 정보 + 담은 아이템 합산 스탯 (RN `champion-stat-overlay.tsx`). 표는 빌드 상세·아이템 선택과 같은 `ItemStatPanel`.
/// 스탯 표는 한 열이라 넓힐 이유가 없다 — 넓히면 항목명과 값이 양 끝으로 벌어져 눈이 멀리 튄다(폭 42%).
struct ChampionStatOverlay: View {
    let champion: Champion
    let items: [Item]
    let onClose: () -> Void

    static let iconSize: CGFloat = 38

    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let t = L.t(settings.locale)
        OverlaySheet(title: t("statTitle"), closeLabel: t("close"), widthRatio: 0.42, headerGap: 0, onClose: onClose) {
            HStack(spacing: Spacing.two) {
                RemoteImage(store.data.cdn.championSquareURL(champion.imageKey), size: Self.iconSize)
                    .clipShape(Radius.shape(Radius.md))
                    .overlay(Radius.shape(Radius.md).strokeBorder(palette.accent.default, lineWidth: 1.5))
                VStack(alignment: .leading, spacing: 1) {
                    Text(champion.name).rnText(.label).lineLimit(1)
                    // 스탯 표의 머리말이라 타이틀·역할을 한 줄로 합쳐 소개가 표보다 커 보이지 않게 한다.
                    Text(([champion.title] + champion.tags.map { championTagLabel($0, settings.locale) }).joined(separator: " · "))
                        .rnText(size: 10, lineHeight: 13)
                        .foregroundStyle(palette.text.tertiary)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.bottom, Spacing.two)
            .overlay(alignment: .bottom) { palette.border.subtle.frame(height: 1) }

            ScrollView(showsIndicators: false) {
                ItemStatPanel(baseStats: champion.stats, itemStats: items.map(\.stats))
                    .padding(.bottom, Spacing.four)
            }
        }
    }
}

/// 두 오버레이의 뼈대 — 배경을 누르면 닫히고, 글라스 시트를 화면 한가운데 띄운다.
/// 세로 안전 영역은 먹지 않는다(먹으면 홈 인디케이터만큼 시트가 위로 쏠린다). 가로만 노치를 피한다. 키보드도 시트를 밀지 않는다.
private struct OverlaySheet<Content: View>: View {
    let title: String
    let closeLabel: String
    /// 시트 폭(여백 뺀 영역 대비). 높이는 90%.
    let widthRatio: CGFloat
    /// 머리와 다음 줄 사이에 더 띄울 간격
    let headerGap: CGFloat
    let onClose: () -> Void
    @ViewBuilder let content: Content

    @Environment(\.palette) private var palette

    var body: some View {
        ZStack {
            palette.surface.overlay
                .ignoresSafeArea()
                .onTapGesture(perform: onClose)

            GeometryReader { geo in
                let area = CGSize(width: geo.size.width - Spacing.three * 2, height: geo.size.height - Spacing.three * 2)
                // 화면 위에 떠 있는 표면이라 단색이 아니라 글라스
                GlassSurface(cornerRadius: Radius.xl) {
                    VStack(alignment: .leading, spacing: Spacing.two) {
                        HStack {
                            Text(title).rnText(.label)
                            Spacer(minLength: 0)
                            Button(action: onClose) {
                                Text("✕").rnText(.label).contentShape(Rectangle().inset(by: -12))
                            }
                            .buttonStyle(PressDim(opacity: 1))
                            .accessibilityLabel(closeLabel)
                        }
                        .padding(.bottom, headerGap)
                        content
                    }
                    // 아래는 비운다 — 목록이 시트 끝까지 흘러야 스크롤 중 잘린 느낌이 안 난다.
                    .padding([.top, .horizontal], Spacing.three)
                    .frame(width: area.width * widthRatio, height: area.height * 0.9, alignment: .top)
                }
                .overlay(Radius.shape(Radius.xl).strokeBorder(palette.border.subtle, lineWidth: 1))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .ignoresSafeArea(.container, edges: .vertical)
            .ignoresSafeArea(.keyboard)
        }
    }
}
