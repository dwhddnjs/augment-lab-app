import Testing
@testable import AugmentCore

/// RN `check-rarity-odds.mjs` + `check-transmute.ts` 항목, 그리고 헤드라이너별 한 판 시뮬레이션.
struct AramTests {
    static let all = try! RepoData.gameData(.ko).augmentPool
    static let transmutes: Set<String> = ["transmute-gold", "transmute-prismatic", "transmute-chaos", AramRules.pandoraId]
    static let normal = all.filter { !transmutes.contains($0.id) }

    func byId(_ id: String) -> Augment {
        let a = Self.all.first { $0.id == id }
        #expect(a != nil, "칼바람 풀에 \(id)가 없다")
        return a!
    }

    // MARK: check-rarity-odds.mjs (20만 회, ±3%p)

    @Test func rarityOdds() {
        var rng = SplitMix64(state: 1)
        #expect(abs(AramRules.rarityOdds.map(\.1).reduce(0, +) - 1) < 1e-9)
        var counts: [Rarity: Int] = [:]
        let rolls = 200_000
        for _ in 0..<rolls { counts[AramRules.rollRarity(using: &rng), default: 0] += 1 }
        for (rarity, expected) in AramRules.rarityOdds {
            #expect(abs(Double(counts[rarity] ?? 0) / Double(rolls) - expected) <= 0.03, "\(rarity)")
        }

        var silver = 0
        for _ in 0..<rolls {
            let r = AramRules.rollRarity(AramRules.commandLineOdds, using: &rng)
            #expect(r != .prismatic, "커맨드 라인 라운드에 프리즘")
            if r == .silver { silver += 1 }
        }
        #expect(abs(Double(silver) / Double(rolls) - 0.5) <= 0.03)
    }

    // MARK: check-transmute.ts

    @Test func cardPoolRules() {
        let n = Self.normal
        #expect(!AramRules.cardPool(Self.all, exclude: [], picked: []).contains { $0.id == AramRules.pandoraId }, "1라운드에 판도라")
        #expect(AramRules.cardPool(Self.all, exclude: [], picked: [n[0]]).contains { $0.id == AramRules.pandoraId }, "2라운드부터 판도라")
        #expect(!AramRules.cardPool(Self.all, exclude: [n[0].id], picked: [n[0]]).contains { $0.id == n[0].id }, "exclude가 빠지지 않는다")

        var rng = SplitMix64(state: 2)
        let r = AramRules.applyPick(n[1], picked: [n[0]], all: Self.all, exclude: [n[0].id, n[1].id], using: &rng)
        #expect(r.picked.map(\.id) == [n[0].id, n[1].id])
        #expect(r.granted.isEmpty)
    }

    @Test func transmuteAndPandora() {
        var rng = SplitMix64(state: 3)
        let n = Self.normal
        for i in 0..<2_000 {
            let had = [n[i % n.count], n[(i + 7) % n.count], n[(i + 13) % n.count]]
            let exclude = Set(had.map(\.id))

            for (id, count, rarity) in [("transmute-gold", 1, Rarity.gold), ("transmute-prismatic", 1, .prismatic), ("transmute-chaos", 2, nil)] {
                let r = AramRules.applyPick(byId(id), picked: had, all: Self.all, exclude: exclude.union([id]), using: &rng)
                guard r.picked.count == had.count + count else { Issue.record("\(id) 개수 \(r.picked.count)"); return }
                guard Array(r.picked.prefix(had.count)) == had else { Issue.record("\(id)가 기존 증강을 건드렸다"); return }
                for g in r.granted {
                    guard !exclude.contains(g.id), !Self.transmutes.contains(g.id), rarity == nil || g.rarity == rarity else {
                        Issue.record("\(id)가 잘못된 증강을 줬다: \(g.id)"); return
                    }
                }
                guard Set(r.granted.map(\.id)).count == count, r.picked.dropFirst(had.count).allSatisfy(\.transmuted),
                      had.allSatisfy({ !$0.transmuted }) else { Issue.record("\(id) 중복·표시·원본 불변"); return }
            }

            for k in [1, 3] {
                let r = AramRules.applyPick(byId(AramRules.pandoraId), picked: Array(had.prefix(k)), all: Self.all,
                                            exclude: exclude.union([AramRules.pandoraId]), using: &rng)
                guard r.picked.count == k, r.picked.allSatisfy({ $0.rarity == .prismatic && $0.transmuted && !exclude.contains($0.id) }),
                      Set(r.picked.map(\.id)).count == k else { Issue.record("판도라 \(k)개"); return }
            }
        }
    }

