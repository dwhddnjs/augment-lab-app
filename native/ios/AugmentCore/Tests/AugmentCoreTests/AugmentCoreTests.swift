import Testing
@testable import AugmentCore

// 테스트 타깃이 비지 않게 두는 자리 표시. 실제 테스트는 영역 폴더에 둔다.
@Test func packageLinks() {
    #expect(String(describing: AugmentCore.self) == "AugmentCore")
}
