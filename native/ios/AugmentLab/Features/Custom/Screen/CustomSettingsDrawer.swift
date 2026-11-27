import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["control": "조작", "quick": "퀵모드", "sortTitle": "정렬", "default": "기본", "name": "이름순", "rarity": "티어순"],
    en: ["control": "Control", "quick": "Quick pick", "sortTitle": "Sort", "default": "Default", "name": "Name", "rarity": "Tier"]
)

/// 오른쪽 설정 서랍 껍데기 — 칼바람 `SideDrawer`(I-27)와 같은 폭·딤·스프링. 커스텀은 스와이프를 끄므로 제스처 부분만 뺐다.
/// 카드를 오른쪽 가장자리로 끌 때 서랍이 열리면 안 된다 → ⚙ 탭으로만 연다.
/// ponytail: 복사본. `SideDrawer`가 UI/로 승격되면 `SideDrawer(isOpen:swipeEnabled: false)`로 바꾼다.
struct SettingsDrawer<Content: View, Panel: View>: View {
    @Binding var isOpen: Bool
    @ViewBuilder let content: Content
    @ViewBuilder let panel: Panel

    @Environment(\.palette) private var palette
    @State private var progress: CGFloat = 0

    var body: some View {
        content
            .accessibilityHidden(isOpen)
            .overlay {
                GeometryReader { geo in
                    let width = min(340, geo.size.width * 0.38)
                    ZStack(alignment: .trailing) {
                        Color(token: "rgba(0,0,0,0.5)")
                            .opacity(progress)
                            .ignoresSafeArea()
                            .allowsHitTesting(isOpen)
                            .onTapGesture { isOpen = false }
                        panel
                            .frame(width: width)
                            .frame(maxHeight: .infinity)
                            .background(palette.surface.base.ignoresSafeArea(edges: .vertical))
                            .offset(x: (1 - progress) * width)
                            .accessibilityAction(.escape) { isOpen = false }
                    }
                }
                .ignoresSafeArea(edges: .horizontal)
            }
            .onChange(of: isOpen) { _, open in
                // RN drawer 기본 스프링(과감쇠 — 넘치지 않는다)
                withAnimation(.interpolatingSpring(mass: 3, stiffness: 1000, damping: 500)) { progress = open ? 1 : 0 }
            }
    }
}

/// 서랍 안 (RN `custom-settings-drawer.tsx`) — 빠른 모드 Toggle + 정렬 segmented(증강에만 적용).
/// "제목 + 컨트롤"을 한 행의 VStack으로 묶는다 — 섹션 헤더를 쓰면 제목↔컨트롤 간격이 그룹 사이 간격과 같아져 묶음이 안 읽힌다.
/// Picker는 반드시 segmented — menu는 팝오버 앵커가 움직이는 서랍과 어긋난다.
struct CustomSettingsPanel: View {
    @Bindable var draft: CustomDraft

    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let t = L.t(settings.locale)
        List {
            // 한 Section — 나누면 그룹 사이가 40pt 넘게 벌어진다.
            Section {
                group(t("control")) {
                    Toggle(isOn: $draft.quickMode) { Text(t("quick")).font(.footnote) }
                        .tint(palette.accent.default)
                }
                group(t("sortTitle")) {
                    Picker(t("sortTitle"), selection: $draft.sort) {
                        ForEach(CustomDraft.SortKey.allCases, id: \.self) { Text(t($0.rawValue)).tag($0) }
                    }
                    .pickerStyle(.segmented)
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .scrollIndicators(.hidden)
        .background(palette.surface.base)
        .tint(palette.accent.default)
        // 첫 섹션이 서랍 천장에 붙지 않게
        .padding(.top, Spacing.four)
        // 서랍이 화면 오른쪽 끝에 붙어 있어 창의 안전 영역을 물면 컨트롤이 오른쪽 60pt를 못 쓴다(RN ignoreSafeArea).
        .ignoresSafeArea(.container, edges: .horizontal)
    }

    private func group<Control: View>(_ title: String, @ViewBuilder control: () -> Control) -> some View {
        VStack(alignment: .leading, spacing: Spacing.two) {
            Text(title).font(.caption).foregroundStyle(palette.text.secondary)
            control()
        }
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
    }
}
