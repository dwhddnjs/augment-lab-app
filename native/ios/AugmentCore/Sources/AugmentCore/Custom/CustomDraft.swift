import Foundation
import Observation

/// 커스텀 화면의 상태와 규칙 (RN `use-custom-draft.ts`). spec/custom.md §3.
///
/// 뽑기가 없는 샌드박스라 라운드·리롤이 없다. 칼바람 풀 전체를 필터·정렬해 펼치고,
/// 사용자가 담은 것만 `picked`(증강) / `items`(아이템)에 쌓는다. 헤더 토글(`target`)로 둘을 갈아끼우고 검색어를 함께 쓴다.
/// 저장 중 표시·저장 호출·이동은 화면(I-29d) 몫이다 — 여기는 `savePayload`로 저장할 수 있는지와 무엇을 저장할지만 정한다.
@Observable
public final class CustomDraft {
    /// 한 빌드에 담는 증강 수. 아이템은 `Item.maxPerBuild`(6).
    public static let maxAugments = 5

    public enum SortKey: String, CaseIterable, Sendable { case `default`, name, rarity }
    /// 왼쪽 목록이 펼친 것 = 담기는 곳
    public enum PickTarget: Sendable { case augment, item }
    /// 화면이 이걸 보고 햅틱을 고른다.
    public enum AddResult: Sendable { case added, duplicate, full }

    /// 로케일이 바뀌면 화면이 새 데이터를 넣는다(목록·이름이 따라 바뀐다). 담은 것은 그대로 둔다.
    public var data: GameData
    /// 패널의 "챔피언 변경" — 담은 것은 유지한다.
    public var championId: String
    public private(set) var target: PickTarget = .augment
    /// nil = 전체 희귀도
    public var tier: Rarity?
    public var itemFilter: ItemFilter = ItemFilter.all[0]
    public var query = ""
    public var sort: SortKey = .default
    public var quickMode = false
    public private(set) var picked: [Augment] = []
    public private(set) var items: [Item] = []

    public init(data: GameData, championId: String) {
        self.data = data
        self.championId = championId
    }

    /// 데이터에 없는 id로 들어올 수 있어(딥링크·복원) nil이 정상 상태다.
    public var champion: Champion? { data.championsById[championId] }

    /// 증강 목록: 희귀도 && 이름 검색 → 정렬. 기본 정렬은 풀 순서 그대로.
    public var list: [Augment] {
        let filtered = data.augmentPool.filter { (tier == nil || $0.rarity == tier) && matchName($0.name, query) }
        let locale = Locale(identifier: data.locale.rawValue)
        let byName = { (a: Augment, b: Augment) in a.name.compare(b.name, locale: locale) }
        switch sort {
        case .default: return filtered
        case .name: return stableSorted(filtered) { byName($0, $1) == .orderedAscending }
        case .rarity:
            return stableSorted(filtered) { a, b in
                let (ra, rb) = (Self.rarityRank[a.rarity]!, Self.rarityRank[b.rarity]!)
                return ra != rb ? ra < rb : byName(a, b) == .orderedAscending
            }
        }
    }

    /// 아이템은 진열 순서가 곧 상점 순서라 `sort`를 태우지 않는다.
    public var itemList: [Item] {
        data.itemPool.filter { itemFilter.matches($0) && matchName($0.name, query) }
    }

    public var pickedIds: Set<String> { Set(picked.map(\.id)) }
    public var itemIds: Set<String> { Set(items.map(\.id)) }

    /// 뒤집기는 지금 값 기준으로만 한다. 검색어도 비운다 — 증강 검색어가 아이템 목록을 "결과 없음"으로 만든다.
    public func toggleTarget() {
        target = target == .augment ? .item : .augment
        query = ""
    }

    /// 판정과 추가를 한 번에 한다 → 연타로 연달아 들어와도 중복·정원이 정확하다.
    @discardableResult
    public func add(_ augment: Augment) -> AddResult {
        Self.append(augment, to: &picked, limit: Self.maxAugments)
    }

    @discardableResult
    public func addItem(_ item: Item) -> AddResult {
        Self.append(item, to: &items, limit: Item.maxPerBuild)
    }

    public func remove(_ id: String) { picked.removeAll { $0.id == id } }
    public func removeItem(_ id: String) { items.removeAll { $0.id == id } }

    /// 휴지통 = 선택 초기화. 증강·아이템을 함께 비운다.
    public func clear() {
        picked = []
        items = []
    }

    /// 저장할 내용. nil = 저장 불가(챔피언을 못 찾았거나 아무것도 안 담음) → 화면이 "저장할 내용이 없어요".
    /// 저장 버튼에 비활성 상태가 없어서 여기서 막는다 — 안 막으면 되살릴 수 없는 빈 빌드가 목록 맨 위에 쌓인다.
    public var savePayload: SavePayload? {
        guard champion != nil, !(picked.isEmpty && items.isEmpty) else { return nil }
        return SavePayload(championId: championId, augmentIds: picked.map(\.id), itemIds: items.map(\.id))
    }

    /// RN `saveBuild({ mode: 'aram', custom: true, championId, augmentIds, itemIds })` — 헤드라이너·transmutedIds 없음.
    public struct SavePayload: Equatable, Sendable {
        public let mode = "aram"
        public let custom = true
        public let championId: String
        public let augmentIds: [String]
        public let itemIds: [String]
    }

    /// 티어순 정렬 기준 — 높은 등급이 위로
    static let rarityRank: [Rarity: Int] = [.prismatic: 0, .gold: 1, .silver: 2]

    private static func append<T: Identifiable>(_ x: T, to list: inout [T], limit: Int) -> AddResult {
        if list.contains(where: { $0.id == x.id }) { return .duplicate }
        if list.count >= limit { return .full }
        list.append(x)
        return .added
    }
}

/// JS `Array.prototype.sort`처럼 안정 정렬 — Swift `sorted`는 안정성을 보장하지 않는다.
private func stableSorted<T>(_ xs: [T], by less: (T, T) -> Bool) -> [T] {
    xs.enumerated().sorted { less($0.element, $1.element) || (!less($1.element, $0.element) && $0.offset < $1.offset) }.map(\.element)
}
