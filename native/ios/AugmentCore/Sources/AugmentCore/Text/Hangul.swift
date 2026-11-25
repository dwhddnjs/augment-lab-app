import Foundation

private let choseong: [Character] = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"]

/// 한글 음절(U+AC00–U+D7A3)을 초성으로, 나머지 문자는 그대로.
func toChoseong(_ s: String) -> String {
    String(s.unicodeScalars.map { u in
        (0xAC00...0xD7A3).contains(u.value) ? choseong[Int(u.value - 0xAC00) / 588] : Character(u)
    })
}

/// 이름 부분일치 + 한글 초성 검색 (RN `src/lib/hangul.ts` `matchName`). spec/data.md §5.
public func matchName(_ name: String, _ query: String) -> Bool {
    let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
    let q = trimmed.lowercased()
    if q.isEmpty { return true }
    if name.lowercased().contains(q) { return true }
    // 초성만(공백 허용)으로 된 질의일 때만 초성 비교. `아ㅌ`처럼 섞이면 불일치.
    let onlyJamo = trimmed.unicodeScalars.allSatisfy { (0x3131...0x314E).contains($0.value) || CharacterSet.whitespacesAndNewlines.contains($0) }
    return onlyJamo && toChoseong(name).contains(trimmed)
}
