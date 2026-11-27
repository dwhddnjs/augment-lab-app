import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["items": "아이템", "buildOrder": "빌드 순서", "situational": "상황별 아이템", "spellLabel": "추천 스펠, 픽률 {pick}"],
    en: ["items": "Items", "buildOrder": "Build Order", "situational": "Situational", "spellLabel": "Recommended spells, pick rate {pick}"]
)

/// 아이템 — 제목(오른쪽 끝에 추천 스펠) + 빌드 순서 + 상황별 아이템.
/// 이름·아이콘은 앱 아이템 데이터가 아니라 `tierlist-items`에서 온다(앱 데이터에 없는 id가 섞여 있다).
struct TierlistItemSection: View {
    let row: TierRow

    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let t = L.t(settings.locale)
        // 격자·스펠은 비면 스스로 숨는다 — 셋 다 비면 제목만 남지 않게 섹션째 뺀다
        if !row.build.isEmpty || !row.situational.isEmpty || !row.spells.isEmpty {
            HStack {
                Text(t("items")).rnText(.heading).foregroundStyle(palette.text.primary)
                Spacer()
                SpellPill(spells: row.spells, pick: row.spellPick, label: t("spellLabel"))
            }
            // 증강 섹션(버튼)과 한 단계 더 띄워 두 섹션이 갈려 보이게
            .padding(.top, Spacing.four)
            ItemGrid(label: t("buildOrder"), ids: row.build)
            ItemGrid(label: t("situational"), ids: row.situational)
        }
    }
}

/// 아이템 아이콘 격자 한 그룹. 이름 없이 아이콘만(이름은 VoiceOver 라벨). 그릴 게 없으면 라벨째 숨긴다.
private struct ItemGrid: View {
    let label: String
    /// 보여 줄 순서대로의 id. 사전에 없는 id는 건너뛴다.
    let ids: [String]

    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    /// 402pt 폭에서 한 줄 7개 — 빌드 순서 1줄, 상황템 2줄
    private static let icon: CGFloat = 44
    private static let columns = [GridItem(.adaptive(minimum: icon, maximum: icon), spacing: Spacing.two, alignment: .leading)]

    var body: some View {
        let items = ids.compactMap { store.data.tierItemsById[$0] }
        if !items.isEmpty {
            VStack(alignment: .leading, spacing: Spacing.two) {
                Text(label).rnText(.label).foregroundStyle(palette.text.secondary)
                LazyVGrid(columns: Self.columns, alignment: .leading, spacing: Spacing.two) {
                    ForEach(items) { item in
                        RemoteImage(CDN.cdragonIconURL(item.iconPath), size: Self.icon, accessibilityLabel: item.name)
                            .clipShape(Radius.shape(Radius.md))
                            // 빌드 상세 아이템 타일과 같은 1px border.subtle
                            .overlay(Radius.shape(Radius.md).strokeBorder(palette.border.subtle, lineWidth: 1))
                    }
                }
            }
            .padding(.bottom, Spacing.two)
        }
    }
}

/// 최다 스펠 조합 + 픽률. 아이템 제목 오른쪽 끝에 붙어 세로 한 줄을 아낀다.
/// VoiceOver는 묶음 하나로 "추천 스펠, 픽률 79.5%"만 읽는다.
private struct SpellPill: View {
    let spells: [Int]
    let pick: Double
    let label: String

    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    /// heading 한 줄 높이 안에 들어간다
    private static let icon: CGFloat = 24

    var body: some View {
        // 생성물이 어긋나 아이콘 없는 스펠이 섞여도 크래시 대신 숨긴다
        let paths = spells.compactMap { store.data.tierlist.spellIcons[String($0)] }
        if !spells.isEmpty, paths.count == spells.count {
            let pickText = Tierlist.pct(pick)
            HStack(spacing: Spacing.one) {
                ForEach(Array(paths.enumerated()), id: \.offset) { _, path in
                    RemoteImage(CDN.cdragonIconURL(path), size: Self.icon)
                        .clipShape(Radius.shape(Radius.sm))
                        .overlay(Radius.shape(Radius.sm).strokeBorder(palette.border.subtle, lineWidth: 1))
                }
                Text(pickText).rnText(.label).foregroundStyle(palette.accent.default)
            }
            .padding(Spacing.one)
            .padding(.trailing, Spacing.two - Spacing.one)
            .background(palette.surface.raised, in: Radius.shape(Radius.md))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(label.replacingOccurrences(of: "{pick}", with: pickText))
        }
    }
}
