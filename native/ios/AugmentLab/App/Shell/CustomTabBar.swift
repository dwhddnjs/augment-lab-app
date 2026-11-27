import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["home": "메인", "tierlist": "티어리스트", "mypage": "마이페이지", "plus": "추가"],
    en: ["home": "Home", "tierlist": "Tier List", "mypage": "My Page", "plus": "Add"]
)

/// iOS 26 미만 하단 탭바 (design-system §2.10, RN `custom-tabs.tsx`).
/// 메인 / 티어리스트 / 마이페이지 / 원형 `+` 순. `+`는 탭 전환 없이 모드 선택만 연다.
struct CustomTabBar: View {
    /// RN은 높이 80 안에 paddingBottom(하단 inset)이 들어간다 → 내용 높이 = 80 - inset
    let bottomInset: CGFloat

    @Environment(Router.self) private var router
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @Environment(\.displayScale) private var displayScale

    private static let height = Spacing.six + Spacing.three
    private static let plusSize: CGFloat = 56

    var body: some View {
        let t = L.t(settings.locale)
        HStack(spacing: 0) {
            side(.home, icon: "home", label: t("home"))
            side(.tierlist, icon: "bar-chart", label: t("tierlist"))
            side(.mypage, icon: "account-circle", label: t("mypage"))
            Button { router.showModeSelect() } label: {
                IconView(.mi("add"), size: 34)
                    .foregroundStyle(palette.text.inverse)
                    .frame(width: Self.plusSize, height: Self.plusSize)
                    .background(palette.accent.default, in: Circle())
                    .slot()
            }
            .accessibilityLabel(t("plus"))
        }
        .buttonStyle(NoFeedbackButtonStyle())
        .padding(.horizontal, Spacing.three)
        .frame(height: max(0, Self.height - bottomInset))
        .background {
            palette.surface.base
                .overlay(alignment: .top) { palette.border.default.frame(height: hairline(displayScale)) }
                .ignoresSafeArea(edges: .bottom)
        }
    }

    private func side(_ tab: AppTab, icon: String, label: String) -> some View {
        let color = router.tab == tab ? palette.accent.default : palette.text.secondary
        return Button { router.selectTab(tab) } label: {
            VStack(spacing: Spacing.half) {
                IconView(.mi(icon), size: 26)
                Text(label).font(.system(size: TypeStyle.caption.size, weight: TypeStyle.label.weight))
            }
            .foregroundStyle(color)
            .slot()
        }
        .accessibilityAddTraits(router.tab == tab ? .isSelected : [])
    }
}

private extension View {
    /// 네 칸 균등 분할(RN flex: 1), 칸 전체가 눌린다
    func slot() -> some View { frame(maxWidth: .infinity, maxHeight: .infinity).contentShape(Rectangle()) }
}

