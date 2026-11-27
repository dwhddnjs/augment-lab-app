import SwiftUI

/// I-06a 스텁 — I-32 가 채운다. 시그니처: `MyPageScreen()`
struct MyPageScreen: View {
    var body: some View {
        List(0..<40, id: \.self) { Text(verbatim: "MyPageScreen \($0)") }
    }
}
