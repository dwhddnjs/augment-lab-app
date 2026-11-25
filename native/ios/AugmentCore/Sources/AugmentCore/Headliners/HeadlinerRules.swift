/// 헤드라이너 규칙 (RN `src/features/headliners/rules.ts`). spec/aram.md §2.1.
/// 난수는 `using:`으로 주입한다 — 앱은 시스템 난수, 테스트는 시드 고정 난수.

public enum HeadlinerId: String, CaseIterable, Codable, Sendable {
    case kda, pentakill, heartsteel
    case trueDamage = "true-damage"
    case disco
    case cafeCuties = "cafe-cuties"
    case bees
    case commandLine = "command-line"
    case worlds, arcade, debonair
    case laIlusion = "la-ilusion"
    case maestro
}

public enum StickerId: String, CaseIterable, Codable, Sendable {
    case aphelios, ezreal, kayn, ksante, sett, yone
}

public enum SkillKey: String, CaseIterable, Codable, Sendable {
    case q, w, e, r
}

public enum HeadlinerRules {
    public static let aramRounds = 4
    /// 드래프트 규칙을 바꾸는 헤드라이너 — 홈 StartCard에서 앞에 놓는다
    public static let draftEventIds: [HeadlinerId] = [.kda, .pentakill, .heartsteel, .commandLine, .worlds, .maestro]
    static let bonusRoundIds: Set<String> = ["kda", "worlds"]
    static let anvilsPerAphelios = 2
    static let rerollStickerChance = 0.5

    public static func rollHeadliner(using rng: inout some RandomNumberGenerator) -> HeadlinerId {
        HeadlinerId.allCases.randomElement(using: &rng)!
    }

    /// maestro 4장, 나머지 3장(모르는 id 포함)
    public static func cardsFor(_ id: String) -> Int { id == "maestro" ? 4 : 3 }

    /// kda·worlds는 보너스 픽으로 5라운드
    public static func roundsFor(_ id: String) -> Int { bonusRoundIds.contains(id) ? aramRounds + 1 : aramRounds }

    public static func nextRarity(_ rarity: Rarity) -> Rarity? {
        switch rarity {
        case .silver: .gold
        case .gold: .prismatic
        case .prismatic: nil
        }
    }

    /// 펜타킬: 첫 선택은 Q/W/E, 두 번째는 남은 키(R 포함)
    public static func skillChoices(_ chosen: [SkillKey]) -> [SkillKey] {
        chosen.isEmpty ? [.q, .w, .e] : SkillKey.allCases.filter { !chosen.contains($0) }
    }

    /// HEARTSTEEL: 3칸 중 2칸에 서로 다른 멤버, 1칸은 빈칸
    public static func rollRoundStickers(using rng: inout some RandomNumberGenerator) -> [StickerId?] {
        var members = StickerId.allCases
        let empty = Int.random(in: 0..<3, using: &rng)
        return (0..<3).map { i in i == empty ? nil : members.remove(at: Int.random(in: 0..<members.count, using: &rng)) }
    }

    /// 리롤: 붙어 있던 멤버는 그 칸에 남는다. 빈칸은 50% 확률로 아직 안 붙은 멤버를 받는다.
    public static func rerollSlotSticker(_ stickers: [StickerId?], _ idx: Int, using rng: inout some RandomNumberGenerator) -> [StickerId?] {
        guard stickers[idx] == nil, Double.random(in: 0..<1, using: &rng) < rerollStickerChance else { return stickers }
        let free = StickerId.allCases.filter { !stickers.contains($0) }
        var next = stickers
        next[idx] = free.randomElement(using: &rng)
        return next
    }

    /// 저장된 스티커(모르는 값 포함) 중 aphelios 1개당 모루 2개
    public static func anvilCount(_ stickers: [String]) -> Int {
        stickers.filter { $0 == StickerId.aphelios.rawValue }.count * anvilsPerAphelios
    }
}
