import Foundation
@testable import AugmentCore

/// 테스트가 저장소의 번들 JSON을 직접 읽는다. 파일 목록은 앱 빌드 단계와 같은 `Scripts/data-files.xcfilelist`.
/// 다른 영역 테스트도 `RepoData.gameData(.ko)`를 그대로 쓴다.
enum RepoData {
    static let root = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .deletingLastPathComponent()

    /// 파일 이름 → 저장소 경로
    static let files: [String: URL] = {
        let list = try! String(contentsOf: root.appendingPathComponent("native/ios/Scripts/data-files.xcfilelist"), encoding: .utf8)
        var map: [String: URL] = [:]
        for line in list.split(separator: "\n") where !line.hasPrefix("#") {
            let rel = line.replacingOccurrences(of: "$(SRCROOT)/../../", with: "")
            let url = root.appendingPathComponent(rel)
            map[url.lastPathComponent] = url
        }
        return map
    }()

    static func url(_ name: String) throws -> URL {
        guard let u = files[name] else { throw GameData.LoadError.missing(name) }
        return u
    }

    static func gameData(_ locale: AppLocale) throws -> GameData {
        try GameData(locale: locale, url: url)
    }

    /// 모델을 거치지 않은 원본 JSON — 모델과 독립적으로 다시 계산해 비교할 때 쓴다.
    static func raw(_ name: String) throws -> Any {
        try JSONSerialization.jsonObject(with: Data(contentsOf: url(name)))
    }
}
