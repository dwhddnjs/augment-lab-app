import Foundation

/// 아무 JSON 값. 저장 원문을 JS처럼 느슨하게 읽고, 모르는 필드를 잃지 않고 다시 쓰는 데 쓴다.
public enum JSONValue: Codable, Equatable, Sendable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let v = try? c.decode(Bool.self) { self = .bool(v) }
        else if let v = try? c.decode(Double.self) { self = .number(v) }
        else if let v = try? c.decode(String.self) { self = .string(v) }
        else if let v = try? c.decode([JSONValue].self) { self = .array(v) }
        else { self = .object(try c.decode([String: JSONValue].self)) }
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .null: try c.encodeNil()
        case .bool(let v): try c.encode(v)
        case .number(let v): try c.encode(v)
        case .string(let v): try c.encode(v)
        case .array(let v): try c.encode(v)
        case .object(let v): try c.encode(v)
        }
    }

    /// JS `!value` — undefined는 호출측에서 nil로 처리한다.
    var isFalsy: Bool {
        switch self {
        case .null, .bool(false), .number(0), .string(""): true
        default: false
        }
    }

    var string: String? {
        if case .string(let s) = self { s } else { nil }
    }

    var array: [JSONValue]? {
        if case .array(let a) = self { a } else { nil }
    }

    /// 문자열 원소만 남긴다(JS `.filter(s => typeof s === 'string')`).
    var strings: [String]? {
        array?.compactMap(\.string)
    }

    /// JS `JSON.parse` — 깨진 JSON이면 nil.
    public static func parse(_ raw: String) -> JSONValue? {
        try? JSONDecoder().decode(JSONValue.self, from: Data(raw.utf8))
    }

    /// JS `JSON.stringify`. 키 순서는 정렬로 고정한다(JS는 삽입 순서 — 읽는 쪽은 순서를 보지 않는다).
    public func stringified() throws -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        return String(decoding: try encoder.encode(self), as: UTF8.self)
    }
}
