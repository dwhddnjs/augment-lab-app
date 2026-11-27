import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["hint": "빌드를 완료하면\n여기에 쌓여요", "start": "새 빌드 시작"],
    en: ["hint": "Finished builds\nshow up here", "start": "Start a new build"]
)

/// 저장된 빌드가 없을 때 최근 빌드 첫 자리를 채우는 빈 카드 (RN `empty-build-card.tsx`).
/// 빌드 카드와 같은 크기·모서리라 첫 빌드가 생기면 그 자리에 그대로 들어선다. 누르면 탭바 +와 같은 모드 선택.
struct EmptyBuildCard: View {
    let width: CGFloat
    let onPress: () -> Void

    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    private static let icon: CGFloat = 28

    var body: some View {
        let t = L.t(settings.locale)
        let shape = Radius.shape(Radius.xl)
        Button(action: onPress) {
            VStack(spacing: Spacing.two) {
                IconView(.mci("plus"), size: Self.icon)
                Text(t("hint")).rnText(.caption).multilineTextAlignment(.center)
            }
            .foregroundStyle(palette.text.tertiary)
            .padding(Spacing.three)
            .frame(width: width, height: width / BuildCard.aspect)
            .background(palette.surface.raised, in: shape)
            .overlay(shape.strokeBorder(palette.border.strong, style: StrokeStyle(lineWidth: 1, dash: [3, 3])))
            .contentShape(shape)
        }
        .buttonStyle(PressedOpacityStyle(opacity: 0.7))
        .accessibilityLabel(t("start"))
        .accessibilityHint(t("hint"))
    }
}
