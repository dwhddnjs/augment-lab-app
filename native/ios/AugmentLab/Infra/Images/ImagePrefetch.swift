import Foundation
import os
import SDWebImageSwiftUI

/// 이미지 미리 받기 (RN `image-prewarm.ts` 의 `prefetchOne`). spec/app-shell.md §6.
/// 프리웜과 화면별 prefetch(챔피언·아이템 선택, 드래프트 카드)가 같이 쓴다.
enum ImagePrefetch {
    /// 한 장이 응답 없이 매달려 전체 진행률을 멈추지 않게 하는 URL별 상한
    static let timeout: TimeInterval = 15

    /// 체인을 앞에서부터 받는다. 받으면 멈추고, 실패(404 등)면 다음 URL.
    /// 시간 초과도 멈춘다 — 파일이 없는 게 아니라 네트워크 문제라 다음 URL도 소용없다.
    static func prefetch(_ chain: [URL]) async {
        for url in chain {
            if await load(url) != false { return }
        }
    }

    /// true = 받음(캐시에 있었던 것 포함), false = 실패, nil = 시간 초과.
    /// 시간 초과돼도 다운로드는 취소하지 않는다(RN과 같이, 늦게라도 받으면 캐시에 남는다).
    private static func load(_ url: URL) async -> Bool? {
        await withCheckedContinuation { continuation in
            let pending = OSAllocatedUnfairLock<CheckedContinuation<Bool?, Never>?>(initialState: continuation)
            let finish: @Sendable (Bool?) -> Void = { result in
                pending.withLock { c in defer { c = nil }; return c }?.resume(returning: result)
            }
            SDWebImageManager.shared.loadImage(with: url, options: [], progress: nil) { image, _, _, _, finished, _ in
                if finished { finish(image != nil) }
            }
            DispatchQueue.global().asyncAfter(deadline: .now() + timeout) { finish(nil) }
        }
    }

    /// 화면(AugmentImage)은 체인 첫 URL부터 그리므로, 첫 URL이 디스크에 있어야 "받아 둔 것"이다.
    static func isCached(_ chain: [URL]) -> Bool {
        guard let first = chain.first else { return true }
        return SDImageCache.shared.diskImageDataExists(withKey: SDWebImageManager.shared.cacheKey(for: first))
    }
}
