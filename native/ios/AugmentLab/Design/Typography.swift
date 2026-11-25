import SwiftUI
import UIKit

/// 타이포 토큰 (`Typography`). 시스템 폰트, 커스텀 폰트 없음.
public enum TypeStyle: CaseIterable, Sendable {
    case display, title, heading, body, label, caption

    public var size: CGFloat { [48, 32, 20, 16, 14, 12][index] }
    public var lineHeight: CGFloat { [52, 40, 28, 24, 20, 16][index] }
    public var weight: Font.Weight { [.bold, .bold, .semibold, .medium, .semibold, .medium][index] }
    private var index: Int { Self.allCases.firstIndex(of: self)! }
}

/// RN 숫자 weight → SwiftUI
public func fontWeight(_ rn: Int) -> Font.Weight {
    switch rn {
    case ...400: .regular
    case 500: .medium
    case 600: .semibold
    case 700: .bold
    default: .heavy
    }
}

/// RN 텍스트 재현: 줄마다 고정 lineHeight, 글자는 줄 가운데. Dynamic Type은 RN처럼 크기·줄높이를 같은 배율로 키운다.
/// - 상속 주의: RN `ThemedText`는 덮어쓰지 않은 속성을 body 16/24/500에서 물려받는다(spec §1.2). 크기만 바꿀 땐 weight를 그대로 둔다.
struct RNText: ViewModifier {
    let size: CGFloat
    let lineHeight: CGFloat
    let weight: Font.Weight
    /// false면 Dynamic Type 무시(카드·스티커 텍스트, RN `allowFontScaling={false}`)
    let scales: Bool
    @Environment(\.dynamicTypeSize) private var dynamicType // 바뀌면 다시 계산하게 읽어 둔다

    func body(content: Content) -> some View {
        let k = scales ? UIFontMetrics(forTextStyle: .body).scaledValue(for: 1000) / 1000 : 1
        let fontSize = size * k, line = lineHeight * k
        let natural = UIFont.systemFont(ofSize: fontSize, weight: uiWeight).lineHeight
        let extra = max(0, line - natural)
        return content
            .font(.system(size: fontSize, weight: weight))
            .lineSpacing(extra)
            .padding(.vertical, extra / 2)
    }

    private var uiWeight: UIFont.Weight {
        switch weight {
        case .medium: .medium
        case .semibold: .semibold
        case .bold: .bold
        case .heavy: .heavy
        default: .regular
        }
    }
}

public extension View {
    /// `ThemedText type=` 대응
    func rnText(_ style: TypeStyle = .body, scales: Bool = true) -> some View {
        modifier(RNText(size: style.size, lineHeight: style.lineHeight, weight: style.weight, scales: scales))
    }

    /// 토큰 밖 크기(11/14/600 등)
    func rnText(size: CGFloat, lineHeight: CGFloat, weight: Font.Weight = .medium, scales: Bool = true) -> some View {
        modifier(RNText(size: size, lineHeight: lineHeight, weight: weight, scales: scales))
    }
}

private struct SurfaceBackground: ViewModifier {
    let pick: KeyPath<Palette.Surface, Color>
    @Environment(\.palette) private var palette
    func body(content: Content) -> some View { content.background(palette.surface[keyPath: pick]) }
}

public extension View {
    /// `ThemedView surface=` 대응
    func surfaceBackground(_ pick: KeyPath<Palette.Surface, Color> = \.base) -> some View { modifier(SurfaceBackground(pick: pick)) }
}
