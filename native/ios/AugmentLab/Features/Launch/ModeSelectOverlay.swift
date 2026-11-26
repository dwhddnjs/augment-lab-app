import SwiftUI

/// I-06a 스텁 — I-23 이 채운다. 배경을 누르면 `router.back()`, 모드를 고르면 `router.presentChampionSelect(mode)`.
struct ModeSelectOverlay: View {
    @Environment(Router.self) private var router
    @Environment(\.palette) private var palette

    var body: some View {
        ZStack {
            palette.surface.overlay.ignoresSafeArea().onTapGesture { router.back() }
            VStack {
                ForEach(LaunchMode.allCases, id: \.self) { mode in
                    Button { router.presentChampionSelect(mode) } label: { Text(verbatim: "ModeSelectOverlay — \(mode.rawValue)") }
                }
            }
        }
    }
}
