import Foundation

/// 헤드라이너 문구 색 표기 한 조각. `mark`가 nil이면 평문.
public struct MarkedPart: Hashable, Sendable {
    public var text: String
    public var mark: String?
    public init(text: String, mark: String? = nil) { self.text = text; self.mark = mark }
}

private let markRegex = try! NSRegularExpression(pattern: #"\[([A-Za-z0-9_]+)\](.*?)\[/\1\]"#)

/// "[s]스킬[/s] [e]강화[/e]!" → 조각들 (RN `headliners/marked.ts`). 중첩 없음, 짝이 안 맞으면 평문으로 남는다.
public func parseMarked(_ text: String) -> [MarkedPart] {
    let ns = text as NSString
    var parts: [MarkedPart] = []
    var last = 0
    for m in markRegex.matches(in: text, range: NSRange(location: 0, length: ns.length)) {
        if m.range.location > last {
            parts.append(MarkedPart(text: ns.substring(with: NSRange(location: last, length: m.range.location - last))))
        }
        parts.append(MarkedPart(text: ns.substring(with: m.range(at: 2)), mark: ns.substring(with: m.range(at: 1))))
        last = m.range.location + m.range.length
    }
    if last < ns.length { parts.append(MarkedPart(text: ns.substring(from: last))) }
    return parts
}

public func stripMarks(_ text: String) -> String {
    parseMarked(text).map(\.text).joined()
}
