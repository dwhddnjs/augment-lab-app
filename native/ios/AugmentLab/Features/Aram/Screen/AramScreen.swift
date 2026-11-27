import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["round": "라운드", "skillRound": "스킬 강화", "exit": "나가기", "picks": "픽 현황",
         "exitConfirmAram": "칼바람을 종료할까요?", "exitOk": "종료", "exitCancel": "계속"],
    en: ["round": "Round", "skillRound": "Empower", "exit": "Exit", "picks": "Picks",
         "exitConfirmAram": "Exit ARAM?", "exitOk": "Exit", "exitCancel": "Continue"]
)

/// 칼바람 드래프트 화면 (RN `aram-screen.tsx`, spec aram.md §1·§3).
/// 헤드라이너는 라우트에서 받은 것(홈 시작 카드), 없으면 판마다 무작위(`AramDraft`).
/// 등장 연출이 화면을 덮고, 끝난 뒤에 카드를 마운트한다 — flip 등장은 카드가 마운트될 때 재생된다.
struct AramScreen: View {
    let params: AramParams

    @Environment(GameDataStore.self) private var store

    var body: some View {
        // 뽑기 풀은 환경에서만 얻는다 — 상태를 init에서 만들려고 한 겹 안쪽에 둔다.
        AramDraftView(params: params, pool: store.data.augmentPool)
    }
}

private struct AramDraftView: View {
    let params: AramParams

    @Environment(Router.self) private var router
    @Environment(AppSettings.self) private var settings
    @Environment(GameDataStore.self) private var store
    @Environment(\.palette) private var palette
    @State private var draft: AramDraft
    @State private var anim: CardPickAnim
    @State private var drawerOpen = false
    @State private var introDone = false
    @State private var screen = CGSize.zero

    /// 헤더 버튼 좌우 여백 — 카드 행 여백보다 넓게 잡아 버튼이 기기 끝에 붙지 않게
    private static let headerPad = Spacing.five
    /// 헤더 로고 잉크 긴 변. 정사각 로고는 40이면 라운드 pill(약 45pt)과 키가 같아 무겁다.
    private static let headerLogoInk: CGFloat = 32
    /// 헤더 밑에서 카드까지(화면 높이 대비). 카드 위 K/DA 마크가 헤더에서 떨어지고, 가장 긴 HEARTSTEEL 줄이 낮은 기기에서 넘치지 않는 값.
    private static let cardTopRatio: CGFloat = 0.07

    init(params: AramParams, pool: [Augment]) {
        self.params = params
        let draft = AramDraft(pool: pool, headliner: params.headliner)
        _draft = State(initialValue: draft)
        // 펜타킬 스킬 카드도 3장이라 같은 수를 쓴다
        _anim = State(initialValue: CardPickAnim(count: draft.cardCount))
    }

