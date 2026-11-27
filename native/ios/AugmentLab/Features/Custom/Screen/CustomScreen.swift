import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["exitConfirm": "커스텀을 종료할까요?", "exitMessage": "담은 증강과 아이템은 저장되지 않습니다.", "exitOk": "종료", "exitCancel": "계속", "save": "저장", "settings": "설정",
         "saveError": "빌드 저장에 실패했어요", "saveEmpty": "저장할 내용이 없어요", "ok": "확인"],
    en: ["exitConfirm": "Exit Custom?", "exitMessage": "Your picks won't be saved.", "exitOk": "Exit", "exitCancel": "Continue", "save": "Save", "settings": "Settings",
         "saveError": "Failed to save the build", "saveEmpty": "Nothing to save yet", "ok": "OK"]
)

/// 커스텀 모드 (RN `custom/screens/custom-screen.tsx`, spec custom.md). 전체 증강·아이템 풀에서 직접 골라 담는 가로 화면.
/// 좌 6.5 : 우 4.5. 왼쪽 카드를 길게 눌러 오른쪽 패널로 끌면 담긴다(빠른 모드면 탭 한 번).
/// 헤더 토글이 왼쪽 판(증강 ↔ 아이템)과 담기는 칸을 함께 바꾼다.
struct CustomScreen: View {
    let championId: String

    /// 가로 크기와 좌우 안전 영역이 들어온 뒤 그린다. **한 번 준비되면 내리지 않는다** — 본문이 사라지면 담은 것이 날아간다.
    @State private var ready = false
    @Environment(GameDataStore.self) private var store

    var body: some View {
        GeometryReader { geo in
            let landscape = geo.size.width > geo.size.height
            ZStack {
                if ready { CustomContent(data: store.data, championId: championId, bottomInset: geo.safeAreaInsets.bottom) }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            // "가로 모양" = 좌우 inset이 생겼거나(Face ID 기종) 아래가 0(홈 버튼 기종) — RN `useLandscapeReady`
            .onChange(of: landscape && (geo.safeAreaInsets.leading > 0 || geo.safeAreaInsets.bottom == 0), initial: true) { _, shaped in
                if shaped { ready = true }
            }
            // ponytail: 안전 영역이 끝내 가로 모양이 안 되면 0.5초 뒤 그냥 그린다(빈 화면보다 낫다) — RN과 같은 상한
            .task(id: landscape) {
                guard landscape, !ready, (try? await Task.sleep(for: .milliseconds(500))) != nil else { return }
                ready = true
            }
        }
        .surfaceBackground()
    }
}

/// 드래프트 상태는 전부 여기 — `championId`는 초기값일 뿐(패널의 "변경"이 바꾼다).
private struct CustomContent: View {
    let bottomInset: CGFloat

    @Environment(BuildStore.self) private var builds
    @Environment(AppSettings.self) private var settings
    @Environment(Router.self) private var router
    @Environment(\.palette) private var palette
    @State private var draft: CustomDraft
    @State private var drag: PickDrag
    @State private var drawerOpen = false
    @State private var changingChampion = false
    @State private var showingStats = false
    @State private var saving = false
    @State private var alert: String?

    /// `data`는 처음 한 번만 쓴다 — 드래프트가 화면 동안 들고 있는다(로케일은 드래프트 밖 마이페이지에서만 바뀐다).
    init(data: GameData, championId: String, bottomInset: CGFloat) {
        self.bottomInset = bottomInset
        let draft = CustomDraft(data: data, championId: championId)
        _draft = State(initialValue: draft)
        _drag = State(initialValue: PickDrag(draft: draft))
    }

