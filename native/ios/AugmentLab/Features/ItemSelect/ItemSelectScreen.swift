import AugmentCore
import SDWebImageSwiftUI
import SwiftUI

private let L = L10n(
    ko: ["title": "아이템 선택", "stats": "스탯", "augments": "증강", "save": "저장", "saveError": "빌드 저장에 실패했어요",
         "exitConfirm": "저장하지 않고 나갈까요?", "exitOk": "나가기", "exitCancel": "계속"],
    en: ["title": "Item Select", "stats": "Stats", "augments": "Augments", "save": "Save", "saveError": "Failed to save the build",
         "exitConfirm": "Leave without saving?", "exitOk": "Leave", "exitCancel": "Continue"]
)

/// 아이템 선택 (RN `items/screens/item-select-screen.tsx` + `hooks/use-item-select.ts`, spec item-select.md).
/// 가로 / 좌 7 : 우 3 — 좌: 세로 필터 + 8열 그리드 + 떠 있는 트레이, 우: 챔피언·합산 스탯·헤드라이너·증강.
/// 파라미터는 `Route(url:)`(I-06a)가 RN처럼 방어적으로 파싱해 넘긴다(깨진 picked → [], headliner → nil).
struct ItemSelectScreen: View {
    let params: ItemSelectParams

    /// 가로 크기와 좌우 안전 영역이 들어온 뒤 그린다. **한 번 준비되면 내리지 않는다** — 본문이 사라지면 담은 아이템이 날아간다.
    @State private var ready = false

    var body: some View {
        GeometryReader { geo in
            let landscape = geo.size.width > geo.size.height
            ZStack {
                if ready { ItemSelectContent(params: params) }
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

private struct ItemSelectContent: View {
    let params: ItemSelectParams
    @Environment(GameDataStore.self) private var store
    @Environment(BuildStore.self) private var builds
    @Environment(AppSettings.self) private var settings
    @Environment(Router.self) private var router
    @Environment(\.palette) private var palette
    @State private var filter: ItemFilter?
    @State private var selectedIds: [String] = []
    @State private var saving = false
    @State private var saveFailed = false

    var body: some View {
        let t = L.t(settings.locale)
        let pool = store.data.itemPool
        let shown = filter.map { f in pool.filter(f.matches) } ?? pool
        let selected = resolveIds(selectedIds, in: Dictionary(pool.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a }))
        let champion = store.data.championsById[params.championId]

        VStack(spacing: 0) {
            header(t)
            GeometryReader { geo in
                let leftWidth = geo.size.width * 0.7
                HStack(spacing: 0) {
                    HStack(spacing: 0) {
                        ItemFilterBar(active: filter) { filter = $0 }
                        ItemGrid(items: shown, cellSize: ItemGrid.cellSize(areaWidth: leftWidth - ItemFilterBar.width),
                                 selectedIds: selectedIds, onItemPress: toggle)
                    }
                    .frame(width: leftWidth)
                    // 필터 사이드바를 뺀 그리드 영역 가운데, 아래에서 8 위
                    .overlay(alignment: .bottom) {
                        ItemSlotTray(items: selected) { item in selectedIds.removeAll { $0 == item.id } }
                            .frame(maxWidth: .infinity)
                            .padding(.leading, ItemFilterBar.width)
                            .padding(.bottom, Spacing.two)
                    }
                    ItemDetailPanel(champion: champion, itemStats: selected.map(\.stats), picked: params.picked,
                                    headliner: params.headliner, width: geo.size.width - leftWidth,
                                    statsLabel: t("stats"), augmentsLabel: t("augments"))
                        .frame(width: geo.size.width - leftWidth)
                }
            }
        }
        // 좌우 안전 영역만 쓴다. 오른쪽이 빠지면 저장 버튼이 홈 인디케이터 제스처 영역에 걸려 눌리지 않는다.
        // 위는 쓰지 않는다 — 가로에선 늘 0인데 회전 뒤 늦게 0이 된다.
        .ignoresSafeArea(.container, edges: [.top, .bottom])
        .alert(t("saveError"), isPresented: $saveFailed) {}
        // 진입 시 이 모드의 아이템 아이콘을 디스크 캐시에 받아 둔다(첫 설치 때 빈 칸 깜빡임 방지)
        .onAppear { SDWebImagePrefetcher.shared.prefetchURLs(pool.map { store.data.cdn.itemImageURL($0.imageKey) }) }
    }

    private func header(_ t: @escaping (String) -> String) -> some View {
        HStack(spacing: Spacing.three) {
            GlassButton(systemImage: "xmark", fallbackIcon: "close", role: .cancel, accessibilityLabel: t("exitOk")) {
                // 저장 외의 유일한 출구 — 확인 후 세로로 돌려 홈으로
                router.closeDraft.confirmExit(title: t("exitConfirm"), cancel: t("exitCancel"), ok: t("exitOk"))
            }
            HStack(alignment: .lastTextBaseline, spacing: Spacing.two) {
                Text(t("title")).rnText(.heading).foregroundStyle(palette.text.primary)
                Text(verbatim: "\(selectedIds.count) / \(Item.maxPerBuild)").rnText(.label).foregroundStyle(palette.text.secondary)
            }
            Spacer(minLength: 0)
            GlassButton(systemImage: "checkmark", fallbackIcon: "check", tint: palette.accent.default, accessibilityLabel: t("save"), action: save)
        }
        .padding(.leading, Spacing.two)
        .padding(.trailing, Spacing.three)
        .padding(.top, Spacing.double)
        .padding(.bottom, Spacing.two)
    }

    private func toggle(_ item: Item) {
        if let i = selectedIds.firstIndex(of: item.id) {
            selectedIds.remove(at: i)
        } else if selectedIds.count < Item.maxPerBuild {
            selectedIds.append(item.id)
        }
    }

    /// 0개도 저장한다. 저장은 동기라 RN `useAlive`(await 뒤 화면이 살아 있는지) 확인이 필요 없다.
    private func save() {
        guard !saving else { return }
        saving = true
        do {
            let build = try builds.save(
                championId: params.championId,
                augmentIds: params.picked.map(\.id),
                itemIds: selectedIds,
                transmutedIds: params.picked.filter(\.transmuted).map(\.id),
                headliner: params.headliner
            )
            router.closeDraft.openBuild(build.id)
        } catch {
            saveFailed = true
            saving = false
        }
    }
}
