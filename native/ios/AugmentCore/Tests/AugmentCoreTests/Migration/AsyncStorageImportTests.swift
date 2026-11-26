import Foundation
import Testing
@testable import AugmentCore

/// 픽스처 폴더 3종(인라인 값, null + md5 파일, md5 파일 누락), 두 번 실행, md5 이름, 폴백·덮어쓰기 방지·오류.
struct AsyncStorageImportTests {
    static let builds = #"[{"id":"a","mode":"classic","championId":"Ahri","augmentIds":["x"],"itemIds":[],"createdAt":"2026-08-20T00:00:00.000Z","note":"keep"},{"id":"arena","mode":"arena","championId":"Jinx","augmentIds":[],"itemIds":[],"createdAt":"2026-08-19T00:00:00.000Z"}]"#
    static let version = "16.16.1"

    let root = FileManager.default.temporaryDirectory.appending(path: "asi-\(UUID().uuidString)")
    var primary: URL { root.appending(path: "AppSupport/com.augmentlab/RCTAsyncLocalStorage_V1") }
    var documents: URL { root.appending(path: "Documents/RCTAsyncLocalStorage_V1") }

    /// manifest + md5 파일을 쓴다. 값이 nil이면 manifest에 null(파일이 files에 있으면 그 내용).
    func fixture(_ dir: URL, manifest: [String: String?], files: [String: String] = [:]) throws {
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let json = JSONValue.object(manifest.mapValues { $0.map(JSONValue.string) ?? .null })
        try json.stringified().write(to: dir.appending(path: "manifest.json"), atomically: true, encoding: .utf8)
        for (key, value) in files {
            try value.write(to: dir.appending(path: AsyncStorageImport.fileName(key)), atomically: true, encoding: .utf8)
        }
    }

    func run(_ prefs: MemoryKeyValueStore, _ files: MemoryKeyValueStore) -> AsyncStorageImport.Result {
        AsyncStorageImport(settingsStore: prefs, buildFile: files, ddragonVersion: Self.version, directories: [primary, documents]).run()
    }

    @Test func md5FileNames() {
        #expect(AsyncStorageImport.fileName("builds:v1") == "970e875d66bf736ae9a9465c34219ef6")
        #expect(AsyncStorageImport.fileName("theme:v1") == "d54ded72acf1b50c08fdcd9a66d4a58c")
        #expect(AsyncStorageImport.fileName("locale:v1") == "d17436c0a5da6dfea070d64dda0b0afd")
        #expect(AsyncStorageImport.fileName("review:requested") == "5df9f2cd952dab82411c5481c8c70964")
        #expect(AsyncStorageImport.fileName("prewarm:done:16.16.1") == "d0b80c1bb5f09ba96cc848a13d314361")
    }

