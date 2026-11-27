import AugmentCore
import StoreKit
import SwiftUI

/// 앱스토어 리뷰 요청 (RN `src/lib/review.ts`, spec storage.md §6) — 빌드를 2개째 만든 사용자에게 한 번만 묻는다.
/// 실제로 뜰지는 iOS가 정한다(1년 3번, TestFlight에선 안 뜸). 리뷰는 부가 기능이라 오류는 전부 삼킨다.
enum ReviewRequest {
    static let key = "review:requested"
    static let minBuilds = 2

    /// 순서: 요청한 적 없음 → 빌드 2개 이상 → (iOS는 늘 가능) → '1'을 **먼저** 저장하고 요청
    @MainActor
    static func maybeRequest(_ request: RequestReviewAction, builds: BuildStore, store: KeyValueStore = UserDefaultsStore()) {
        do {
            guard try store.get(key) == nil else { return }
            guard builds.load().count >= minBuilds else { return }
            try store.set(key, "1")
            request()
        } catch {}
    }
}
