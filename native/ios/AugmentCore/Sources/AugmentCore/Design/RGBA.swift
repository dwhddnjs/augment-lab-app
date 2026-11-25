import Foundation
/// RN 토큰 색 문자열 → sRGB 성분. "#RRGGBB", "#RRGGBBAA"(RN처럼 hex 뒤에 알파 2자리를 붙인 것), "rgba(r,g,b,a)".
/// 잘못된 문자열이면 nil — 토큰 오타가 조용히 검정으로 그려지지 않게 호출부가 막는다.
public struct RGBA: Hashable, Sendable {
    public let r, g, b, a: Double

    public init(r: Double, g: Double, b: Double, a: Double = 1) { self.r = r; self.g = g; self.b = b; self.a = a }

    public init?(_ s: String) {
        let t = s.trimmingCharacters(in: .whitespaces)
        if t.hasPrefix("#") {
            let hex = t.dropFirst()
            guard hex.count == 6 || hex.count == 8, let v = UInt64(hex, radix: 16) else { return nil }
            let n = hex.count == 8 ? v : (v << 8) | 0xFF
            self.init(r: Double((n >> 24) & 0xFF) / 255, g: Double((n >> 16) & 0xFF) / 255,
                      b: Double((n >> 8) & 0xFF) / 255, a: Double(n & 0xFF) / 255)
        } else if t.hasPrefix("rgba("), t.hasSuffix(")") {
            let parts = t.dropFirst(5).dropLast().split(separator: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
            guard parts.count == 4 else { return nil }
            self.init(r: parts[0] / 255, g: parts[1] / 255, b: parts[2] / 255, a: parts[3])
        } else {
            return nil
        }
    }
}