    // MARK: 상태 머신

    /// 헤드라이너마다 여러 판을 끝까지 굴린다(리롤 섞어서).
    @Test(arguments: HeadlinerId.allCases)
    func simulateFullDraft(headliner: HeadlinerId) {
        for seed in UInt64(0)..<50 {
            var d = AramDraft(pool: Self.all, headliner: headliner, rng: SplitMix64(state: seed))
            var result: AramPickResult?
            var steps = 0
            while result?.done != true {
                steps += 1
                guard steps <= 10 else { Issue.record("\(headliner) 끝나지 않는다"); return }
                if d.needsSkillPick {
                    result = d.pickSkill(HeadlinerRules.skillChoices(d.progress.skills)[0])
                    continue
                }
                #expect(d.currentCards.count == d.cardCount)
                #expect(Set(d.currentCards.map(\.id)).isDisjoint(with: d.taken), "이미 얻은 증강이 카드로 나왔다")
                if d.round == 0 { #expect(!d.currentCards.contains { $0.id == AramRules.pandoraId }) }
                if headliner == .heartsteel {
                    #expect(d.slotStickers.compactMap { $0 }.count == 2)
                } else {
                    #expect(d.slotStickers.allSatisfy { $0 == nil })
                }
                if seed % 2 == 0 {
                    d.reroll(0)
                    #expect(d.reroll(0) == nil, "슬롯 리롤은 라운드당 1회")
                }
                let stickers = d.progress.stickers.count
                let sticker = d.slotStickers[1]
                result = d.pick(1)
                #expect(d.progress.stickers.count == stickers + (sticker == nil ? 0 : 1))
            }
            let r = result!
            #expect(d.round == d.rounds)
            #expect(Set(r.picked.map(\.id)).count == r.picked.count, "같은 증강 두 번")
            #expect(!r.picked.contains { Self.transmutes.contains($0.id) }, "전환 카드가 빌드에 들어갔다")
            #expect(r.progress.skills.count == (headliner == .pentakill ? 2 : 0))
            if headliner == .pentakill { #expect(d.needsSkillPick, "마지막 스킬은 상태에 넣지 않는다") }
        }
    }

    @Test func roundsAndCards() {
        #expect(AramDraft(pool: Self.all, headliner: .kda).rounds == 5)
        #expect(AramDraft(pool: Self.all, headliner: .worlds).rounds == 5)
        #expect(AramDraft(pool: Self.all, headliner: .maestro).currentCards.count == 4)
        #expect(AramDraft(pool: Self.all, headliner: .disco).rounds == 4)
    }

    @Test func rerollKeepsRarityAndSticker() {
        for seed in UInt64(0)..<200 {
            var d = AramDraft(pool: Self.all, headliner: .heartsteel, rng: SplitMix64(state: seed))
            let before = d.currentCards[0]
            let sticker = d.slotStickers[0]
            let rarity = before.rarity
            guard let after = d.reroll(0) else { continue }
            #expect(after.id != before.id && after.rarity == rarity)
            if let sticker { #expect(d.slotStickers[0] == sticker, "붙은 스티커는 그대로") }
            #expect(Set(d.slotStickers.compactMap { $0 }).count == d.slotStickers.compactMap { $0 }.count)
        }
    }

    @Test func commandLineHack() {
        for seed in UInt64(0)..<200 {
            var d = AramDraft(pool: Self.all, headliner: .commandLine, rng: SplitMix64(state: seed))
            #expect(d.currentCards.allSatisfy { $0.rarity != .prismatic }, "커맨드 라인은 실버·골드로 시작")
            #expect(d.hacked)
            let rarity = d.currentCards[0].rarity
            let after = d.reroll(0)
            #expect(after?.rarity == HeadlinerRules.nextRarity(rarity), "첫 리롤은 한 단계 위")
            #expect(!d.hacked)
            let second = d.currentCards[1].rarity
            #expect(d.reroll(1)?.rarity == second, "두 번째 리롤은 등급 유지")
            _ = d.pick(0)
            #expect(d.hacked, "다음 라운드에 다시 해킹")
        }
    }
}
