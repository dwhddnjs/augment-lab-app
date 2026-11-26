import SwiftUI

/// I-06a 스텁 — I-20 가 채운다. 시그니처: `HomeScreen()`
struct HomeScreen: View {
    var body: some View {
        List(0..<40, id: \.self) { Text(verbatim: "HomeScreen \($0)") }
    }
}
