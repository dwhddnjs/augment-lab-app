import AugmentCore
import SwiftUI

/// 챔피언 스킬 아이콘 + Q/W/E/R 키 배지 (RN `headliners/components/skill-icon.tsx`).
/// 이미지가 없거나 실패해도 어느 스킬인지는 읽힌다. 배지 글자는 Dynamic Type을 따르지 않는다.
public struct SkillIcon: View {
    let spell: ChampionSpell?
    let skill: SkillKey
    let size: CGFloat
    @Environment(GameDataStore.self) private var store

    public init(spell: ChampionSpell?, skill: SkillKey, size: CGFloat) {
        self.spell = spell
        self.skill = skill
        self.size = size
    }

    public var body: some View {
        let badge = (size * 0.42).rounded()
        ZStack(alignment: .bottomTrailing) {
            Radius.shape(Radius.md).fill(HeroOverlay.cardBase)
            if let spell {
                TempRemoteImage(store.data.cdn.spellImageURL(spell.image), size: size, accessibilityLabel: spell.name)
                    .clipShape(Radius.shape(Radius.md))
            }
            Text(skill.rawValue.uppercased())
                .font(.system(size: (badge * 0.6).rounded(), weight: .heavy)) // RN 800
                .foregroundStyle(HeroOverlay.textPrimary)
                .frame(width: badge, height: badge)
                .background(HeroOverlay.cardBase, in: Radius.shape(Radius.sm))
                .overlay(Radius.shape(Radius.sm).strokeBorder(HeroOverlay.textSecondary, lineWidth: 1))
                .offset(x: Spacing.one, y: Spacing.one)
        }
        .frame(width: size, height: size)
    }
}

extension ChampionSpells {
    /// RN `spells?.[skill]`
    subscript(_ key: SkillKey) -> ChampionSpell {
        switch key {
        case .q: q
        case .w: w
        case .e: e
        case .r: r
        }
    }
}
