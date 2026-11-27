import QuartzCore
import SwiftUI

/// 카드가 물러나는 방식. 고른 카드는 튀고(picked), 나머지는 사라지고(unchosen), 리롤 대상은 흐려진다(reroll).
enum CardExitMode: Sendable { case none, picked, unchosen, reroll }
/// 갓 마운트된 카드가 등장하는 방식 — 새 라운드는 flip, 리롤 교체분은 fade.
enum CardEntryMode: Sendable { case flip, fade }

/// 카드 count장(보통 3, 마에스트로 4)의 선택·리롤 연출 상태 (RN `use-card-pick-anim.ts`). spec/design-system.md §3.5.
/// - pick: 고른 카드 바운스 + 나머지 퇴장 → 380ms 뒤 `commit`
/// - reroll: 대상 카드 퇴장 → 220ms 뒤 `swap`(그 슬롯만 fade로 재등장)
/// 화면은 카드 id를 `"\(roundKey)-\(카드 id)"`로 잡아야 한다 — 라운드가 바뀌면 카드를 새로 만들어 flip으로 맞는다.
@MainActor
@Observable
final class CardPickAnim {
    static let pickDelay: Duration = .milliseconds(380)
    static let rerollDelay: Duration = .milliseconds(220)

    private(set) var exitModes: [CardExitMode]
    private(set) var entryModes: [CardEntryMode]
    /// 연출 중 — 카드·리롤 버튼을 흐리게(disabled) 그린다.
    private(set) var animating = false
    private(set) var roundKey = 0

    private let count: Int
    /// 재진입 차단. 두 손가락으로 두 카드를 동시에 눌러도 하나만 통과한다.
    @ObservationIgnored private var busy = false
    @ObservationIgnored private var timer: Task<Void, Never>?

    init(count: Int) {
        self.count = count
        exitModes = Array(repeating: .none, count: count)
        entryModes = Array(repeating: .flip, count: count)
    }

    /// 선택. `commit`이 true(화면을 떠남)면 고른 모습 그대로 멈추고 busy도 풀지 않는다 —
    /// 다음 화면이 덮는 동안 카드를 다시 돌리면 다음 라운드가 시작되는 것처럼 보인다.
    func pick(_ index: Int, commit: @escaping () -> Bool) {
        guard !busy else { return }
        busy = true
        animating = true
        exitModes = (0..<count).map { $0 == index ? .picked : .unchosen }
        timer = Task { [weak self] in
            try? await Task.sleep(for: Self.pickDelay)
            guard let self, !Task.isCancelled else { return }
            if commit() { return }
            busy = false
            exitModes = Array(repeating: .none, count: count)
            entryModes = Array(repeating: .flip, count: count)
            roundKey += 1
            animating = false
        }
    }

    /// 리롤 — 대상 슬롯만 교체하고, 그 슬롯은 flip 대신 fade로 돌아온다.
    func reroll(_ index: Int, swap: @escaping () -> Void) {
        guard !busy else { return }
        busy = true
        animating = true
        exitModes = (0..<count).map { $0 == index ? .reroll : .none }
        timer = Task { [weak self] in
            try? await Task.sleep(for: Self.rerollDelay)
            guard let self, !Task.isCancelled else { return }
            busy = false
            entryModes[index] = .fade
            swap()
            exitModes = Array(repeating: .none, count: count)
            animating = false
        }
    }

    /// 화면을 떠날 때 부른다. 안 끊으면 떠난 화면에서 commit이 돌아 다음 화면이 뒤늦게 밀려 올라온다.
    func cancel() { timer?.cancel() }
}

/// 카드 선택 연출 래퍼 (RN `pick-card.tsx`). 변환 순서 perspective 900 → rotateY → scale, 기본 곡선 inOut(quad).
/// 동작 줄이기여도 연출을 재생한다 — 어지럼증을 부르는 회전만 빼고 fade로 등장한다.
struct PickCard<Content: View>: View {
    let index: Int
    let exitMode: CardExitMode
    let entryMode: CardEntryMode
    let disabled: Bool
    let onPress: () -> Void
    let content: Content

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var opacity = 0.0
    @State private var scale = 1.0
    @State private var rotateY: Double
    /// 회전이 0에 닿았다. 펼쳐지는 중인 카드는 고를 수 없다 — 연출을 건너뛰려는 연타가 다음 카드를 집어 버린다.
    @State private var settled: Bool

    init(index: Int, exitMode: CardExitMode, entryMode: CardEntryMode, disabled: Bool,
         onPress: @escaping () -> Void, @ViewBuilder content: () -> Content) {
        self.index = index
        self.exitMode = exitMode
        self.entryMode = entryMode
        self.disabled = disabled
        self.onPress = onPress
        self.content = content()
        _rotateY = State(initialValue: entryMode == .flip ? 90 : 0)
        _settled = State(initialValue: entryMode != .flip)
    }

