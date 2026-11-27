import SwiftUI

/// I-06a 스텁 — I-22 가 채운다. `saved` = 드래프트에서 저장하고 들어옴(전환 없이 나타남).
struct BuildDetailScreen: View {
    let id: String
    let saved: Bool

    var body: some View { Text(verbatim: "BuildDetailScreen \(id) saved=\(saved)") }
}
