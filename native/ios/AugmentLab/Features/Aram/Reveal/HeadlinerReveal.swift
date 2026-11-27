import AugmentCore
import SwiftUI

private let L = L10n(ko: ["title": "이번 무대의 헤드라이너"], en: ["title": "NOW ON STAGE"])

/// 드래프트 첫머리 헤드라이너 등장 연출 (RN `aram/components/headliner-reveal.tsx`, spec design-system §3.4).
///
/// 공연 타이틀 카드처럼 화면 전체를 어두운 무대로 덮고 왼쪽에 로고, 오른쪽에 이름을 세운다.
/// 조명은 밴드 고유색 하나, 무대는 라이트 모드에서도 어둡다.
/// - 2600ms 뒤 또는 탭하면 300ms 페이드 → `onDone`. 끝나는 시점은 타이머로 잰다.
/// - 사라지는 동안에도 탭을 받아 연타가 뒤에 뜬 카드를 고르지 못한다.
/// - 모든 타이밍이 Reduce Motion을 무시한다(SwiftUI 애니메이션은 알아서 줄지 않으니 따로 하는 일 없음).
public struct HeadlinerReveal: View {
    private enum Metrics {
        static let logoBox = CGSize(width: 260, height: 180)
        static let auraSize: CGFloat = 460
        static let copyWidth: CGFloat = 340
        static let holdMs = 2600
        static let fadeOutMs = 300
        /// HEARTSTEEL은 면이 꽉 찬 글자라 같은 크기면 다른 로고보다 훨씬 무겁게 보인다.
        static func logoScale(_ id: HeadlinerId) -> CGFloat { id == .heartsteel ? 0.78 : 1 }
    }

    let id: HeadlinerId
    let onDone: () -> Void
    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(\.displayScale) private var displayScale
    @State private var appeared = false
    @State private var closing = false

    public init(id: HeadlinerId, onDone: @escaping () -> Void) {
        self.id = id
        self.onDone = onDone
    }

    public var body: some View {
        let entry = store.data.headlinerTexts.headliners[id.rawValue]
        let hex = HeadlinerColors[id.rawValue]!
        let color = Color(token: hex)

        ZStack {
            HeroOverlay.cardBase
            // 위에서 떨어지는 무대 조명: radial-gradient(ellipse 70% 90% at 28% 0%, C38 0%, C00 100%)
            Canvas { ctx, size in
                ctx.translateBy(x: size.width * 0.28, y: 0)
                ctx.scaleBy(x: size.width * 0.7, y: size.height * 0.9)
                ctx.fill(Path(ellipseIn: CGRect(x: -1, y: -1, width: 2, height: 2)),
                         with: .radialGradient(Gradient(colors: [Color(hex: hex, alpha: "38"), Color(hex: hex, alpha: "00")]),
                                               center: .zero, startRadius: 0, endRadius: 1))
            }
            .opacity(appeared ? 1 : 0)
            .animation(.rn(.inOutQuad, ms: 700), value: appeared)

            HStack(spacing: Spacing.five) {
                logo(hex)
                    .opacity(appeared ? 1 : 0)
                    .scaleEffect(appeared ? 1 : 1.08)
                    .animation(.rn(.outCubic, ms: 620).delay(0.12), value: appeared)

                Color(hex: hex, alpha: "80")
                    .frame(width: 2 * hairline(displayScale), height: Metrics.logoBox.height - Spacing.five)
                    .opacity(appeared ? 1 : 0)
                    .scaleEffect(x: 1, y: appeared ? 1 : 0)
                    .animation(.rn(.outCubic, ms: 420).delay(0.46), value: appeared)

                VStack(alignment: .leading, spacing: Spacing.one) {
                    Text(L.t(settings.locale)("title"))
                        .rnText(size: TypeStyle.caption.size, lineHeight: TypeStyle.caption.lineHeight, weight: .bold) // RN 700
                        .tracking(2)
                        .foregroundStyle(color)
                        .copyIn(appeared, delayMs: 560)
                    Text(entry?.name ?? "")
                        .rnText(size: TypeStyle.display.size, lineHeight: TypeStyle.display.lineHeight, weight: .heavy) // RN 800
                        .foregroundStyle(HeroOverlay.textPrimary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.01) // RN adjustsFontSizeToFit
                        .copyIn(appeared, delayMs: 620)
                    Text(entry?.description ?? "")
                        .rnText(size: TypeStyle.label.size, lineHeight: 22, weight: .medium)
                        .foregroundStyle(HeroOverlay.textSecondary)
                        .lineLimit(3)
                        .padding(.top, Spacing.one)
                        .copyIn(appeared, delayMs: 700)
                }
                .frame(width: Metrics.copyWidth, alignment: .leading)
            }
        }
        .ignoresSafeArea()
        .opacity(closing ? 0 : 1)
        .animation(.rn(.inOutQuad, ms: Metrics.fadeOutMs), value: closing)
        .contentShape(Rectangle())
        .onTapGesture(perform: close)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(entry?.name ?? ""). \(entry?.description ?? "")")
        .accessibilityAddTraits(.isButton)
        .accessibilityAction { close() }
        .onAppear { appeared = true }
        // 닫기 전엔 자동 닫기 타이머, 닫는 중엔 onDone 타이머. 화면에서 빠지면 둘 다 취소된다(RN 타이머 정리와 같다).
        .task(id: closing) {
            let ms = closing ? Metrics.fadeOutMs : Metrics.holdMs
            guard (try? await Task.sleep(for: .milliseconds(ms))) != nil else { return }
            if closing { onDone() } else { close() }
        }
    }

