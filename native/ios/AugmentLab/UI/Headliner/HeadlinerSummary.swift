import AugmentCore
import SwiftUI

private let L = L10n(ko: ["headliner": "헤드라이너"], en: ["headliner": "Headliner"])

/// 좁은 가로 패널(compact)에선 40pt 아이콘이 글자 폭을 먹어 설명이 한 줄 더 내려간다.
private enum IconSize {
    static let normal: CGFloat = 40
    static let compact: CGFloat = 32
}

private let statAnvilIcon = CDN.cdragonIconURL("/lol-game-data/assets/ASSETS/Items/Icons2D/220000_StatAnvil.png")

/// 이번 판 헤드라이너와 그걸로 얻은 것 (RN `headliners/components/headliner-summary.tsx`).
/// 픽 현황 서랍·아이템 패널·빌드 상세가 함께 쓴다. 저장된 빌드 헤드라이너(`id`·`skills`·`stickers`)를 그대로 받고,
/// 모르는 id(옛 빌드)면 아무것도 그리지 않는다. 헤드라이너가 없는 빌드는 호출측이 그리지 않는다.
public struct HeadlinerSummary: View {
    let id: String
    let skills: [SkillKey]
    let stickers: [String]
    let championId: String?
    let compact: Bool
    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    /// - skills: 펜타킬 — 강화한 순서대로
    /// - stickers: HEARTSTEEL — 고른 스티커, 중복 가능(모르는 값은 무시)
    public init(id: String, skills: [SkillKey] = [], stickers: [String] = [], championId: String? = nil, compact: Bool = false) {
        self.id = id
        self.skills = skills
        self.stickers = stickers
        self.championId = championId
        self.compact = compact
    }

    public var body: some View {
        if let headliner = HeadlinerId(rawValue: id) { content(headliner) }
    }

    private func content(_ headliner: HeadlinerId) -> some View {
        let texts = store.data.headlinerTexts
        let spells = championId.flatMap { store.data.championSpells[$0] }
        let entry = texts.headliners[headliner.rawValue]
        let accent = RarityColors.color(.gold, palette.scheme)
        let iconSize = compact ? IconSize.compact : IconSize.normal
        let t = L.t(settings.locale)

        return VStack(alignment: .leading, spacing: Spacing.two) {
            Text(t("headliner")).rnText(.label).foregroundStyle(palette.text.secondary)

            DetailCardRow(accentColor: palette.accent.default, title: entry?.name ?? "", description: entry?.description, compact: compact) {
                HeadlinerLogo(headliner, size: iconSize)
            }

            ForEach(skills, id: \.self) { skill in
                let spell = spells?[skill]
                DetailCardRow(accentColor: accent,
                              title: [texts.skills[skill.rawValue], spell?.name].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "),
                              description: texts.skillBonusShort, compact: compact) {
                    SkillIcon(spell: spell, skill: skill, size: iconSize)
                }
            }

            ForEach(StickerId.allCases, id: \.self) { sticker in
                let count = stickers.filter { $0 == sticker.rawValue }.count
                if count > 0, let text = texts.stickers[sticker.rawValue] {
                    DetailCardRow(accentColor: accent,
                                  title: count > 1 ? "\(text.name) ×\(count)" : text.name,
                                  // 색 표기는 카드 위 문구에서만 쓴다
                                  description: sticker == .aphelios
                                      ? fillFirst(texts.anvils, "{n}", String(HeadlinerRules.anvilCount(stickers)))
                                      : stripMarks(text.full),
                                  compact: compact) {
                        Image(decorative: HeadlinerAssets.stickerPortrait(sticker))
                            .resizable()
                            .scaledToFill()
                            .frame(width: iconSize, height: iconSize)
                            .background(HeroOverlay.cardBase)
                            .clipShape(Circle())
                    } meta: {
                        if sticker == .aphelios {
                            TempRemoteImage(statAnvilIcon, size: 16).clipShape(Radius.shape(Radius.sm))
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    @Previewable @State var settings = AppSettings(store: MemoryKeyValueStore())
    ScrollView {
        VStack(spacing: Spacing.four) {
            HeadlinerSummary(id: "pentakill", skills: [.q, .r], championId: "Aphelios")
            HeadlinerSummary(id: "heartsteel", stickers: ["aphelios", "aphelios", "sett"], compact: true)
            HeadlinerSummary(id: "kda")
        }
        .padding(Spacing.three)
    }
    .surfaceBackground()
    .environment(try! GameDataStore(locale: settings.locale))
    .appSettings(settings)
    .providesPalette()
}