    var body: some View {
        content
            .contentShape(Rectangle())
            .onTapGesture { if !disabled && settled { onPress() } }
            .accessibilityAddTraits(.isButton)
            .scaleEffect(scale)
            .modifier(FlipEffect(angle: rotateY))
            .opacity(opacity)
            .onAppear(perform: play)
            .onChange(of: exitMode) { play() }
    }

    private func play() {
        var instant = Transaction()
        instant.disablesAnimations = true
        switch exitMode {
        case .none where entryMode == .flip && !reduceMotion:
            // 새 라운드: 행을 가로질러 순서대로 펼쳐진다.
            withTransaction(instant) { opacity = 0; scale = 1; rotateY = 90; settled = false }
            let delay = Double(index) * 0.09
            withAnimation(.cardEase(.inOutQuad, ms: 160).delay(delay)) { opacity = 1 }
            withAnimation(.cardEase(.outCubic, ms: 380).delay(delay)) { rotateY = 0 } completion: { settled = true }
        case .none:
            // 리롤 교체분(과 동작 줄이기의 모든 카드): 빠른 fade + scale-in
            withTransaction(instant) { rotateY = 0; opacity = 0; scale = 0.96; settled = true }
            withAnimation(.cardEase(.inOutQuad, ms: 200)) { opacity = 1 }
            withAnimation(.cardEase(.inOutQuad, ms: 240)) { scale = 1 }
        case .picked:
            withAnimation(.cardEase(.inOutQuad, ms: 120)) { scale = 1.05 } completion: {
                withAnimation(.cardEase(.inOutQuad, ms: 90)) { scale = 1 }
            }
        case .unchosen:
            withAnimation(.cardEase(.inOutQuad, ms: 280)) { opacity = 0; scale = 0.94 }
        case .reroll:
            withAnimation(.cardEase(.inOutQuad, ms: 200)) { opacity = 0; scale = 0.96 }
        }
    }
}

/// perspective 900 + rotateY, 가운데 기준 (RN iOS가 CATransform3D로 거는 것과 같은 행렬)
private struct FlipEffect: GeometryEffect {
    var angle: Double
    var animatableData: Double {
        get { angle }
        set { angle = newValue }
    }

    func effectValue(size: CGSize) -> ProjectionTransform {
        var perspective = CATransform3DIdentity
        perspective.m34 = -1 / 900
        var t = CATransform3DMakeTranslation(-size.width / 2, -size.height / 2, 0)
        t = CATransform3DConcat(t, CATransform3DMakeRotation(angle * .pi / 180, 0, 1, 0))
        t = CATransform3DConcat(t, perspective)
        t = CATransform3DConcat(t, CATransform3DMakeTranslation(size.width / 2, size.height / 2, 0))
        return ProjectionTransform(t)
    }
}

/// 카드 행 — 가로 가운데, 위에서 `topOffset`만큼 내린 자리에 고정한다.
/// 세로 가운데로 두면 카드 밑 표식이 있는 라운드만 카드가 올라가 헤드라이너마다 위치가 달라진다.
struct CardRow<Content: View>: View {
    let topOffset: CGFloat
    @ViewBuilder let content: Content

    var body: some View {
        HStack(alignment: .top, spacing: CardLayout.gap) { content }
            .padding(.horizontal, CardLayout.rowPad)
            .padding(.top, topOffset)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }
}

/// Reanimated `Easing` 함수를 근사 곡선 없이 그대로 쓰는 시간 기반 애니메이션.
/// ponytail: I-26 `HeadlinerReveal`에도 같은 것이 private으로 있다 — 공용으로 올리면 하나로 합친다(승격 후보).
struct CardEasing: CustomAnimation {
    enum Curve: Hashable, Sendable { case inOutQuad, outQuad, outCubic }
    let curve: Curve
    let duration: TimeInterval

    func animate<V: VectorArithmetic>(value: V, time: TimeInterval, context: inout AnimationContext<V>) -> V? {
        guard time < duration else { return nil }
        let t = time / duration
        let eased = switch curve {
        case .inOutQuad: t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2
        case .outQuad: 1 - (1 - t) * (1 - t)
        case .outCubic: 1 - pow(1 - t, 3)
        }
        return value.scaled(by: eased)
    }
}

extension Animation {
    static func cardEase(_ curve: CardEasing.Curve, ms: Int) -> Animation {
        Animation(CardEasing(curve: curve, duration: Double(ms) / 1000))
    }
}