    private func logo(_ hex: String) -> some View {
        Image(decorative: HeadlinerAssets.logo(id).asset)
            .resizable()
            .scaledToFit()
            .frame(width: Metrics.logoBox.width, height: Metrics.logoBox.height)
            .scaleEffect(Metrics.logoScale(id))
            // radial-gradient(circle, C47 0%, C14 42%, C00 70%) — circle 기본 크기는 farthest-corner(반지름 = 반 변 × √2)
            .background {
                RadialGradient(stops: [.init(color: Color(hex: hex, alpha: "47"), location: 0),
                                       .init(color: Color(hex: hex, alpha: "14"), location: 0.42),
                                       .init(color: Color(hex: hex, alpha: "00"), location: 0.7)],
                               center: .center, startRadius: 0, endRadius: Metrics.auraSize / 2 * 2.squareRoot())
                    .frame(width: Metrics.auraSize, height: Metrics.auraSize)
                    .allowsHitTesting(false)
            }
    }

    private func close() {
        guard !closing else { return }
        closing = true
    }
}

private extension View {
    /// 문구 한 줄: translateX −12 → 0 + opacity, 420ms out(cubic)
    func copyIn(_ appeared: Bool, delayMs: Int) -> some View {
        opacity(appeared ? 1 : 0)
            .offset(x: appeared ? 0 : -Spacing.double)
            .animation(.rn(.outCubic, ms: 420).delay(Double(delayMs) / 1000), value: appeared)
    }
}

/// Reanimated `Easing` 함수를 근사 곡선 없이 그대로 쓰는 시간 기반 애니메이션.
private struct RNEasing: CustomAnimation {
    enum Curve: Hashable { case outCubic, inOutQuad }
    let curve: Curve
    let duration: TimeInterval

    func animate<V: VectorArithmetic>(value: V, time: TimeInterval, context: inout AnimationContext<V>) -> V? {
        guard time < duration else { return nil }
        let t = time / duration
        let eased = switch curve {
        case .outCubic: 1 - pow(1 - t, 3)
        case .inOutQuad: t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2
        }
        return value.scaled(by: eased)
    }
}

private extension Animation {
    static func rn(_ curve: RNEasing.Curve, ms: Int) -> Animation {
        Animation(RNEasing(curve: curve, duration: Double(ms) / 1000))
    }
}

private struct RevealPreview: View {
    @State private var id: HeadlinerId = .kda
    @State private var run = 0
    @State private var showing = true

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.gray
            if showing {
                HeadlinerReveal(id: id) { showing = false }.id(run)
            }
            HStack {
                Picker("", selection: $id) { ForEach(HeadlinerId.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
                Button("다시") { run += 1; showing = true }
            }
            .padding(Spacing.two)
            .background(.white)
        }
        .onChange(of: id) { run += 1; showing = true }
    }
}

#Preview(traits: .landscapeLeft) {
    @Previewable @State var settings = AppSettings(store: MemoryKeyValueStore())
    RevealPreview()
        .environment(try! GameDataStore(locale: settings.locale))
        .appSettings(settings)
        .providesPalette()
}
