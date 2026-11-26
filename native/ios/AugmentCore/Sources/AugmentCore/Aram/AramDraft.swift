/// 이번 판 헤드라이너로 얻은 것(RN `progress: BuildHeadliner`). 저장할 때 `BuildHeadliner`(문자열 id)로 바꾼다.
public struct HeadlinerProgress: Equatable, Sendable {
    public var id: HeadlinerId
    public var skills: [SkillKey] = []
    public var stickers: [StickerId] = []
}

/// 픽 한 번의 결과. done이면 화면이 `picked`·`progress`로 아이템 선택에 넘어간다.
public struct AramPickResult {
    public var picked: [Augment]
    public var progress: HeadlinerProgress
    public var done: Bool
}

/// 칼바람 드래프트 상태 머신 (RN `useAram`). UI 없음 — 화면(I-25b)은 이 상태만 그린다.
public struct AramDraft {
    /// 뽑기 풀(`GameData.augmentPool`)
    public let pool: [Augment]
    /// 헤드라이너로 얻은 것. 마지막 스킬 선택은 넣지 않는다(pickSkill 참고).
    public private(set) var progress: HeadlinerProgress
    public private(set) var round = 0
    public private(set) var currentCards: [Augment] = []
    /// 빌드에 남는 증강
    public private(set) var picked: [Augment] = []
    /// 이번 판에 고르거나 얻은 id 전부 — 빌드에서 빠진 것(전환 카드, 판도라로 바뀐 증강)도 다시 카드로 나오지 않게.
    public private(set) var taken: Set<String> = []
    /// 슬롯마다 이번 라운드 리롤을 썼는지
    public private(set) var rerolled: [Bool] = []
    /// HEARTSTEEL 슬롯 스티커(그 밖의 헤드라이너는 전부 nil)
    public private(set) var slotStickers: [StickerId?] = []
    private var hackUsed = false
    private var rng: any RandomNumberGenerator

    public init(pool: [Augment], headliner: HeadlinerId? = nil, rng: any RandomNumberGenerator = SystemRandomNumberGenerator()) {
        self.pool = pool
        self.rng = rng
        progress = HeadlinerProgress(id: headliner ?? HeadlinerRules.rollHeadliner(using: &self.rng))
        startRound()
    }

    public var rounds: Int { HeadlinerRules.roundsFor(progress.id.rawValue) }
    public var cardCount: Int { HeadlinerRules.cardsFor(progress.id.rawValue) }
    var odds: [(Rarity, Double)] { progress.id == .commandLine ? AramRules.commandLineOdds : AramRules.rarityOdds }

    /// 펜타킬은 1라운드 전(Q/W/E)과 마지막 라운드 뒤(남은 키)에 스킬을 고른다.
    public var needsSkillPick: Bool {
        progress.id == .pentakill && (progress.skills.isEmpty || (round >= rounds && progress.skills.count == 1))
    }

    /// 커맨드 라인: 라운드 첫 리롤이 해킹(한 등급 상승)이다.
    public var hacked: Bool { progress.id == .commandLine && !hackUsed }

    /// 슬롯 카드를 바꾼다. 라운드당 슬롯마다 1회, 희귀도 유지(해킹이면 한 단계 위). 못 바꾸면 nil.
    @discardableResult
    public mutating func reroll(_ idx: Int) -> Augment? {
        guard !rerolled[idx] else { return nil }
        // 리롤하는 카드 자신도 뺀다 — 같은 카드가 다시 나오면 기회만 쓰고 끝난다.
        let candidates = AramRules.cardPool(pool, exclude: taken.union(currentCards.map(\.id)), picked: picked)
        let card = currentCards[idx]
        let rarity = (hacked ? HeadlinerRules.nextRarity(card.rarity) : nil) ?? card.rarity
        guard let replacement = AramRules.drawOfRarity(candidates, rarity, 1, using: &rng).first else { return nil }

        currentCards[idx] = replacement
        rerolled[idx] = true
        hackUsed = true
        // 스티커는 슬롯에 붙어 있어 그대로다. 빈칸만 리롤로 멤버가 붙기도 한다.
        if progress.id == .heartsteel {
            slotStickers = HeadlinerRules.rerollSlotSticker(slotStickers, idx, using: &rng)
        }
        return replacement
    }

    /// 슬롯 카드를 고른다. 마지막 라운드면 done(펜타킬은 스킬을 하나 더 골라야 끝난다).
    public mutating func pick(_ idx: Int) -> AramPickResult {
        let chosen = currentCards[idx]
        let (nextPicked, granted) = AramRules.applyPick(
            chosen, picked: picked, all: pool, exclude: taken.union(currentCards.map(\.id)), using: &rng
        )
        taken.insert(chosen.id)
        taken.formUnion(granted.map(\.id))
        picked = nextPicked
        if let sticker = slotStickers[idx] { progress.stickers.append(sticker) }
        round += 1
        if round < rounds { startRound() }
        return AramPickResult(picked: picked, progress: progress, done: round >= rounds && progress.id != .pentakill)
    }

    /// 펜타킬 스킬. 두 번째 선택이면 done — 그 선택은 상태에 넣지 않는다(넣으면 needsSkillPick이 꺼져
    /// 화면을 떠나는 사이에 카드가 다시 뜬다). 저장할 스킬은 결과의 progress에 있다.
    public mutating func pickSkill(_ skill: SkillKey) -> AramPickResult {
        var next = progress
        next.skills.append(skill)
        let done = next.skills.count >= 2
        if !done { progress = next }
        return AramPickResult(picked: picked, progress: next, done: done)
    }

    private mutating func startRound() {
        currentCards = AramRules.drawOfRarity(
            AramRules.cardPool(pool, exclude: taken, picked: picked), AramRules.rollRarity(odds, using: &rng), cardCount, using: &rng
        )
        rerolled = Array(repeating: false, count: cardCount)
        hackUsed = false
        slotStickers = progress.id == .heartsteel
            ? HeadlinerRules.rollRoundStickers(using: &rng)
            : Array(repeating: nil, count: cardCount)
    }
}
