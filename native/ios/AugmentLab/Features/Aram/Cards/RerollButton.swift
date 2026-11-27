import AugmentCore
import SwiftUI

private let L = L10n(ko: ["reroll": "다시 뽑기"], en: ["reroll": "Reroll"])

/// 카드 밑 원형 리롤 버튼 (RN `reroll-button.tsx`). spec/design-system.md §2.5·§3.5.
/// 카드당 1회 — 쓰면(used) 가라앉은 표면 + 흐린 아이콘으로 잠긴다. 연출 중(disabled)에는 안 쓴 버튼도 흐려진다.
/// `hacked`(커맨드 라인)면 원 대신 해킹 아트가 버튼이 되고 주기적으로 번쩍이며 살짝 커진다.
/// 아트가 금색이라 동작 줄이기로 번쩍임이 빠져도 구분된다.
struct RerollButton: View {
    let used: Bool
    var hacked = false
    var disabled = false
    let onPress: () -> Void

    static let size: CGFloat = 36
    /// 자리(36)보다 크게 그려도 자리는 그대로라 카드 줄 배치가 바뀌지 않는다.
    static let hackedArtSize: CGFloat = 50
    static let flashScale: CGFloat = 0.14

    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var flash = 0.0

    private var locked: Bool { used || disabled }

    var body: some View {
        // 아이콘 글리프는 읽히지 않는다(IconView) — 버튼 이름을 따로 준다
        content.accessibilityLabel(L.t(settings.locale)("reroll"))
    }

    @ViewBuilder private var content: some View {
        if hacked && !used {
            hackedButton
        } else {
            Button(action: onPress) {
                IconView(.mci("refresh"), size: 18)
                    .foregroundStyle(used ? palette.text.disabled : palette.text.primary)
                    .frame(width: Self.size, height: Self.size)
                    .background(used ? palette.surface.sunken : palette.surface.raised, in: Circle())
                    .overlay(Circle().strokeBorder(used ? palette.border.subtle : palette.border.strong, lineWidth: 1))
            }
            .buttonStyle(PressOpacity(dimmed: disabled && !used))
            .disabled(locked)
        }
    }

    private var hackedButton: some View {
        let art = HeadlinerAssets.CommandLineReroll.self
        // 금색 마크는 밝은 배경에 묻혀 라이트 모드는 그림자를 깐 그림을 쓴다. 번쩍임은 두 모드 같다.
        return Button(action: onPress) {
            ZStack {
                Image(palette.scheme == .light ? art.lightIcon : art.icon).resizable().scaledToFit()
                Image(art.flash).resizable().scaledToFit().opacity(flash)
            }
            .frame(width: Self.hackedArtSize, height: Self.hackedArtSize)
            .contentShape(Rectangle().inset(by: -Spacing.one)) // RN hitSlop 4
        }
        .buttonStyle(PressOpacity(dimmed: disabled))
        .disabled(locked)
        .scaleEffect(1 + flash * Self.flashScale)
        .frame(width: Self.size, height: Self.size)
        .task(id: !locked && !reduceMotion) { await flashLoop(running: !locked && !reduceMotion) }
    }

    /// 0→1 140ms out(quad), 1→0 460ms out(cubic), 700ms 쉼 — 한 주기 1300ms.
    /// 빠르게 오르고 천천히 식어야 형광등 깜빡임이 아니라 빛나는 것처럼 보인다.
    private func flashLoop(running: Bool) async {
        guard running else {
            withTransaction(Transaction(animation: nil)) { flash = 0 }
            return
        }
        while !Task.isCancelled {
            withAnimation(.cardEase(.outQuad, ms: 140)) { flash = 1 }
            try? await Task.sleep(for: .milliseconds(140))
            withAnimation(.cardEase(.outCubic, ms: 460)) { flash = 0 }
            try? await Task.sleep(for: .milliseconds(460 + 700))
        }
    }
}

/// 눌림 0.65, 흐림(연출 중) 0.35
private struct PressOpacity: ButtonStyle {
    let dimmed: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.opacity(dimmed ? 0.35 : configuration.isPressed ? 0.65 : 1)
    }
}