    var body: some View {
        let t = L.t(settings.locale)
        SettingsDrawer(isOpen: $drawerOpen) {
            ZStack {
                VStack(spacing: 0) {
                    header(t)
                    content
                }
                // 위·아래 안전 영역은 먹지 않는다 — 그리드·목록이 화면 끝까지 흐르고, 마지막 줄만 bottomInset만큼 띄운다.
                // 위는 가로에서 늘 0인데 회전 뒤 늦게 0이 되어 헤더가 튄다.
                .ignoresSafeArea(.container, edges: [.top, .bottom])
                // 검색 키보드가 본문을 밀어 올리지 않는다(RN도 KeyboardAvoiding 없음) — 가로에선 화면 절반이 접힌다.
                .ignoresSafeArea(.keyboard)

                // 그리드 안에 두면 왼쪽 판 경계에서 잘려 오른쪽까지 못 간다
                PickGhost(drag: drag)

                if changingChampion {
                    ChampionChangeOverlay(selectedId: draft.championId, onSelect: { id in
                        draft.championId = id // 담은 것은 그대로
                        changingChampion = false
                    }, onClose: { changingChampion = false })
                }
                if showingStats, let champion = draft.champion {
                    ChampionStatOverlay(champion: champion, items: draft.items) { showingStats = false }
                }
            }
        } panel: {
            CustomSettingsPanel(draft: draft)
        }
        .alert(alert ?? "", isPresented: Binding(get: { alert != nil }, set: { if !$0 { alert = nil } })) {
            Button(t("ok"), role: .cancel) {}
        }
    }

    private var content: some View {
        GeometryReader { geo in
            // 좌우 폭과 드롭 경계를 같은 숫자에서 낸다
            let leftWidth = PickDrag.leftWidth(bodyWidth: geo.size.width)
            HStack(spacing: 0) {
                Group {
                    if draft.target == .augment {
                        AugmentPickGrid(draft: draft, drag: drag, bottomInset: bottomInset)
                    } else {
                        ItemPickGrid(draft: draft, drag: drag, bottomInset: bottomInset)
                    }
                }
                .frame(width: leftWidth)

                SelectedPanel(
                    champion: draft.champion, picked: draft.picked, items: draft.items, target: draft.target,
                    dropping: drag.dropping, bottomInset: bottomInset,
                    onSwitchTarget: draft.toggleTarget, onRemove: draft.remove, onRemoveItem: draft.removeItem,
                    onShowStats: { showingStats = true }, onChangeChampion: { changingChampion = true }, onClear: draft.clear
                )
                .frame(maxWidth: .infinity)
            }
            .onChange(of: geo.frame(in: .global).minX + leftWidth, initial: true) { _, boundary in drag.boundary = boundary }
        }
    }

    private func header(_ t: @escaping (String) -> String) -> some View {
        HStack(spacing: Spacing.two) {
            GlassButton(systemImage: "xmark", fallbackIcon: "close", role: .cancel, accessibilityLabel: t("exitOk")) {
                router.closeDraft.confirmExit(title: t("exitConfirm"), message: t("exitMessage"), cancel: t("exitCancel"), ok: t("exitOk"))
            }
            Spacer(minLength: 0)
            GlassButton(systemImage: "checkmark", fallbackIcon: "check", tint: palette.accent.default, accessibilityLabel: t("save")) { save(t) }
            GlassButton(systemImage: "slider.horizontal.3", fallbackIcon: "tune-variant", accessibilityLabel: t("settings")) { drawerOpen = true }
        }
        // 검색 + 토글은 헤더 정중앙 — 좌(1개)·우(2개) 버튼 수가 달라 나눠 배치하면 왼쪽으로 밀린다.
        .overlay {
            HStack(spacing: Spacing.two) {
                AugmentSearchField(query: $draft.query, target: draft.target)
                PickTargetToggle(target: draft.target, onToggle: draft.toggleTarget)
            }
        }
        .padding(.horizontal, Spacing.two)
        // 가로에서는 위 안전 영역이 0이라 이 값이 곧 화면 위 여백이다.
        .padding(.top, Spacing.two)
        .padding(.bottom, Spacing.one)
    }

    /// 챔피언이 없거나 아무것도 안 담았으면 알림. 저장은 동기라 RN `useAlive` 확인이 필요 없다.
    private func save(_ t: (String) -> String) {
        guard !saving else { return }
        guard let payload = draft.savePayload else { alert = t("saveEmpty"); return }
        saving = true
        do {
            let build = try builds.save(championId: payload.championId, augmentIds: payload.augmentIds,
                                        itemIds: payload.itemIds, custom: payload.custom)
            router.closeDraft.openBuild(build.id)
        } catch {
            alert = t("saveError")
            saving = false
        }
    }
}
