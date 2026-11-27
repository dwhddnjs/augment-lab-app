import AugmentCore
import SwiftUI

/// 카드에 겹치는 헤드라이너 표식 (RN `card-marks.tsx`)
enum CardBadge: Sendable {
    /// K/DA 보너스 카드 — 카드 위 빈자리에 로고
    case kda
    /// 열혈 팬 21레벨 카드 — 윗변 가운데에 걸친 Worlds 로고
    case worlds
    /// HEARTSTEEL — 좌상단 모서리에 걸친 멤버 얼굴
    case sticker(StickerId)
}

/// HEARTSTEEL 라운드의 카드 밑 효과 줄. 스티커가 없는 카드도 `StickerLine(sticker: nil)`로 자리를 비워 리롤 줄을 맞춘다.
struct StickerLine: Sendable {
    var sticker: StickerId?
}

/// 칼바람 드래프트 카드 한 장 (RN `aram-card.tsx`) — 선택 연출 위에 증강 카드와 카드당 1회 리롤 버튼.
/// 표식은 카드와 함께 움직이도록 연출 안에 둔다. 리롤 버튼은 밖이라 같이 사라지지 않는다.
struct AramCard: View {
    let augment: Augment
    let index: Int
    let cardWidth: CGFloat
    let exitMode: CardExitMode
    let entryMode: CardEntryMode
    let disabled: Bool
    let rerolled: Bool
    let hacked: Bool
    var badge: CardBadge? = nil
    var stickerLine: StickerLine? = nil
    let onPick: () -> Void
    let onReroll: () -> Void

    var body: some View {
        // 효과 줄 자리만큼 간격을 줄인다. 낮은 가로 화면(높이 375pt)에서 카드는 더 줄일 여유가 없다.
        VStack(spacing: stickerLine != nil ? Spacing.two : Spacing.double) {
            PickCard(index: index, exitMode: exitMode, entryMode: entryMode, disabled: disabled, onPress: onPick) {
                VStack(spacing: 0) {
                    RarityCardFrame(augment: augment, cardWidth: cardWidth)
                        .overlay { if let badge { BadgeMark(badge: badge, rarity: augment.rarity, cardWidth: cardWidth) } }
                    if let stickerLine {
                        StickerLabel(sticker: stickerLine.sticker, cardWidth: cardWidth)
                    }
                }
            }
            RerollButton(used: rerolled, hacked: hacked, disabled: disabled || exitMode != .none, onPress: onReroll)
        }
    }
}

/// 표식 배치. 카드 위치는 헤드라이너와 무관하게 같다. 가로 화면 예산에 맞춘 크기라 Dynamic Type을 따르지 않는다.
private struct BadgeMark: View {
    let badge: CardBadge
    let rarity: Rarity
    let cardWidth: CGFloat

    /// K/DA 마크 높이(글로우 여백 포함, 폭 79). 더 키우면 카드 위 빈자리를 넘어 헤더에 붙는다.
    static let kdaHeight: CGFloat = 21
    /// Worlds 로고 폭(카드 폭 대비)과 그림 상자 중 윗변 위로 나가는 비율 — 인게임 21레벨 카드 캡처를 재서 맞춘 RN 값
    static let worldsWidth: CGFloat = 0.3
    static let worldsAbove: CGFloat = 0.55

    var body: some View {
        Group {
            switch badge {
            case .kda:
                HeadlinerLogo(.kda, size: Self.kdaHeight, plain: true)
                    .offset(y: -(Self.kdaHeight + Spacing.half))
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            case .worlds:
                // 빛나는 그림이라 라이트 모드에서도 칠하지 않는다.
                let mark = HeadlinerAssets.WorldsCardMark.self
                let width = cardWidth * Self.worldsWidth / mark.ink
                let height = width / mark.aspect
                Image(decorative: mark.asset).resizable().scaledToFit()
                    .frame(width: width, height: height)
                    .offset(y: -height * Self.worldsAbove)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            case .sticker(let id):
                StickerMark(sticker: id, rarity: rarity)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
        }
        .allowsHitTesting(false)
    }
}

/// HEARTSTEEL 스티커 — 카드 좌상단에 걸친 멤버 얼굴. 펜타킬 스킬 카드의 챔피언 얼굴과 같은 자리이고, 살짝 기울여 붙인 스티커처럼 보인다.
/// 테두리는 카드 프레임과 같은 등급색 1pt. 원은 4pt만 카드 밖이고 나머지는 어두운 카드 위라 모드와 무관하게 다크 팔레트다.
struct StickerMark: View {
    let sticker: StickerId
    let rarity: Rarity

