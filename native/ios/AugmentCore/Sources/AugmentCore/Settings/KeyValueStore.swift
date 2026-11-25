import Foundation

/// 작은 설정값 저장소. 키 이름은 RN·백업 형식 그대로 쓴다(storage.md §1).
public protocol KeyValueStore {
    func get(_ key: String) throws -> String?
    func set(_ key: String, _ value: String) throws
    func remove(_ key: String) throws
}

/// 앱에서 쓰는 구현.
public struct UserDefaultsStore: KeyValueStore {
    let defaults: UserDefaults

    public init(_ defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    public func get(_ key: String) -> String? { defaults.string(forKey: key) }
    public func set(_ key: String, _ value: String) { defaults.set(value, forKey: key) }
    public func remove(_ key: String) { defaults.removeObject(forKey: key) }
}

/// 테스트·프리뷰용. `failReads`·`failWrites`로 읽기·쓰기 오류를 흉내 낸다.
public final class MemoryKeyValueStore: KeyValueStore {
    public struct Failure: Error {}

    public var values: [String: String]
    public var failReads = false
    public var failWrites = false

    public init(_ values: [String: String] = [:]) {
        self.values = values
    }

    public func get(_ key: String) throws -> String? {
        if failReads { throw Failure() }
        return values[key]
    }

    public func set(_ key: String, _ value: String) throws {
        if failWrites { throw Failure() }
        values[key] = value
    }

    public func remove(_ key: String) throws {
        if failWrites { throw Failure() }
        values[key] = nil
    }
}
