/// 챔피언 역할 표시 순서 (RN `CHAMPION_TAGS`)
public let championTags = ["Fighter", "Assassin", "Mage", "Tank", "Marksman", "Support"]

/// 역할 라벨 (RN `CHAMPION_TAG_LABELS`)
public func championTagLabel(_ tag: String, _ locale: AppLocale) -> String {
    guard locale == .ko else { return tag }
    return [
        "Fighter": "전사", "Mage": "마법사", "Assassin": "암살자",
        "Tank": "탱커", "Marksman": "원거리", "Support": "서포터",
    ][tag] ?? tag
}
