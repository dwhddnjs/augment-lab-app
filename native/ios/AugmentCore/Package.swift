// swift-tools-version: 6.0
// 순수 로직 패키지 — macOS에서 `swift test`로 시뮬레이터 없이 검증한다.
// 영역 폴더(Data/, Storage/ …)는 각 작업이 Sources/AugmentCore/<영역>/, Tests/AugmentCoreTests/<영역>/에 만든다.
import PackageDescription

let package = Package(
    name: "AugmentCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "AugmentCore", targets: ["AugmentCore"])],
    targets: [
        .target(name: "AugmentCore", swiftSettings: [.swiftLanguageMode(.v5)]),
        .testTarget(name: "AugmentCoreTests", dependencies: ["AugmentCore"], swiftSettings: [.swiftLanguageMode(.v5)]),
    ]
)
