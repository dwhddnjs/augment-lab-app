import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["info": "정보", "change": "변경", "reset": "선택 초기화"],
    en: ["info": "Info", "change": "Change", "reset": "Clear picks"]
)

/// 커스텀 패널 맨 윗줄 — 챔피언 아이콘·이름·역할 + 동작 알약 셋 (RN `selected-champion-row.tsx`).
/// 챔피언을 못 찾았을 때(데이터에 없는 id)도 행은 그린다 — 숨기면 챔피언을 바꿀 유일한 진입점까지 사라진다. "정보"만 뺀다.
/// 재시작은 확인창 없이 바로 비운다.
struct SelectedChampionRow: View {
    let champion: Champion?
    let onShowStats: () -> Void
    let onChangeChampion: () -> Void
    let onClear: () -> Void

    static let iconSize: CGFloat = 44

    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let t = L.t(settings.locale)
        HStack(spacing: Spacing.two) {
            if let champion {
                RemoteImage(store.data.cdn.championSquareURL(champion.imageKey), size: Self.iconSize)
                    .clipShape(Radius.shape(Radius.md))
                    .overlay(Radius.shape(Radius.md).strokeBorder(palette.accent.default, lineWidth: 1.5))
                VStack(alignment: .leading, spacing: 1) {
                    Text(champion.name).rnText(.label).lineLimit(1)
                    Text(champion.tags.map { championTagLabel($0, settings.locale) }.joined(separator: " · "))
                        .rnText(.caption).foregroundStyle(palette.text.tertiary).lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                pill(t("info"), action: onShowStats) {
                    Text(t("info")).rnText(size: 11, lineHeight: 14, weight: .semibold).padding(.horizontal, Spacing.double)
                }
            } else {
                Spacer(minLength: 0)
            }
            pill(t("change"), action: onChangeChampion) {
                Text(t("change")).rnText(size: 11, lineHeight: 14, weight: .semibold)
                    .foregroundStyle(palette.accent.default)
                    .padding(.horizontal, Spacing.double)
            }
            pill(t("reset"), action: onClear) {
                IconView(.mci("restart"), size: 16).foregroundStyle(palette.status.danger).frame(width: 28)
            }
        }
    }

    /// 동작 버튼 공통 껍데기. 단색 알약은 패널 배경과 톤이 겹쳐 버튼으로 안 읽혀서,
    /// 헤더 버튼과 같은 글라스 재질 + 진한 테두리로 "떠 있는 컨트롤"임을 재질로 구분한다.
    private func pill<Label: View>(_ accessibility: String, action: @escaping () -> Void, @ViewBuilder label: () -> Label) -> some View {
        Button(action: action) {
            GlassSurface(cornerRadius: Radius.full) {
                label().frame(height: 28)
            }
            .overlay(Capsule().strokeBorder(palette.border.strong, lineWidth: 1))
            .contentShape(Rectangle().inset(by: -Spacing.two)) // RN hitSlop 8
        }
        .buttonStyle(PressDim(opacity: 0.55))
        .accessibilityLabel(accessibility)
    }
}
