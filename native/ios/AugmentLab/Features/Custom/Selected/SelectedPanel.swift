import AugmentCore
import SwiftUI
import UIKit

private let L = L10n(
    ko: ["augments": "증강", "items": "아이템", "emptyAugment": "카드를 넣어주세요", "emptyItem": "아이템을 넣어주세요",
         "showAugments": "증강 목록 보기", "showItems": "아이템 목록 보기", "remove": "제거"],
    en: ["augments": "Augments", "items": "Items", "emptyAugment": "Drop a card here", "emptyItem": "Drop an item here",
         "showAugments": "Show augments", "showItems": "Show items", "remove": "Remove"]
)

/// 커스텀 화면 오른쪽(4.5) — 챔피언 행 + 담은 증강/아이템 5:5 두 칸 (RN `selected-panel.tsx`). spec/custom.md §2.
/// 행 탭은 제거가 아니라 **칸 전환**이다(헤더 토글까지 손을 옮기지 않아도 되고, 스크롤 중 오탭으로 지워지지 않는다). 제거는 x 배지 하나뿐.
struct SelectedPanel: View {
    let champion: Champion?
    let picked: [Augment]
    let items: [Item]
    /// 지금 담기는 칸 — 그 칸의 테두리를 켜고, 드롭 베일도 그 칸에만 얹는다.
    let target: CustomDraft.PickTarget
    /// 드래그 중이고 손가락이 드롭 경계 안이다(종류는 언제나 target과 같다).
    let dropping: Bool
    /// 홈 인디케이터 높이. 박스가 화면 끝까지 내려오므로 목록 안에서 띄운다.
    let bottomInset: CGFloat
    /// 반대편 칸을 탭했다 — 헤더 토글과 같은 뒤집기
    let onSwitchTarget: () -> Void
    let onRemove: (String) -> Void
    let onRemoveItem: (String) -> Void
    let onShowStats: () -> Void
    let onChangeChampion: () -> Void
    let onClear: () -> Void

    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let t = L.t(settings.locale)
        let toAugment = switchTo(.augment)
        let toItem = switchTo(.item)

        VStack(spacing: Spacing.two) {
            SelectedChampionRow(champion: champion, onShowStats: onShowStats, onChangeChampion: onChangeChampion, onClear: onClear)

            HStack(spacing: Spacing.two) {
                PickColumn(label: t("augments"), count: "\(picked.count)/\(CustomDraft.maxAugments)", active: target == .augment,
                           dropping: dropping, onSwitch: toAugment, switchLabel: t("showAugments")) {
                    if picked.isEmpty {
                        EmptyHint(text: t("emptyAugment"), onPress: toAugment)
                    } else {
                        PickList(bottomInset: bottomInset, onSwitch: toAugment) {
                            ForEach(picked) { augment in
                                augmentRow(augment, onSwitch: toAugment, removeLabel: t("remove"))
                            }
                        }
                    }
                }
                PickColumn(label: t("items"), count: "\(items.count)/\(Item.maxPerBuild)", active: target == .item,
                           dropping: dropping, onSwitch: toItem, switchLabel: t("showItems")) {
                    if items.isEmpty {
                        EmptyHint(text: t("emptyItem"), onPress: toItem)
                    } else {
                        PickList(bottomInset: bottomInset, onSwitch: toItem) {
                            ForEach(items) { item in
                                itemRow(item, onSwitch: toItem, removeLabel: t("remove"))
                            }
                        }
                    }
                }
            }
        }
        .padding(.horizontal, Spacing.two)
    }

    /// 지금 칸이면 nil — 눌러도 아무 일이 없어야 한다.
    private func switchTo(_ kind: CustomDraft.PickTarget) -> (() -> Void)? {
        guard target != kind else { return nil }
        return {
            UISelectionFeedbackGenerator().selectionChanged()
            onSwitchTarget()
        }
    }

    private func augmentRow(_ augment: Augment, onSwitch: (() -> Void)?, removeLabel: String) -> some View {
        let tint = RarityColors.color(augment.rarity, palette.scheme)
        return row(accent: tint, onSwitch: onSwitch, remove: RemoveBadge(label: removeLabel) { onRemove(augment.id) }) {
            // 아이콘은 어두운 배경 자산이라 라이트에서도 어두운 톤(빌드 상세와 같다)
            AugmentTile(iconPath: augment.iconPath, rarity: augment.rarity, size: pickRowIcon, background: HeroOverlay.cardBase)
            name(augment.name, color: tint)
        }
    }

    private func itemRow(_ item: Item, onSwitch: (() -> Void)?, removeLabel: String) -> some View {
        row(accent: palette.border.strong, onSwitch: onSwitch, remove: RemoveBadge(label: removeLabel) { onRemoveItem(item.id) }) {
            // 증강 타일과 같은 30 틀에 이미지만 0.75 — 나란한 두 목록의 아이콘 크기가 눈으로 같아진다.
            RemoteImage(store.data.cdn.itemImageURL(item.imageKey), size: pickRowImage, contentMode: .fit)
                .clipShape(Radius.shape(Radius.sm))
                .frame(width: pickRowIcon, height: pickRowIcon)
                .background(HeroOverlay.cardBase)
                .clipShape(Radius.shape(Radius.md))
                .overlay(Radius.shape(Radius.md).strokeBorder(palette.border.subtle, lineWidth: 1))
            name(item.name, color: palette.text.secondary)
        }
    }

    private func name(_ text: String, color: Color) -> some View {
        Text(text)
            .rnText(size: 11, lineHeight: 14, weight: .semibold)
            .foregroundStyle(color)
            .lineLimit(1)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func row<Leading: View>(accent: Color, onSwitch: (() -> Void)?, remove: RemoveBadge,
                                    @ViewBuilder content: () -> Leading) -> some View {
        Button { onSwitch?() } label: {
            // 이름에 한 글자라도 더 주려고 조인 간격(칸이 5:5라 여유가 없다). 오른쪽은 배지 자리를 비운다.
            HStack(spacing: Spacing.one) { content() }
                .padding(.vertical, Spacing.one)
                .padding(.leading, Spacing.one + 3)
                .padding(.trailing, removeBadgeSize + Spacing.half)
                .background(LeftAccentBackground(accent: accent, fill: palette.surface.raised))
                .contentShape(Rectangle())
        }
        .buttonStyle(PressDim(opacity: onSwitch == nil ? 1 : 0.6))
        .overlay(alignment: .topTrailing) { remove }
    }
}
