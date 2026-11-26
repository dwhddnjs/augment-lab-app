import SwiftUI

/// I-06a 스텁 — I-33 가 채운다. 시그니처: `DataManageScreen()`
struct DataManageScreen: View {
    var body: some View {
        List(0..<40, id: \.self) { Text(verbatim: "DataManageScreen \($0)") }
    }
}
