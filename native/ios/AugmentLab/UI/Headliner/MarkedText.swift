import AugmentCore
import SwiftUI

/// "[s]스킬[/s] [e]강화[/e]!" → 표시한 구간만 `colors(표시)` 색을 입힌 글 (RN `aram/components/marked-text.tsx`).
/// 표시 밖(과 색이 없는 표시)은 감싼 Text의 색을 따른다. AttributedString이라 앞뒤 글과 한 Text로 이어 붙일 수 있다.
/// - 펜타킬 스킬 카드: `markedText(s, colors: SkillCardColors.mark)`
/// - HEARTSTEEL 스티커 문구: `markedText(s) { StatTextColors.color($0, .dark) }` (카드 위라 다크 고정)
public func markedText(_ text: String, colors: (String) -> Color?) -> AttributedString {
    parseMarked(text).reduce(into: AttributedString()) { out, part in
        var run = AttributedString(part.text)
        if let mark = part.mark, let color = colors(mark) { run.foregroundColor = color }
        out += run
    }
}

#Preview {
    VStack(alignment: .leading, spacing: Spacing.two) {
        Text(markedText("[s]혼돈의 폭풍[/s] [e]강화[/e]! [h]회복[/h]과 [b]보호막[/b]", colors: SkillCardColors.mark))
            .foregroundStyle(SkillCardColors.body)
        Text(markedText("[ad]공격력[/ad] [ap]주문력[/ap] [as]공속[/as] [hp]체력[/hp] [sv]흡혈[/sv] [x]색 없음[/x]") {
            StatTextColors.color($0, .dark)
        })
        .foregroundStyle(HeroOverlay.textPrimary)
    }
    .rnText(.label)
    .padding(Spacing.three)
    .background(HeroOverlay.cardBase)
}
