import SwiftUI

/// 드래프트 헤더의 glass 버튼 (RN `glass-button.tsx` + `glass-button-fallback.tsx`). spec/design-system.md §2.3·§2.4.
/// - `label`이 없으면 44 원형 아이콘 버튼, 있으면 pill
/// - `tint`가 있으면 주요 액션(완료 등): 26+는 틴트, 폴백은 채워진 accent
/// - `systemImage`는 26+ SF Symbol, `fallbackIcon`은 26 미만 MaterialCommunityIcons
public struct GlassButton: View {
    let label: String?
    let systemImage: String?
    let fallbackIcon: String?
    let tint: Color?
    let role: ButtonRole?
    let accessibilityLabel: String?
    let action: () -> Void

    public init(_ label: String? = nil, systemImage: String? = nil, fallbackIcon: String? = nil, tint: Color? = nil,
                role: ButtonRole? = nil, accessibilityLabel: String? = nil, action: @escaping () -> Void) {
        self.label = label; self.systemImage = systemImage; self.fallbackIcon = fallbackIcon; self.tint = tint
        self.role = role; self.accessibilityLabel = accessibilityLabel; self.action = action
    }

    public var body: some View {
        if #available(iOS 26.0, *) { glass } else { GlassButtonFallback(button: self) }
    }

    @available(iOS 26.0, *)
    @ViewBuilder private var glass: some View {
        if label == nil, let systemImage {
            Button(action: action) {
                Image(systemName: systemImage)
                    .font(.system(size: 18))
                    .foregroundStyle(tint ?? Color(uiColor: .label))
                    .frame(width: 44, height: 44)
                    .glassEffect(.regular.interactive(), in: Circle())
            }
            .buttonStyle(NoFeedbackButtonStyle()) // interactive glass가 눌림을 그린다
            .accessibilityLabel(accessibilityLabel ?? systemImage)
        } else {
            // @expo/ui 수정자 순서 그대로: padding → buttonStyle(.glass) → controlSize → tint → font
            Group {
                if let systemImage {
                    Button(label ?? "", systemImage: systemImage, role: role, action: action)
                } else {
                    Button(label ?? "", role: role, action: action)
                }
            }
            .padding(.vertical, Spacing.two)
            .padding(.leading, Spacing.three)
            .buttonStyle(.glass)
            .controlSize(.regular)
            .tint(tint)
            .font(.system(size: 16, weight: .medium))
            .accessibilityLabel(accessibilityLabel ?? label ?? "")
        }
    }
}

/// iOS 26 미만: 단색 원·pill (Android 기준 디자인이기도 하다)
private struct GlassButtonFallback: View {
    let button: GlassButton
    @Environment(\.palette) private var palette
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        let prominent = button.tint != nil
        let iconColor = prominent ? palette.accent.onAccent : button.role == .destructive ? palette.status.danger : palette.text.secondary
        Button(action: button.action) {
            HStack(spacing: Spacing.two) {
                if let icon = button.fallbackIcon { IconView(.mci(icon), size: 22) }
                if let label = button.label { Text(label).rnText(.label) }
            }
            .foregroundStyle(iconColor)
            .frame(width: button.label == nil ? 44 : nil, height: button.label == nil ? 44 : nil)
            .padding(.vertical, button.label == nil ? 0 : Spacing.two)
            .padding(.horizontal, button.label == nil ? 0 : Spacing.three)
            .background(prominent ? palette.accent.default : palette.surface.raised, in: Capsule())
            .overlay(Capsule().strokeBorder(prominent ? .clear : palette.border.subtle, lineWidth: hairline(displayScale)))
            .elevationLevel1()
            .hitSlop(8)
        }
        .buttonStyle(PressedOpacityStyle(opacity: 0.7))
        .accessibilityLabel(button.accessibilityLabel ?? button.label ?? "")
    }
}

/// RN `Pressable` 눌림 opacity (spec §3.11 표)
public struct PressedOpacityStyle: ButtonStyle {
    let opacity: Double
    public init(opacity: Double) { self.opacity = opacity }
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label.opacity(configuration.isPressed ? opacity : 1)
    }
}

#Preview {
    HStack(spacing: Spacing.three) {
        GlassButton(systemImage: "xmark", fallbackIcon: "close", accessibilityLabel: "닫기") {}
        GlassButton(systemImage: "list.bullet", fallbackIcon: "format-list-bulleted") {}
        GlassButton("저장", systemImage: "checkmark", fallbackIcon: "check", tint: Palette.dark.accent.default) {}
    }
    .padding()
    .background(Palette.dark.surface.base)
    .providesPalette()
    .preferredColorScheme(.dark)
}
