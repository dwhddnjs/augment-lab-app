import SwiftUI

/// I-06a 스텁 — I-30 가 채운다. 시그니처: `TierlistScreen()`
struct TierlistScreen: View {
    var body: some View {
        List(0..<40, id: \.self) { Text(verbatim: "TierlistScreen \($0)") }
    }
}
