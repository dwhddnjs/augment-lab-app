import AugmentCore
import Foundation

/// 첫 설치 프리웜에서 받을 아이콘 목록(RN `use-image-prewarm` 의 `allUrls`). spec/app-shell.md §6.
/// 항목 하나가 폴백 URL 체인이다(증강만 여러 개, 나머지는 1개).
///
/// 순서: 증강(드래프트가 첫 소비처라 맨 앞) → 챔피언 square → 역할 아이콘 → 칼바람 상점 아이템.
/// - 증강은 `modes`가 빈 것(미출시·삭제·클래식 전용)을 뺀다. 옛 빌드에서만 보이니 볼 때 받는다.
/// - 앱에 넣어 둔 증강 아이콘은 체인이 비어 있어 빠진다.
/// - 첫 URL이 같은 체인(아이콘을 공유하는 증강)은 하나로 — JS `Map` 처럼 자리는 처음 것, 값은 마지막 것.
func prewarmChains(_ data: GameData) -> [[URL]] {
    let all: [[URL]] =
        data.augments.filter { !$0.modes.isEmpty }.map { CDN.augmentImageURLs($0.iconPath) }
        + data.champions.map { [data.cdn.championSquareURL($0.imageKey)] }
        + championTags.compactMap(CDN.championClassIconURL).map { [$0] }
        + data.itemPool.map { [data.cdn.itemImageURL($0.imageKey)] }

    var position: [URL: Int] = [:]
    var out: [[URL]] = []
    for chain in all {
        guard let first = chain.first else { continue }
        if let i = position[first] {
            out[i] = chain
        } else {
            position[first] = out.count
            out.append(chain)
        }
    }
    return out
}
