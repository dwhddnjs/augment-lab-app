import AugmentCore
import SwiftUI
import UIKit

/// 드래그 중인 것. 고스트 모양과 담을 곳을 고른다.
enum DragPayload {
    case augment(Augment)
    case item(Item)

    var id: String {
        switch self {
        case .augment(let a): "augment-\(a.id)"
        case .item(let i): "item-\(i.id)"
        }
    }
}

/// 왼쪽 그리드 → 오른쪽 패널로 끌어 담기 (RN `custom-screen.tsx`의 드래그 상태 + `drag-cell.tsx`). spec/design-system.md §3.9.
/// 화면(I-29d)이 하나 만들어 두 그리드·고스트·패널에 넘긴다:
/// - `boundary` = 본문 왼쪽 끝(global x) + `leftWidth(bodyWidth:)` — 좌우 폭과 경계를 같은 숫자에서 낸다.
/// - 패널은 `dropping`만 읽는다(경계를 넘나들 때만 바뀐다 → 매 프레임 다시 그리지 않는다).
/// - 화면 맨 위에 `PickGhost(drag:)`를 얹는다(그리드 안에 두면 왼쪽 패널 경계에서 잘린다).
/// 좌표는 모두 global(윈도) — UIKit 제스처가 윈도 좌표를 준다.
@MainActor @Observable
final class PickDrag {
    /// 좌:우 = 6.5:4.5 → 합 11. 드롭 판정 경계도 이 비율에서 나온다.
    static let leftRatio: CGFloat = 6.5 / 11
    /// 손가락을 따라다니는 고스트 크기. 카드 원본은 오른쪽 패널을 통째로 가린다.
    static let ghostSize: CGFloat = 64
    /// 롱프레스 후 드래그 시작 — 짧으면 스크롤이 드래그로 오인되고, 길면 굼뜨다.
    static let longPress: TimeInterval = 0.18

    static func leftWidth(bodyWidth: CGFloat) -> CGFloat { (bodyWidth * leftRatio).rounded() }

    let draft: CustomDraft
    /// 드롭 경계(global x). 그리드가 그려지기 전엔 무한대 — 아무것도 담기지 않는다.
    var boundary: CGFloat = .infinity

    /// 고스트에 그릴 것. nil이면 드래그 중이 아니다.
    private(set) var dragged: DragPayload?
    private(set) var location: CGPoint = .zero
    /// 손가락이 경계를 넘었는지. 넘나들 때만 쓴다 — 같은 값을 다시 써도 읽는 뷰가 다시 그려진다.
    private(set) var overDrop = false

    init(draft: CustomDraft) { self.draft = draft }

    /// 패널의 드롭 베일
    var dropping: Bool { dragged != nil && overDrop }

    func start(_ payload: DragPayload, at point: CGPoint) {
        dragged = payload
        move(to: point)
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    func move(to point: CGPoint) {
        location = point
        let over = point.x > boundary
        if over != overDrop { overDrop = over }
    }

    /// `x`가 nil이면 취소(시스템이 손가락을 가져감) — RN의 −1. 경계 왼쪽에서 놓아도 담지 않는다.
    func end(_ payload: DragPayload, at x: CGFloat?) {
        // 다른 셀의 드래그를 끝내지 않는다
        guard dragged?.id == payload.id else { return }
        dragged = nil
        if overDrop { overDrop = false }
        if let x, x > boundary { commit(payload) }
    }

    /// 드롭 · 빠른 모드 탭 공통. 추가됨 light, 중복·가득 참(증강 5 · 아이템 6) warning.
    func commit(_ payload: DragPayload) {
        let result = switch payload {
        case .augment(let a): draft.add(a)
        case .item(let i): draft.addItem(i)
        }
        if result == .added {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        } else {
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        }
    }
}

extension View {
    /// 셀을 끌 수 있게 한다(RN `DragCell`). `enabled`가 false(빠른 모드)면 아무것도 얹지 않는다 — 탭은 아래 버튼이 받는다.
    func dragCell(_ payload: DragPayload, enabled: Bool, drag: PickDrag) -> some View {
        overlay {
            if enabled {
                LongPressDrag(
                    onBegan: { drag.start(payload, at: $0) },
                    onMoved: { drag.move(to: $0) },
                    onEnded: { drag.end(payload, at: $0?.x) }
                )
            }
        }
    }
}

/// 손가락을 따라다니는 64 타일. 화면 맨 위(전체를 덮는 overlay)에 둔다. 표시/숨김은 즉시.
struct PickGhost: View {
    let drag: PickDrag

    @Environment(GameDataStore.self) private var store

    var body: some View {
        GeometryReader { geo in
            if let payload = drag.dragged {
                let origin = geo.frame(in: .global).origin
                ghost(payload)
                    .opacity(0.9)
                    .scaleEffect(1.05)
                    .frame(width: PickDrag.ghostSize, height: PickDrag.ghostSize)
                    .position(x: drag.location.x - origin.x, y: drag.location.y - origin.y)
            }
        }
        .allowsHitTesting(false)
        .ignoresSafeArea()
    }

    @ViewBuilder private func ghost(_ payload: DragPayload) -> some View {
        switch payload {
        case .augment(let a):
            AugmentTile(iconPath: a.iconPath, rarity: a.rarity, size: PickDrag.ghostSize)
        case .item(let i):
            RemoteImage(store.data.cdn.itemImageURL(i.imageKey), size: PickDrag.ghostSize, contentMode: .fit)
                .clipShape(Radius.shape(Radius.sm))
        }
    }
}

/// RN Gesture Handler(`Pan.activateAfterLongPress`)와 같은 UIKit 롱프레스 — 시작 순간의 손가락 위치를 주고, 이후 움직임을 계속 준다.
/// SwiftUI `LongPress.sequenced(Drag)`는 손가락이 움직이기 전엔 위치가 없어 시작 햅틱과 고스트가 늦다.
/// 셋이 맞물려야 한다:
/// - 180ms 전에 10pt 넘게 움직이면 롱프레스가 실패하고 스크롤이 가져간다(짧은 스와이프 = 스크롤).
/// - 시작된 뒤엔 그리드가 `scrollDisabled`로 같이 흐르지 않는다(RN `blocksExternalGesture`).
/// - 시스템이 손가락을 가져가면(.cancelled) 취소로 끝낸다 — 고스트가 남지 않는다. 시작 전 실패는 아무 일도 없다.
private struct LongPressDrag: UIViewRepresentable {
    let onBegan: (CGPoint) -> Void
    let onMoved: (CGPoint) -> Void
    let onEnded: (CGPoint?) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        let press = UILongPressGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handle(_:)))
        press.minimumPressDuration = PickDrag.longPress
        view.addGestureRecognizer(press)
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) { context.coordinator.parent = self }

    @MainActor final class Coordinator: NSObject {
        var parent: LongPressDrag
        init(_ parent: LongPressDrag) { self.parent = parent }

        @objc func handle(_ press: UILongPressGestureRecognizer) {
            let point = press.location(in: nil)
            switch press.state {
            case .began: parent.onBegan(point)
            case .changed: parent.onMoved(point)
            case .ended: parent.onEnded(point)
            default: parent.onEnded(nil)
            }
        }
    }
}
