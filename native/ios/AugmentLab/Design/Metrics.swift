import SwiftUI
import UIKit

/// 간격 (`Spacing`)
public enum Spacing {
    public static let half: CGFloat = 2, one: CGFloat = 4, two: CGFloat = 8, double: CGFloat = 12
    public static let three: CGFloat = 16, four: CGFloat = 24, five: CGFloat = 32, six: CGFloat = 64
}

/// 모서리 반경 (`Radius`). pill이 아니면 iOS squircle(`continuous`)로 그린다 → `Radius.shape(_:)`
public enum Radius {
    public static let none: CGFloat = 0, sm: CGFloat = 4, md: CGFloat = 8, lg: CGFloat = 12
    public static let xl: CGFloat = 16, xxl: CGFloat = 24, full: CGFloat = 9999
    public static func shape(_ r: CGFloat) -> RoundedRectangle { RoundedRectangle(cornerRadius: r, style: .continuous) }
}

/// 하단 탭 inset (`BottomTabInset`)
public let bottomTabInset: CGFloat = 50

/// RN `StyleSheet.hairlineWidth` = 1px (3x 화면 1/3pt, 2x 0.5pt)
public func hairline(_ displayScale: CGFloat) -> CGFloat { 1 / displayScale }

public extension View {
    /// `Elevation.level1` — GlassButtonFallback 전용. RN shadow* 속성은 CALayer 값 그대로라 radius를 줄이지 않는다.
    func elevationLevel1() -> some View { shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 1) }
}
