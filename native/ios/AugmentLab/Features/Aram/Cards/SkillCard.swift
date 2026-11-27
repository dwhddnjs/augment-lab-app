import AugmentCore
import SwiftUI

/// 펜타킬 스킬 강화 카드 (RN `skill-card.tsx`). 게임 카드 원본(배경·골드 프레임·문양)을 그대로 쌓는다.
/// 스킬 아이콘은 DDragon 원본이 64px이라 크게 키우면 깨진다 — 게임처럼 문양 안에 작게 둔다.
struct SkillCard: View {
    let skill: SkillKey
    let championId: String?
    let spells: ChampionSpells?
    let index: Int
    let cardWidth: CGFloat
    let exitMode: CardExitMode
    let entryMode: CardEntryMode
    let disabled: Bool
    let onPick: () -> Void

    /// 챔피언 얼굴 — 좌상단 꼭짓점에서 inset만큼 밖으로 걸친다. HEARTSTEEL 스티커도 같은 자리다.
    static let portraitSize: CGFloat = 32
    static let portraitInset = -Spacing.one
    static let logoSize: CGFloat = 40
    static let swirlSize: CGFloat = 74
    static let iconSize: CGFloat = 34

    @Environment(GameDataStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let data = store.data
        let w = cardWidth
        let h = (w * CardLayout.aspect).rounded()
        let spell = spells?[skill]
        let key = skill.rawValue.uppercased()
        let spellName = spell?.name ?? key
        let texts = data.headlinerTexts

        PickCard(index: index, exitMode: exitMode, entryMode: entryMode, disabled: disabled, onPress: onPick) {
            ZStack(alignment: .topLeading) {
                CardArt(rarity: .gold, width: w)

                VStack(spacing: 0) {
                    emblem(spell: spell, key: key, url: spell.map { data.cdn.spellImageURL($0.image) })
                    // 이름은 증강 카드(드래프트)와 같은 12pt. 설명은 문양 아래가 좁아 8pt.
                    CardLabel(text: plain(texts.skills[skill.rawValue] ?? key, size: 12, weight: .bold, line: 14, color: HeroOverlay.textPrimary), lines: 1)
                        .padding(.top, Spacing.one)
                    VStack(spacing: Spacing.half) {
                        CardLabel(text: descText(texts.skillTitle, spellName), lines: 2)
                        CardLabel(text: descText(texts.skillBonus, spellName), lines: 0)
                    }
                    .padding(.top, Spacing.one)
                }
                .padding(.top, Spacing.four)
                .padding(.horizontal, Spacing.three + Spacing.half)
                .frame(width: w, height: h, alignment: .top)

                if let champion = championId.flatMap({ data.championsById[$0] }) {
                    RemoteImage(data.cdn.championSquareURL(champion.imageKey), size: Self.portraitSize)
                        .clipShape(Circle())
                        .overlay(Circle().strokeBorder(SkillCardColors.portraitRing, lineWidth: 1.5))
                        .offset(x: Self.portraitInset, y: Self.portraitInset)
                }

                Image(decorative: HeadlinerAssets.logo(.pentakill).asset)
                    .resizable().scaledToFit()
                    .frame(width: Self.logoSize, height: Self.logoSize)
                    .offset(y: -Self.logoSize / 2)
                    .frame(width: w, alignment: .center)
            }
            .frame(width: w, height: h, alignment: .topLeading)
            .cardShadow(.gold, width: w, scheme: scheme) // 골드 프레임이라 골드 증강과 같은 그림자
        }
    }

    private func emblem(spell: ChampionSpell?, key: String, url: URL?) -> some View {
        ZStack {
            Image(decorative: HeadlinerAssets.SkillCardArt.swirl)
                .renderingMode(.template).resizable().scaledToFit()
                .foregroundStyle(SkillCardColors.swirl)
            VStack(spacing: Spacing.half) {
                ZStack {
                    if let spell { RemoteImage(url, size: Self.iconSize, accessibilityLabel: spell.name) }
                    Image(decorative: HeadlinerAssets.SkillCardArt.iconFrame).resizable()
                }
                .frame(width: Self.iconSize, height: Self.iconSize)
                .padding(.top, Spacing.one)
                CardLabel(text: plain("[\(key)]", size: 9, weight: .medium, line: 11, color: SkillCardColors.key), lines: 1)
                    .fixedSize()
            }
        }
        .frame(width: Self.swirlSize, height: Self.swirlSize)
    }

    private func plain(_ s: String, size: CGFloat, weight: UIFont.Weight, line: CGFloat, color: Color) -> NSAttributedString {
        CardLabel.finish(CardLabel.paragraph(s, size: size, weight: weight, lineHeight: line, color: color), lineHeight: line)
    }

    /// `{spell}` 자리에 스킬 이름, [e]강화 [s]스킬명 [h]회복 [b]보호막은 색으로. 한글 단어 단위 줄바꿈.
    private func descText(_ template: String, _ spellName: String) -> NSAttributedString {
        let text = markedParagraph(template.replacingOccurrences(of: "{spell}", with: spellName), size: 8, lineHeight: 12,
                                   base: SkillCardColors.body, hangulWord: true, colors: SkillCardColors.mark)
        return CardLabel.finish(text, lineHeight: 12)
    }
}

/// "[s]스킬[/s] [e]강화[/e]" → 표시 구간만 `colors(표시)` 색을 입힌 카드 문단(RN `renderMarked`). 글자는 500.
func markedParagraph(_ text: String, size: CGFloat, lineHeight: CGFloat, base: Color, hangulWord: Bool = false,
                     colors: (String) -> Color?) -> NSMutableAttributedString {
    parseMarked(text).reduce(into: NSMutableAttributedString()) { out, part in
        let color = part.mark.flatMap(colors) ?? base
        out.append(CardLabel.paragraph(part.text, size: size, weight: .medium, lineHeight: lineHeight, color: color, hangulWord: hangulWord))
    }
}