    /// 1. 전부 인라인
    @Test func inlineValues() throws {
        defer { try? FileManager.default.removeItem(at: root) }
        try fixture(primary, manifest: [
            "builds:v1": Self.builds, "theme:v1": "dark", "locale:v1": "en", "review:requested": "1",
            "prewarm:done:16.16.1": "1", "prewarm:done:16.11.1": "1", "other": "x",
        ])
        let prefs = MemoryKeyValueStore(), files = MemoryKeyValueStore()
        let r = run(prefs, files)
        #expect(r.errors.isEmpty && r.completed)
        #expect(r.moved.count == 5)
        #expect(prefs.values == ["theme:v1": "dark", "locale:v1": "en", "review:requested": "1",
                                 "prewarm:done:16.16.1": "1", AsyncStorageImport.doneKey: "1"])
        // 빌드는 parse를 거친다: 아레나 제거, 클래식 → 칼바람, 모르는 필드 보존
        let moved = Builds.parse(files.values["builds:v1"])
        #expect(moved.map(\.id) == ["a"])
        #expect(moved.first?.mode == .aram)
        #expect(files.values["builds:v1"]?.contains(#""note":"keep""#) == true)
    }

    /// 2. null + md5 파일 (큰 빌드 값)
    @Test func nullWithFile() throws {
        defer { try? FileManager.default.removeItem(at: root) }
        try fixture(primary, manifest: ["builds:v1": nil, "theme:v1": "light"], files: ["builds:v1": Self.builds])
        let prefs = MemoryKeyValueStore(), files = MemoryKeyValueStore()
        let r = run(prefs, files)
        #expect(r.errors.isEmpty && r.completed)
        #expect(Set(r.moved) == ["builds:v1", "theme:v1"])
        #expect(Builds.parse(files.values["builds:v1"]).map(\.id) == ["a"])
    }

    /// 3. null인데 md5 파일이 없다 → 값 없음(오류 아님)
    @Test func nullWithoutFile() throws {
        defer { try? FileManager.default.removeItem(at: root) }
        try fixture(primary, manifest: ["builds:v1": nil, "locale:v1": "ko"])
        let prefs = MemoryKeyValueStore(), files = MemoryKeyValueStore()
        let r = run(prefs, files)
        #expect(r.errors.isEmpty && r.completed)
        #expect(r.moved == ["locale:v1"])
        #expect(files.values.isEmpty)
    }

    /// 두 번 실행해도 결과가 같다(두 번째는 완료 표시로 건너뜀). 원본 폴더는 남는다.
    @Test func idempotent() throws {
        defer { try? FileManager.default.removeItem(at: root) }
        try fixture(primary, manifest: ["builds:v1": nil, "theme:v1": "dark"], files: ["builds:v1": Self.builds])
        let prefs = MemoryKeyValueStore(), files = MemoryKeyValueStore()
        _ = run(prefs, files)
        let (p1, f1) = (prefs.values, files.values)
        let second = run(prefs, files)
        #expect(second.skipped)
        #expect(prefs.values == p1 && files.values == f1)
        #expect(FileManager.default.fileExists(atPath: primary.appending(path: "manifest.json").path))
        #expect(FileManager.default.fileExists(atPath: primary.appending(path: AsyncStorageImport.fileName("builds:v1")).path))
    }

    /// 완료 표시 없이 다시 돌아도(지난번 중간 실패) 새로 저장한 값을 덮어쓰지 않는다.
    @Test func neverOverwritesNewData() throws {
        defer { try? FileManager.default.removeItem(at: root) }
        try fixture(primary, manifest: ["builds:v1": Self.builds, "theme:v1": "dark"])
        let prefs = MemoryKeyValueStore(["theme:v1": "light"]), files = MemoryKeyValueStore(["builds:v1": "[]"])
        let r = run(prefs, files)
        #expect(r.moved.isEmpty && r.completed)
        #expect(prefs.values["theme:v1"] == "light")
        #expect(files.values["builds:v1"] == "[]")
    }

    /// 옛 Documents 폴더 폴백, RN 데이터가 아예 없으면 완료 표시만
    @Test func fallbackAndFreshInstall() throws {
        defer { try? FileManager.default.removeItem(at: root) }
        let prefs = MemoryKeyValueStore(), files = MemoryKeyValueStore()
        var r = run(prefs, files)
        #expect(r.moved.isEmpty && r.completed, "신규 설치")

        prefs.values = [:]
        try fixture(documents, manifest: ["locale:v1": "en"])
        r = run(prefs, files)
        #expect(r.moved == ["locale:v1"])
    }

    /// 읽기·쓰기 오류면 완료 표시를 남기지 않는다(다음 실행에 다시). 앱은 계속 진행.
    @Test func errorsLeaveNotDone() throws {
        defer { try? FileManager.default.removeItem(at: root) }
        try FileManager.default.createDirectory(at: primary, withIntermediateDirectories: true)
        try "{oops".write(to: primary.appending(path: "manifest.json"), atomically: true, encoding: .utf8)
        let prefs = MemoryKeyValueStore(), files = MemoryKeyValueStore()
        var r = run(prefs, files)
        #expect(!r.errors.isEmpty && !r.completed)
        #expect(prefs.values.isEmpty)

        try fixture(primary, manifest: ["builds:v1": Self.builds, "theme:v1": "dark"])
        files.failWrites = true
        r = run(prefs, files)
        #expect(r.errors.count == 1 && !r.completed)
        #expect(r.moved == ["theme:v1"])
        files.failWrites = false
        r = run(prefs, files)
        #expect(r.moved == ["builds:v1"] && r.completed, "다시 돌면 빠진 것만 옮긴다")
    }
}