    var body: some View {
        let t = L.t(settings.locale)
        let id = draft.progress.id
        SideDrawer(isOpen: $drawerOpen, swipeEnabled: introDone) {
            VStack(spacing: 0) {
                header(t)
                if introDone { cards }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .overlay {
                if !introDone {
                    HeadlinerReveal(id: id) { introDone = true }
                }
            }
        } panel: { width in
            PickedDrawer(picked: draft.picked, width: width, championId: params.championId, headlinerId: id.rawValue,
                         skills: draft.progress.skills, stickers: draft.progress.stickers.map(\.rawValue))
        }
        // RN useLandscapeSize(창 전체 크기) — 회전 전 프레임에도 긴 변을 가로로 본다.
        // 안전 영역을 더해 창 크기로 되돌린다. 배경에 ignoresSafeArea만 걸면 안전 영역을 뺀 크기가 와서 카드가 RN보다 ≈4% 작았다(I-41-06).
        .onGeometryChange(for: CGSize.self, of: Self.windowSize) { screen = $0 }
        // 떠난 화면에서 commit이 돌면 아이템 화면이 뒤늦게 다시 쌓인다
        .onDisappear { anim.cancel() }
        // 리롤로 한 장만 바뀌어도 받는다(이미 받은 장은 캐시라 바로 끝난다)
        .task(id: draft.currentCards.map(\.id)) {
            await withTaskGroup(of: Void.self) { group in
                for card in draft.currentCards where !card.iconPath.isEmpty {
                    let chain = CDN.augmentImageURLs(card.iconPath)
                    group.addTask { await ImagePrefetch.prefetch(chain) }
                }
            }
        }
        // 펜타킬 스킬 아이콘은 첫 설치 프리웜에 없어 카드가 뜨기 전에 받아 둔다
        .task {
            guard id == .pentakill, let spells else { return }
            let cdn = store.data.cdn
            let urls = [spells.q, spells.w, spells.e, spells.r].map { cdn.spellImageURL($0.image) }
            await withTaskGroup(of: Void.self) { group in
                for url in urls { group.addTask { await ImagePrefetch.prefetch([url]) } }
            }
        }
    }

    private static func windowSize(_ geo: GeometryProxy) -> CGSize {
        let i = geo.safeAreaInsets
        return CGSize(width: geo.size.width + i.leading + i.trailing, height: geo.size.height + i.top + i.bottom)
    }

    private var spells: ChampionSpells? { store.data.championSpells[params.championId] }
    private var screenW: CGFloat { max(screen.width, screen.height) }
    private var screenH: CGFloat { min(screen.width, screen.height) }

    // MARK: 헤더

    private func header(_ t: @escaping (String) -> String) -> some View {
        let id = draft.progress.id
        // 열혈 팬의 21레벨 증강은 5라운드로 센다. K/DA 보너스는 4라운드 뒤 덤이라 `4 / 4`를 유지한다.
        let total = id == .worlds ? draft.rounds : HeadlinerRules.aramRounds
        return HStack {
            GlassButton(systemImage: "xmark", fallbackIcon: "close", role: .cancel, accessibilityLabel: t("exit")) {
                router.closeDraft.confirmExit(title: t("exitConfirmAram"), cancel: t("exitCancel"), ok: t("exitOk"))
            }
            Spacer()
            GlassSurface(cornerRadius: Radius.full) {
                VStack(spacing: Spacing.half) {
                    Text(t(draft.needsSkillPick ? "skillRound" : "round"))
                        .rnText(size: TypeStyle.label.size, lineHeight: TypeStyle.label.lineHeight, weight: .heavy)
                        .foregroundStyle(palette.text.primary)
                    RoundIndicator(round: min(draft.round, total), total: total)
                }
                .padding(.horizontal, Spacing.four)
                .padding(.vertical, Spacing.one)
            }
            // 라운드 표시가 헤더 한가운데 남도록 로고는 pill 왼쪽 바깥에 띄운다
            .overlay(alignment: .leading) {
                HeadlinerLogo(id, size: HeadlinerAssets.logoBoxHeight(id, inkSize: Self.headerLogoInk), plain: true)
                    .fixedSize()
                    .alignmentGuide(.leading) { $0[.trailing] + Spacing.double }
                    .accessibilityElement()
                    .accessibilityLabel(store.data.headlinerTexts.headliners[id.rawValue]?.name ?? id.rawValue)
            }
            Spacer()
            GlassButton(systemImage: "list.bullet", fallbackIcon: "format-list-bulleted", accessibilityLabel: t("picks")) {
                drawerOpen = true
            }
        }
        .padding(.horizontal, Self.headerPad)
        // 안전 영역 위에 얹히므로 위 여백은 작게
        .padding(.vertical, Spacing.two)
    }

    // MARK: 카드

    private var cards: some View {
        let count = draft.cardCount
        let cardWidth = CardLayout.cardWidth(screenWidth: screenW, screenHeight: screenH, count: count)
        let id = draft.progress.id
        // K/DA·열혈 팬의 5번째 선택은 라운드가 아니라 4라운드를 마친 뒤의 보너스다
        let bonus: CardBadge? = draft.round >= HeadlinerRules.aramRounds
            ? (id == .kda ? .kda : id == .worlds ? .worlds : nil) : nil
        return CardRow(topOffset: (screenH * Self.cardTopRatio).rounded()) {
            if draft.needsSkillPick {
                ForEach(Array(HeadlinerRules.skillChoices(draft.progress.skills).enumerated()), id: \.element) { i, skill in
                    SkillCard(skill: skill, championId: params.championId, spells: spells, index: i, cardWidth: cardWidth,
                              exitMode: anim.exitModes[i], entryMode: anim.entryModes[i], disabled: anim.animating) {
                        anim.pick(i) { leaveIfDone(draft.pickSkill(skill)) }
                    }
                    .id("\(anim.roundKey)-\(skill.rawValue)")
                }
            } else {
                ForEach(Array(draft.currentCards.enumerated()), id: \.element.id) { i, aug in
                    let sticker = draft.slotStickers[i]
                    AramCard(augment: aug, index: i, cardWidth: cardWidth,
                             exitMode: anim.exitModes[i], entryMode: anim.entryModes[i], disabled: anim.animating,
                             rerolled: draft.rerolled[i], hacked: draft.hacked,
                             badge: bonus ?? sticker.map(CardBadge.sticker),
                             stickerLine: id == .heartsteel ? StickerLine(sticker: sticker) : nil,
                             onPick: { anim.pick(i) { leaveIfDone(draft.pick(i)) } },
                             onReroll: { anim.reroll(i) { draft.reroll(i) } })
                        .id("\(anim.roundKey)-\(aug.id)")
                }
            }
        }
    }

    /// 마지막 라운드를 고르면 아이템 선택으로 넘어간다. 픽 연출이 끝난 뒤 불리므로 도중에 나가면 실행되지 않는다.
    /// 넘어가면 true — 카드가 고른 모습 그대로 멈춘다(CardPickAnim). 갈아 끼우지 않고 위에 쌓는다(DraftPresenter).
    private func leaveIfDone(_ result: AramPickResult) -> Bool {
        guard result.done else { return false }
        let p = result.progress
        router.pushItems(ItemSelectParams(
            picked: result.picked,
            headliner: BuildHeadliner(id: p.id.rawValue, skills: p.skills, stickers: p.stickers.map(\.rawValue)),
            championId: params.championId, mode: params.mode
        ))
        return true
    }
}
