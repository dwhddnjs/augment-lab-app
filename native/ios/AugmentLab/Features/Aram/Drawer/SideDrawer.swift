import SwiftUI

/// 오른쪽 front 서랍 (RN `react-native-drawer-layout` 기본값 그대로). spec/design-system.md §3.10.
/// - 폭 min(340, 화면 폭 × 0.38), 배경 `surface.base`, 딤 rgba(0,0,0,0.5) × 진행도, 딤을 누르면 닫힌다.
/// - 스프링 stiffness 1000 · damping 500 · mass 3(과감쇠), 동작 줄이기 무시.
/// - 스와이프: 닫혀 있으면 오른쪽 가장자리 32에서만, 열려 있으면 어디서나. 가로 5에 시작, 세로가 먼저 5면 포기.
///   손을 떼면 60 넘게 끌었거나 5 넘게 + 속도 500 초과면 그 방향으로, 아니면 원래대로.
/// - `swipeEnabled`: 칼바람은 등장 연출이 끝난 뒤부터, 커스텀은 끔.
struct SideDrawer<Content: View, Panel: View>: View {
    @Binding var isOpen: Bool
    var swipeEnabled = true
    let content: Content
    let panel: (_ width: CGFloat) -> Panel

    init(isOpen: Binding<Bool>, swipeEnabled: Bool = true,
         @ViewBuilder content: () -> Content, @ViewBuilder panel: @escaping (_ width: CGFloat) -> Panel) {
        _isOpen = isOpen
        self.swipeEnabled = swipeEnabled
        self.content = content()
        self.panel = panel
    }

    static func width(screenWidth: CGFloat) -> CGFloat { min(340, screenWidth * 0.38) }
    static var edgeWidth: CGFloat { 32 }
    static var minOffset: CGFloat { 5 }
    static var minDistance: CGFloat { 60 }
    static var minVelocity: CGFloat { 500 }

    @Environment(\.palette) private var palette
    /// 0 = 닫힘, 1 = 열림. 스프링이 살짝 넘겨도 그릴 때 0~1로 자른다(RN overshootClamping).
    @State private var progress: CGFloat = 0
    @State private var screenWidth: CGFloat = 0
    @State private var drag: Drag?

    private struct Drag {
        var rejected: Bool
        var startProgress: CGFloat
        /// 열린 서랍 바깥(딤)에서 잡았으면 손가락이 서랍 끝에 닿을 때까지 서랍이 따라오지 않는다(RN front 동작).
        var touchDistance: CGFloat
    }

    private var drawerWidth: CGFloat { Self.width(screenWidth: screenWidth) }

    var body: some View {
        content
            .accessibilityHidden(isOpen)
            .overlay { drawerLayer }
            .simultaneousGesture(swipe, including: swipeEnabled ? .all : .subviews)
            .onChange(of: isOpen) { _, open in animate(to: open, velocity: 0) }
    }

    private var drawerLayer: some View {
        GeometryReader { geo in
            let w = Self.width(screenWidth: geo.size.width)
            let shown = min(max(progress, 0), 1)
            ZStack(alignment: .trailing) {
                Color(token: "rgba(0,0,0,0.5)")
                    .opacity(shown)
                    .ignoresSafeArea()
                    .allowsHitTesting(isOpen)
                    .onTapGesture { isOpen = false }
                panel(w)
                    .frame(width: w)
                    .frame(maxHeight: .infinity)
                    .background(palette.surface.base.ignoresSafeArea(edges: .vertical))
                    .offset(x: (1 - shown) * w)
                    .accessibilityAction(.escape) { isOpen = false }
            }
            .onAppear { screenWidth = geo.size.width }
            .onChange(of: geo.size.width) { _, width in screenWidth = width }
        }
        // 오른쪽 안전 영역(가로 노치)까지 서랍이 붙는다 — 그리드가 서랍 끝까지 찬다.
        .ignoresSafeArea(edges: .horizontal)
    }

    private var swipe: some Gesture {
        DragGesture(minimumDistance: Self.minOffset, coordinateSpace: .global)
            .onChanged { value in
                if drag == nil {
                    let vertical = abs(value.translation.height) > abs(value.translation.width)
                    let offEdge = !isOpen && value.startLocation.x < screenWidth - Self.edgeWidth
                    drag = Drag(
                        rejected: vertical || offEdge,
                        startProgress: progress,
                        touchDistance: min(max(screenWidth - drawerWidth - value.startLocation.x, 0), screenWidth)
                    )
                }
                guard let drag, !drag.rejected, drawerWidth > 0 else { return }
                // 서랍 위치(0 = 열림, 폭 = 닫힘)
                let start = (1 - drag.startProgress) * drawerWidth
                let x = min(max(start + value.translation.width - drag.touchDistance, 0), drawerWidth)
                var instant = Transaction()
                instant.disablesAnimations = true
                withTransaction(instant) { progress = 1 - x / drawerWidth }
            }
            .onEnded { value in
                defer { drag = nil }
                guard let drag, !drag.rejected else { return }
                let dx = value.translation.width
                let vx = value.velocity.width
                let decided = (abs(dx) > Self.minOffset && abs(vx) > Self.minVelocity) || abs(dx) > Self.minDistance
                // 오른쪽 서랍: 왼쪽으로 밀면 열린다
                let next = decided ? (vx == 0 ? dx : vx) < 0 : isOpen
                animate(to: next, velocity: vx)
                isOpen = next
            }
    }

    /// `velocity`: 손을 뗀 순간 가로 속도(pt/s). 스프링은 남은 거리 대비 속도를 받는다.
    private func animate(to open: Bool, velocity: CGFloat) {
        let target: CGFloat = open ? 1 : 0
        guard progress != target else { return }
        let relative = drawerWidth > 0 ? (-velocity / drawerWidth) / (target - progress) : 0
        withAnimation(.interpolatingSpring(mass: 3, stiffness: 1000, damping: 500, initialVelocity: relative)) {
            progress = target
        }
    }
}
