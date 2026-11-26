import SwiftUI

/// I-06a 스텁 — I-31 이 채운다. `key` = 챔피언 숫자 key(id 아님). 닫기는 `router.back()`.
struct TierlistChampionScreen: View {
    let key: String

    @Environment(Router.self) private var router

    var body: some View {
        Button { router.back() } label: { Text(verbatim: "TierlistChampionScreen \(key) — 닫기") }
    }
}
