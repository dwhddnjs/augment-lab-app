import Testing
@testable import AugmentCore

/// 시드 고정 난수 — 통계 검사가 돌 때마다 같은 결과를 낸다.
struct SplitMix64: RandomNumberGenerator {
    var state: UInt64
    mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}

// RN `scripts/check-headliners.ts` 항목을 옮겼다. 통계는 20만 회, 허용 오차 ±1%.
struct HeadlinerRulesTests {
    static let rolls = 200_000
    static let tolerance = 0.01

    @Test func ids() {
        #expect(HeadlinerId.allCases.map(\.rawValue) == ["kda", "pentakill", "heartsteel", "true-damage", "disco", "cafe-cuties", "bees", "command-line", "worlds", "arcade", "debonair", "la-ilusion", "maestro"])
        #expect(StickerId.allCases.map(\.rawValue) == ["aphelios", "ezreal", "kayn", "ksante", "sett", "yone"])
        #expect(HeadlinerRules.draftEventIds.map(\.rawValue) == ["kda", "pentakill", "heartsteel", "command-line", "worlds", "maestro"])
    }

    @Test func pureRules() {
        typealias R = HeadlinerRules
        #expect(R.skillChoices([]) == [.q, .w, .e])
        #expect(R.skillChoices([.q]) == [.w, .e, .r])
        #expect(R.skillChoices([.w]) == [.q, .e, .r])
        #expect(R.skillChoices([.e]) == [.q, .w, .r])
        #expect(R.nextRarity(.silver) == .gold && R.nextRarity(.gold) == .prismatic && R.nextRarity(.prismatic) == nil)
        for id in HeadlinerId.allCases.map(\.rawValue) {
            #expect(R.roundsFor(id) == (["kda", "worlds"].contains(id) ? 5 : 4))
            #expect(R.cardsFor(id) == (id == "maestro" ? 4 : 3))
        }
        #expect(R.cardsFor("unknown") == 3 && R.roundsFor("unknown") == 4)
        #expect(R.anvilCount([]) == 0)
        #expect(R.anvilCount(["yone", "sett"]) == 0)
        #expect(R.anvilCount(["aphelios"]) == 2)
        #expect(R.anvilCount(["aphelios", "yone", "aphelios", "unknown"]) == 4)
    }

    @Test(arguments: AppLocale.allCases)
    func textsCoverEveryId(locale: AppLocale) throws {
        let t = try RepoData.gameData(locale).headlinerTexts
        #expect(Set(t.headliners.keys) == Set(HeadlinerId.allCases.map(\.rawValue)))
        #expect(Set(t.stickers.keys) == Set(StickerId.allCases.map(\.rawValue)))
        #expect(Set(t.skills.keys) == Set(SkillKey.allCases.map(\.rawValue)))
        #expect(t.skillTitle.contains("{spell}") && t.anvils.contains("{n}"))
    }

    @Test func headlinerRollIsUniform() {
        var rng = SplitMix64(state: 1)
        var counts: [HeadlinerId: Int] = [:]
        for _ in 0..<Self.rolls { counts[HeadlinerRules.rollHeadliner(using: &rng), default: 0] += 1 }
        #expect(counts.count == HeadlinerId.allCases.count)
        for (id, n) in counts {
            #expect(abs(Double(n) / Double(Self.rolls) - 1 / Double(HeadlinerId.allCases.count)) <= Self.tolerance, "\(id)")
        }
    }

    @Test func roundStickers() {
        var rng = SplitMix64(state: 2)
        var emptySlots = [0, 0, 0]
        var seen = Set<StickerId>()
        for _ in 0..<Self.rolls {
            let slots = HeadlinerRules.rollRoundStickers(using: &rng)
            let members = slots.compactMap { $0 }
            #expect(slots.count == 3 && members.count == 2 && Set(members).count == 2)
            emptySlots[slots.firstIndex(where: { $0 == nil })!] += 1
            seen.formUnion(members)
        }
        for n in emptySlots { #expect(abs(Double(n) / Double(Self.rolls) - 1 / 3) <= Self.tolerance) }
        #expect(seen.count == StickerId.allCases.count)
    }

    @Test func rerollSticker() {
        var rng = SplitMix64(state: 3)
        var filled = 0
        for _ in 0..<Self.rolls {
            let before = HeadlinerRules.rollRoundStickers(using: &rng)
            let empty = before.firstIndex(where: { $0 == nil })!
            let kept = (empty + 1) % 3
            #expect(HeadlinerRules.rerollSlotSticker(before, kept, using: &rng) == before) // 붙은 멤버는 그대로
            let after = HeadlinerRules.rerollSlotSticker(before, empty, using: &rng)
            for j in 0..<3 where j != empty { #expect(after[j] == before[j]) }
            if let s = after[empty] {
                filled += 1
                #expect(!before.contains(s)) // 같은 멤버가 두 번 붙지 않는다
            }
        }
        #expect(abs(Double(filled) / Double(Self.rolls) - 0.5) <= Self.tolerance)
    }
}
