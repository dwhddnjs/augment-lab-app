import Foundation
import SwiftUI

/// 아이콘 출처. RN에서 쓰던 그대로: SF Symbol / MaterialCommunityIcons / MaterialIcons(26 미만 탭바).
/// MCI·MI는 RN과 같은 폰트 파일을 번들해(I-00) 글리프를 그대로 그린다 — 모양이 RN과 픽셀 단위로 같다.
public enum Icon: Hashable, Sendable {
    case sf(String)
    case mci(String)
    case mi(String)
}

public struct IconView: View {
    let icon: Icon
    let size: CGFloat

    public init(_ icon: Icon, size: CGFloat) { self.icon = icon; self.size = size }

    public var body: some View {
        switch icon {
        case .sf(let name):
            Image(systemName: name).font(.system(size: size))
        case .mci(let name):
            Text(Glyphs.mci[name] ?? "").font(.custom("MaterialDesignIcons", fixedSize: size))
        case .mi(let name):
            Text(Glyphs.mi[name] ?? "").font(.custom("MaterialIcons-Regular", fixedSize: size))
        }
    }
}

/// glyphmap JSON(`이름 → 코드포인트`) → 문자. 앱 시작 후 처음 쓸 때 한 번 읽는다.
enum Glyphs {
    static let mci = load("MaterialCommunityIcons")
    static let mi = load("MaterialIcons")

    private static func load(_ name: String) -> [String: String] {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let map = try? JSONSerialization.jsonObject(with: data) as? [String: Int]
        else { assertionFailure("glyphmap 없음: \(name)"); return [:] }
        return map.compactMapValues { UnicodeScalar($0).map { String(Character($0)) } }
    }
}
