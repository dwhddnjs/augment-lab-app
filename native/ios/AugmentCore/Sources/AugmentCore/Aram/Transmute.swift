/// 칼바람 희귀도·뽑기·전환 규칙 (RN `aram/rarity-odds.ts`·`aram/transmute.ts`). spec/aram.md §2.2–2.3.
/// 난수는 `using:`으로 주입한다 — 앱은 시스템 난수, 테스트는 시드 고정 난수.
public enum AramRules {
    public static let rarityOdds: [(Rarity, Double)] = [(.silver, 0.3), (.gold, 0.3), (.prismatic, 0.4)]
    /// 커맨드 라인은 실버·골드만. 프리즘은 해킹 리롤로만 얻는다.
    public static let commandLineOdds: [(Rarity, Double)] = [(.silver, 0.5), (.gold, 0.5)]

    /// 판도라의 상자 — 지금까지 얻은 증강을 같은 개수의 서로 다른 프리즘으로 모두 바꾼다.
    public static let pandoraId = "pandora-s-box"
    /// 전환 증강: 고르면 자신은 빌드에 들어가지 않고 효과만 낸다. rarity nil = 등급 무관.
    static let grants: [String: (rarity: Rarity?, count: Int)] = [
        "transmute-gold": (.gold, 1),
        "transmute-prismatic": (.prismatic, 1),
        "transmute-chaos": (nil, 2),
    ]
    static let transmuteIds: Set<String> = Set(grants.keys).union([pandoraId])

    /// 라운드 하나의 희귀도. 그 라운드의 모든 카드가 같은 색이다.
    public static func rollRarity(_ table: [(Rarity, Double)] = rarityOdds, using rng: inout some RandomNumberGenerator) -> Rarity {
        var r = Double.random(in: 0..<1, using: &rng)
        for (rarity, odds) in table {
            if r < odds { return rarity }
            r -= odds
        }
        return table[table.count - 1].0 // 부동소수점 오차로 맨 끝에 닿을 때만
    }

    /// pool에서 서로 다른 count개. `used`에 든 id는 건너뛰고, 뽑은 id를 `used`에 넣는다. 모자라면 뽑히는 만큼만.
    static func sampleDistinct(_ pool: [Augment], _ count: Int, _ used: inout Set<String>, using rng: inout some RandomNumberGenerator) -> [Augment] {
        var available = pool.filter { !used.contains($0.id) }
        var result: [Augment] = []
        while result.count < count, !available.isEmpty {
            let chosen = available.remove(at: Int.random(in: 0..<available.count, using: &rng))
            result.append(chosen)
            used.insert(chosen.id)
        }
        return result
    }

    /// 한 등급에서 count개. 그 등급이 모자라면 나머지는 등급 무관으로 채운다(라운드가 비지 않게).
    public static func drawOfRarity(_ pool: [Augment], _ rarity: Rarity, _ count: Int, using rng: inout some RandomNumberGenerator) -> [Augment] {
        var used = Set<String>()
        var result = sampleDistinct(pool.filter { $0.rarity == rarity }, count, &used, using: &rng)
        if result.count < count {
            result += sampleDistinct(pool, count - result.count, &used, using: &rng)
        }
        return result
    }

    /// 카드로 뽑을 수 있는 증강. exclude를 빼고, 아직 아무것도 안 골랐으면 판도라도 뺀다(고르는 순간 빈 픽).
    public static func cardPool(_ all: [Augment], exclude: some Sequence<String>, picked: [Augment]) -> [Augment] {
        var out = Set(exclude)
        if picked.isEmpty { out.insert(pandoraId) }
        return all.filter { !out.contains($0.id) }
    }

    /// 고른 카드를 빌드에 반영한다. 일반 증강은 그대로, 전환 증강은 자신 대신 얻은 증강이,
    /// 판도라는 지금까지 얻은 수만큼의 프리즘이 빌드를 통째로 대신한다. 전환끼리는 서로를 주지 않는다.
    /// exclude = 새로 얻을 수 없는 id(이미 얻은 것·이번 라운드 카드). granted는 호출측이 taken에 넣는다.
    public static func applyPick(
        _ chosen: Augment, picked: [Augment], all: [Augment], exclude: Set<String>, using rng: inout some RandomNumberGenerator
    ) -> (picked: [Augment], granted: [Augment]) {
        let isPandora = chosen.id == pandoraId
        let grant = grants[chosen.id]
        guard grant != nil || isPandora else { return (picked + [chosen], []) }

        let pool = all.filter { !exclude.contains($0.id) && !transmuteIds.contains($0.id) }
        let granted: [Augment]
        if isPandora {
            granted = drawOfRarity(pool, .prismatic, picked.count, using: &rng)
        } else if let grant, let rarity = grant.rarity {
            granted = drawOfRarity(pool, rarity, grant.count, using: &rng)
        } else {
            var used = Set<String>()
            granted = sampleDistinct(pool, grant!.count, &used, using: &rng)
        }
        let marked = granted.map { a -> Augment in
            var a = a
            a.transmuted = true
            return a
        }
        return (isPandora ? marked : picked + marked, granted)
    }
}
