import SwiftUI
import UIKit

/// 카드 글자 — RN iOS `<Text>`가 만드는 문단 속성을 그대로 써서 줄바꿈·줄높이·말줄임을 RN과 같게 그린다.
/// - 줄높이: min = max = lineHeight, 기준선은 RN `RCTApplyBaselineOffset`처럼 (줄높이 − 글꼴 줄높이) / 2 만큼 올린다.
/// - 줄바꿈 전략: RN 기본은 none(한글도 글자 단위), `hangulWord`면 단어 단위(RN `lineBreakStrategyIOS="hangul-word"`).
/// - Dynamic Type을 따르지 않는다(RN `allowFontScaling={false}`) — 카드 안 배치가 글자 크기에 맞춰져 있다.
struct CardLabel: UIViewRepresentable {
    let text: NSAttributedString
    let lines: Int

    func makeUIView(context: Context) -> UILabel {
        let label = UILabel()
        label.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        label.setContentHuggingPriority(.defaultLow, for: .horizontal)
        return label
    }

    func updateUIView(_ label: UILabel, context: Context) {
        label.attributedText = text
        label.numberOfLines = lines
        label.lineBreakMode = .byTruncatingTail // 마지막 줄 "…"
    }

    func sizeThatFits(_ proposal: ProposedViewSize, uiView: UILabel, context: Context) -> CGSize? {
        guard let width = proposal.width else { return nil }
        return CGSize(width: width, height: uiView.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude)).height)
    }

    /// 가운데 정렬 문단. 강조 구간은 만든 뒤 `font`·`foregroundColor`를 덮어쓰고 `finish`를 부른다.
    static func paragraph(_ string: String, size: CGFloat, weight: UIFont.Weight, lineHeight: CGFloat, color: Color, hangulWord: Bool = false) -> NSMutableAttributedString {
        let style = NSMutableParagraphStyle()
        style.alignment = .center
        style.minimumLineHeight = lineHeight
        style.maximumLineHeight = lineHeight
        style.lineBreakStrategy = hangulWord ? .hangulWordPriority : []
        return NSMutableAttributedString(string: string, attributes: [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: UIColor(color),
            .paragraphStyle: style,
        ])
    }

    /// RN `RCTApplyBaselineOffset` — 가장 큰 글꼴 줄높이 기준으로 글자를 줄 가운데에 둔다.
    static func finish(_ text: NSMutableAttributedString, lineHeight: CGFloat) -> NSAttributedString {
        var fontLine: CGFloat = 0
        text.enumerateAttribute(.font, in: NSRange(location: 0, length: text.length)) { value, _, _ in
            if let font = value as? UIFont { fontLine = max(fontLine, font.lineHeight) }
        }
        if lineHeight >= fontLine {
            text.addAttribute(.baselineOffset, value: lineHeight / 2 - fontLine / 2, range: NSRange(location: 0, length: text.length))
        }
        return text
    }

    /// 폭 안에서 몇 줄로 그려지는지(줄 수 제한 없이)
    static func lineCount(_ text: NSAttributedString, width: CGFloat, lineHeight: CGFloat) -> Int {
        let height = text.boundingRect(with: CGSize(width: width, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin], context: nil).height
        return max(1, Int((height / lineHeight).rounded()))
    }
}
