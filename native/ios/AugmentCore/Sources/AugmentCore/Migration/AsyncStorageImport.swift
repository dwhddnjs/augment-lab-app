import CryptoKit
import Foundation

/// 1.6.2(RN) 사용자의 AsyncStorage 값을 새 저장소로 한 번 옮긴다(spec storage.md §4).
/// 원본 폴더는 지우지 않는다. 실패해도 앱은 계속 진행하고, 결과를 Sentry breadcrumb로 남긴다.
public struct AsyncStorageImport {
    public static let doneKey = "migration:asyncstorage:v1"
    static let folder = "RCTAsyncLocalStorage_V1"

    public struct Result: Equatable, Sendable {
        /// 이미 완료 표시가 있어 건너뜀
        public var skipped = false
        /// 새 저장소에 쓴 키
        public var moved: [String] = []
        /// 읽기·쓰기 오류(있으면 완료 표시를 남기지 않아 다음 실행에 다시 시도한다)
        public var errors: [String] = []
        /// 이번에 완료 표시를 남겼는지
        public var completed = false
    }

    /// 찾는 순서: `Application Support/<bundleId>/RCTAsyncLocalStorage_V1` → 옛 `Documents/RCTAsyncLocalStorage_V1`
    let directories: [URL]
    /// 테마·언어·리뷰·프리웜·완료 표시(UserDefaults)
    let settingsStore: KeyValueStore
    /// `builds:v1` 파일
    let buildFile: KeyValueStore
    let keys: [String]

    public init(
        settingsStore: KeyValueStore, buildFile: KeyValueStore, ddragonVersion: String,
        directories: [URL] = AsyncStorageImport.defaultDirectories()
    ) {
        self.settingsStore = settingsStore
        self.buildFile = buildFile
        self.directories = directories
        keys = [BuildStore.key, ThemePreference.key, LocaleStore.key, "review:requested", "prewarm:done:\(ddragonVersion)"]
    }

    public static func defaultDirectories(bundleId: String = Bundle.main.bundleIdentifier ?? "com.augmentlab") -> [URL] {
        [URL.applicationSupportDirectory.appending(path: bundleId).appending(path: folder), URL.documentsDirectory.appending(path: folder)]
    }

    /// 큰 값(UTF-16 1024자 초과)이 담긴 파일 이름 = 키 UTF-8 바이트의 MD5 소문자 hex
    static func fileName(_ key: String) -> String {
        Insecure.MD5.hash(data: Data(key.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    /// 한 폴더의 값들. manifest가 없으면 nil. 키 없음 → 값 없음, null → md5 파일(없으면 값 없음), 문자열 → 그 값.
    func read(_ dir: URL) throws -> [String: String]? {
        let manifestURL = dir.appending(path: "manifest.json")
        guard FileManager.default.fileExists(atPath: manifestURL.path) else { return nil }
        guard case .object(let manifest)? = JSONValue.parse(try String(contentsOf: manifestURL, encoding: .utf8)) else {
            throw CocoaError(.fileReadCorruptFile, userInfo: [NSFilePathErrorKey: manifestURL.path])
        }
        var values: [String: String] = [:]
        for key in keys {
            switch manifest[key] {
            case .string(let v)?:
                values[key] = v
            case .null?:
                do {
                    values[key] = try String(contentsOf: dir.appending(path: Self.fileName(key)), encoding: .utf8)
                } catch CocoaError.fileReadNoSuchFile {}
            default:
                break
            }
        }
        return values
    }

    /// 완료 표시가 없을 때만 돈다. 새 저장소에 이미 있는 키는 덮어쓰지 않는다 —
    /// 지난 실행이 중간에 실패한 뒤 새로 저장한 빌드·설정을 옛 값으로 지우지 않게(두 번 돌려도 결과가 같다).
    public func run() -> Result {
        var result = Result()
        do {
            if try settingsStore.get(Self.doneKey) != nil {
                result.skipped = true
                return result
            }
        } catch {
            result.errors.append("done flag: \(error)")
            return result
        }

        var values: [String: String] = [:]
        do {
            for dir in directories {
                if let found = try read(dir) {
                    values = found
                    break
                }
            }
        } catch {
            result.errors.append("read: \(error)")
            return result
        }

        for key in keys {
            guard let raw = values[key] else { continue }
            let store = key == BuildStore.key ? buildFile : settingsStore
            do {
                guard try store.get(key) == nil else { continue }
                // 빌드는 §2.2 parse를 거친다(아레나·깨진 항목 제거, 모르는 필드 보존).
                try store.set(key, key == BuildStore.key ? Builds.stringify(Builds.parse(raw)) : raw)
                result.moved.append(key)
            } catch {
                result.errors.append("\(key): \(error)")
            }
        }

        guard result.errors.isEmpty else { return result }
        do {
            try settingsStore.set(Self.doneKey, "1")
            result.completed = true
        } catch {
            result.errors.append("done flag: \(error)")
        }
        return result
    }
}
