import SwiftUI
import UIKit

/// glass 바탕 (RN `components/ui/glass-surface.tsx`).
/// iOS 26+: Liquid Glass regular. 미만: 블러 강도 20 + `edge`면 hairline `border.default` 테두리. 내용은 모양으로 클립한다.
public struct GlassSurface<Content: View>: View {
    let cornerRadius: CGFloat
    let edge: Bool
    let content: Content
    @Environment(\.palette) private var palette
    @Environment(\.displayScale) private var displayScale

    public init(cornerRadius: CGFloat, edge: Bool = false, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius; self.edge = edge; self.content = content()
    }

    public var body: some View {
        let shape = Radius.shape(cornerRadius)
        if #available(iOS 26.0, *) {
            content.clipShape(shape).glassEffect(.regular, in: shape)
        } else {
            content
                .background(BlurBackground(scheme: palette.scheme, intensity: 20))
                .clipShape(shape)
                .overlay { if edge { shape.strokeBorder(palette.border.default, lineWidth: hairline(displayScale)) } }
        }
    }
}

/// expo-blur `BlurView`와 같은 방식: 모드별 UIBlurEffect를 애니메이터로 `intensity`%만 적용한다.
struct BlurBackground: UIViewRepresentable {
    let scheme: ColorScheme
    /// 0~100 (RN `intensity`)
    let intensity: CGFloat

    final class Coordinator { var animator: UIViewPropertyAnimator? }
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> UIVisualEffectView { UIVisualEffectView(effect: nil) }

    func updateUIView(_ view: UIVisualEffectView, context: Context) {
        context.coordinator.animator?.stopAnimation(true)
        view.effect = nil
        let effect = UIBlurEffect(style: scheme == .dark ? .dark : .light)
        let animator = UIViewPropertyAnimator(duration: 1, curve: .linear) { view.effect = effect }
        animator.fractionComplete = intensity / 100
        animator.pausesOnCompletion = true
        context.coordinator.animator = animator
    }

    static func dismantleUIView(_ view: UIVisualEffectView, coordinator: Coordinator) {
        coordinator.animator?.stopAnimation(true)
    }
}
