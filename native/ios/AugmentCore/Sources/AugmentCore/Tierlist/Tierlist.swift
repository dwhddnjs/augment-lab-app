import Foundation

/// 티어리스트 계산 (RN `src/features/tierlist/tiers.ts`, `use-augment-groups.ts`). spec/data.md §7.
/// 앱은 티어를 계산하지 않는다 — aram.gg 결과를 그대로 보여 주고, 행은 이미 티어순이다(다시 정렬 금지).
public enum Tierlist {
    /// 한 줄 셀 수
    public static let columns = 2

    /// 소스 티어 1~4 → S~C. 범위 밖은 D.
    public static func augTier(_ sourceTier: Int) -> Tier {
        Tier.allCases.indices.contains(sourceTier - 1) ? Tier.allCases[sourceTier - 1] : .D
    }

    /// 0.583 → "58.3%" (JS `(n*100).toFixed(1)`과 같은 반올림)
    public static func pct(_ n: Double) -> String { jsToFixed(n * 100, 1) + "%" }

    /// footer 문구의 `{patch}`·`{date}`를 처음 한 번씩 채운다.
    public static func formatSource(_ text: String, _ file: TierlistFile) -> String {
        func first(_ s: String, _ token: String, _ value: String) -> String {
            guard let r = s.range(of: token) else { return s }
            return s.replacingCharacters(in: r, with: value)
        }
        return first(first(text, "{patch}", file.patch), "{date}", file.date)
    }

    public struct Section: Hashable, Sendable {
        public let tier: Tier
        /// `columns`개씩 끊은 줄. 마지막 줄은 모자랄 수 있다(화면이 빈 셀로 채운다).
        public let rows: [[TierRow]]
    }

    /// 티어별 섹션. 검색(`match`)은 챔피언을 숨기기만 하고 티어는 바꾸지 않는다. 빈 섹션은 뺀다.
    public static func sections(_ rows: [TierRow], match: ((TierRow) -> Bool)? = nil) -> [Section] {
        Tier.allCases.compactMap { tier in
            let slice = rows.filter { $0.tier == tier && (match?($0) ?? true) }
            guard !slice.isEmpty else { return nil }
            return Section(tier: tier, rows: stride(from: 0, to: slice.count, by: columns).map {
                Array(slice[$0..<min($0 + columns, slice.count)])
            })
        }
    }

    public static func findRow(_ rows: [TierRow], key: String) -> TierRow? {
        rows.first { $0.key == key }
    }

    public struct TierAugment: Hashable, Sendable {
        public let augment: Augment
        /// 소스 티어 1~4
        public let tier: Int
    }

    public struct AugmentGroup: Hashable, Sendable {
        public let rarity: Rarity
        /// 등급(S→C) 순. 같은 등급 안은 데이터 순서(= 승률순) 유지
        public let list: [TierAugment]
    }

    /// 추천 증강을 칼바람 풀과 잇고 prismatic → gold → silver로 묶는다. 풀에 없는 증강은 버린다.
    public static func augmentGroups(_ row: TierRow?, _ data: GameData) -> [AugmentGroup] {
        let pool = Dictionary(data.augmentPool.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        let entries: [TierAugment] = (row?.augments ?? []).compactMap { e in
            guard data.tierlist.augIds.indices.contains(e.index), let aug = pool[data.tierlist.augIds[e.index]] else { return nil }
            return TierAugment(augment: aug, tier: e.sourceTier)
        }
        return [Rarity.prismatic, .gold, .silver].compactMap { rarity in
            // 안정 정렬 — Swift `sorted`는 안정성을 보장하지 않아 원래 위치를 함께 비교한다
            let list = entries.enumerated().filter { $0.element.augment.rarity == rarity }
                .sorted { ($0.element.tier, $0.offset) < ($1.element.tier, $1.offset) }.map(\.element)
            return list.isEmpty ? nil : AugmentGroup(rarity: rarity, list: list)
        }
    }
}

/// JS `Number.prototype.toFixed(digits)`: 이진 값의 **정확한** 십진 전개에서 반올림하고, 동률이면 큰 쪽(0에서 먼 쪽).
/// C `printf`는 동률을 짝수 쪽으로 보내서(12.25 → "12.2", JS는 "12.3") 직접 구현한다.
func jsToFixed(_ x: Double, _ digits: Int) -> String {
    let exact = String(format: "%.80f", abs(x)) // Apple libc는 정확한 전개를 찍는다
    let parts = exact.split(separator: ".")
    var kept = Array(parts[0]) + Array(parts[1].prefix(digits))
    if let next = parts[1].dropFirst(digits).first, next >= "5" {
        var i = kept.count - 1
        while i >= 0 {
            if kept[i] == "9" { kept[i] = "0"; i -= 1 } else { kept[i] = Character(String(kept[i].wholeNumberValue! + 1)); break }
        }
        if i < 0 { kept.insert("1", at: 0) }
    }
    let intCount = kept.count - digits
    let body = String(kept[..<intCount]) + (digits > 0 ? "." + String(kept[intCount...]) : "")
    return (x < 0 && kept.contains { $0 != "0" } ? "-" : "") + body
}
