import AugmentCore
import SwiftUI

/// 진입점 라벨 (RN `LAUNCH_LABELS`)
let launchLabels = L10n(
    ko: ["aram": "칼바람", "custom": "커스텀"],
    en: ["aram": "ARAM", "custom": "Custom"]
)

extension LaunchMode {
    /// RN `LAUNCH_ICONS` (MCI)
    var icon: Icon {
        switch self {
        case .aram: .mci("snowflake")
        // 조절 슬라이더 = "내가 값을 정한다". 눈송이와 24px 실루엣이 겹치지 않는다.
        case .custom: .mci("tune-variant")
        }
    }
}

/// `+`를 누르면 뜨는 딤 오버레이 (launch.md §1, design-system §3.3).
/// `+` 위 오른쪽 아래에 진입점 원형 버튼을 띄운다. 고르면 오버레이를 걷고 챔피언 선택 시트를 연다.
struct ModeSelectOverlay: View {
    @Environment(Router.self) private var router
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @State private var appeared = false

    /// + 버튼에서 가까운 쪽부터 쌓는다 — 진입점 순서의 역순. 칼바람이 + 바로 위, 커스텀이 그 위.
    private static let modes = Array(LaunchMode.allCases.reversed())
    /// 딤은 두 모드 모두 어두워서 다크 테마의 밝은 민트를 쓴다(라이트 민트는 대비가 모자라다).
    private static let onScrimAccent = Palette.dark.accent.default
    private static let circle: CGFloat = 60
    private static let border: CGFloat = 1.5
    /// 짧은 시차 + 짧은 이동거리라야 "순서대로 톡톡" 올라온다
    private static let stagger = 0.07, rise: CGFloat = 20, duration = 0.22
    private static let rightInset: CGFloat = 22

    var body: some View {
        let t = launchLabels.t(settings.locale)
        ZStack(alignment: .bottomTrailing) {
            palette.surface.overlay
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture { router.back() }

            VStack(alignment: .trailing, spacing: Spacing.three) {
                ForEach(Array(Self.modes.enumerated()), id: \.element) { i, mode in
                    button(mode, label: t(mode.rawValue))
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : Self.rise)
                        // spring은 오버슈트로 낭창거려 timing + ease-out(cubic)으로 딱 떨어지게 한다
                        .animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: Self.duration)
                            .delay(Double(Self.modes.count - 1 - i) * Self.stagger), value: appeared)
                }
            }
            .padding(.trailing, Self.rightInset)
            // RN: insets.bottom + BottomTabInset + 16 — 하단 inset은 안전 영역이 이미 준다
            .padding(.bottom, bottomTabInset + Spacing.three)
        }
        .onAppear { appeared = true }
    }

    private func button(_ mode: LaunchMode, label: String) -> some View {
        Button { router.presentChampionSelect(mode) } label: {
            VStack(spacing: Spacing.half) {
                IconView(mode.icon, size: 24)
                Text(label).rnText(.caption)
            }
            .foregroundStyle(Self.onScrimAccent)
            .frame(width: Self.circle, height: Self.circle)
            .overlay(Circle().strokeBorder(Self.onScrimAccent, lineWidth: Self.border))
            .contentShape(Circle())
        }
        .buttonStyle(NoFeedbackButtonStyle())
    }
}

