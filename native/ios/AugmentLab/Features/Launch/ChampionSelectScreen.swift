import AugmentCore
import SwiftUI

/// I-06a 스텁 — I-23 이 채운다. 시작하면 `router.startDraft(...)`(시트 위에 드래프트가 쌓인다), X는 `router.back()`.
struct ChampionSelectScreen: View {
    let mode: LaunchMode
    let headliner: HeadlinerId?

    @Environment(Router.self) private var router

    var body: some View {
        VStack {
            Text(verbatim: "ChampionSelectScreen \(mode.rawValue) \(headliner?.rawValue ?? "-")")
            Button {
                switch mode {
                case .aram: router.startDraft(.aram(AramParams(championId: "Ahri", headliner: headliner)))
                case .custom: router.startDraft(.custom(championId: "Ahri"))
                }
            } label: { Text(verbatim: "시작(Ahri)") }
            Button { router.back() } label: { Text(verbatim: "닫기") }
        }
    }
}
