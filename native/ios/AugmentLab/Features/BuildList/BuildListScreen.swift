import SwiftUI

/// I-06a 스텁 — I-21 가 채운다. 시그니처: `BuildListScreen()`
struct BuildListScreen: View {
    var body: some View {
        List(0..<40, id: \.self) { Text(verbatim: "BuildListScreen \($0)") }
    }
}