    var body: some View {
        Image(decorative: HeadlinerAssets.stickerPortrait(sticker))
            .resizable()
            .scaledToFill() // 256×128 → 높이에 맞추고 가로 가운데
            .frame(width: SkillCard.portraitSize, height: SkillCard.portraitSize)
            .background(HeroOverlay.cardBase)
            .clipShape(Circle())
            .overlay(Circle().strokeBorder(RarityColors.color(rarity, .dark), lineWidth: 1))
            .rotationEffect(.degrees(10))
            .offset(x: SkillCard.portraitInset, y: SkillCard.portraitInset)
    }
}

/// HEARTSTEEL 스티커 효과 — 카드 밑에 "멤버: 효과". 이름은 강조어 색 고정, 효과는 스탯 구간만 그 스탯 색이다.
/// 폭은 카드 + 카드 사이 간격으로 고정하고 옆 간격 절반씩 넘친다 — 폭을 안 정하면 긴 문구가 카드 칸을 넓혀 얼굴·리롤 버튼이 어긋난다.
struct StickerLabel: View {
    let sticker: StickerId?
    let cardWidth: CGFloat

    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette

    /// 한국어는 최장 문구(이즈리얼 약 154pt)도 가장 좁은 칸(SE)에 한 줄, 영어는 요네(약 229pt)가 두 줄.
    /// ponytail: 언어별 최장 문구를 재서 줄 수를 고정했다. 문구가 길어지면 재서 맞춰야 한다.
    private var layout: (lines: Int, line: CGFloat, top: CGFloat) {
        store.data.locale == .ko ? (1, 13, Spacing.one) : (2, 12, Spacing.half)
    }

    var body: some View {
        let layout = layout
        Group {
            if let sticker, let text = store.data.headlinerTexts.stickers[sticker.rawValue] {
                CardLabel(text: attributed(text, lineHeight: layout.line), lines: layout.lines)
            } else {
                Color.clear
            }
        }
        .frame(width: cardWidth + CardLayout.gap, height: layout.line * CGFloat(layout.lines), alignment: .top)
        .frame(width: cardWidth)
        .padding(.top, layout.top)
        .allowsHitTesting(false)
    }

    private func attributed(_ text: HeadlinerTexts.Sticker, lineHeight: CGFloat) -> NSAttributedString {
        let scheme = palette.scheme
        let out = CardLabel.paragraph(text.name, size: 10, weight: .bold, lineHeight: lineHeight, color: StatTextColors.color("k", scheme) ?? palette.text.primary)
        out.append(markedParagraph(": " + text.full, size: 10, lineHeight: lineHeight, base: palette.text.primary) { StatTextColors.color($0, scheme) })
        return CardLabel.finish(out, lineHeight: lineHeight)
    }
}

#Preview("카드 3장 — 등장·선택·리롤") {
    AramCardsPreview()
        .environment(try! GameDataStore(locale: .ko))
}

private struct AramCardsPreview: View {
    @State private var anim = CardPickAnim(count: 3)
    @State private var cards: [Augment]
    @State private var rerolled = [false, false, false]
    @State private var hacked = false
    @State private var badge = 0
    private let pool: [Augment]

    init() {
        pool = try! GameData.bundled(locale: .ko).augmentPool
        _cards = State(initialValue: Array(pool.prefix(3)))
    }

    var body: some View {
        VStack(spacing: Spacing.three) {
            CardRow(topOffset: Spacing.five) {
                ForEach(cards.indices, id: \.self) { i in
                    AramCard(
                        augment: cards[i], index: i, cardWidth: 110,
                        exitMode: anim.exitModes[i], entryMode: anim.entryModes[i], disabled: anim.animating,
                        rerolled: rerolled[i], hacked: hacked,
                        badge: [nil, .kda, .worlds, .sticker(StickerId.allCases[i])][badge],
                        stickerLine: badge == 3 ? StickerLine(sticker: StickerId.allCases[i]) : nil,
                        onPick: { anim.pick(i) { next(); return false } },
                        onReroll: { anim.reroll(i) { cards[i] = pool.randomElement()!; rerolled[i] = true } }
                    )
                    .id("\(anim.roundKey)-\(cards[i].id)")
                }
            }
            HStack {
                Toggle("해킹", isOn: $hacked)
                Picker("표식", selection: $badge) {
                    Text("없음").tag(0); Text("K/DA").tag(1); Text("Worlds").tag(2); Text("스티커").tag(3)
                }
            }
            .padding(Spacing.three)
        }
        .surfaceBackground()
    }

    private func next() {
        cards = Array(pool.shuffled().prefix(3))
        rerolled = [false, false, false]
    }
}
