import AugmentCore
import Sentry
import SwiftUI

/// 부팅 순서 (app-shell §5). 앱 init에서 한 번: AsyncStorage 이관(I-04c) → `settings.reload()`.
/// 프리웜은 GameData가 필요해서 `BootOverlay`가 첫 화면에서 시작한다(이관이 프리웜 플래그도 옮긴 뒤다).
@MainActor
enum Boot {
    static func start(settings: AppSettings) {
        let result = AsyncStorageImport(settingsStore: UserDefaultsStore(), buildFile: FileKeyValueStore(), ddragonVersion: bundledDdragonVersion()).run()
        if !result.skipped {
            let crumb = Breadcrumb(level: result.errors.isEmpty ? .info : .error, category: "migration.asyncstorage")
            crumb.message = "moved \(result.moved.count) keys, completed \(result.completed)"
            crumb.setData(value: result.moved, key: "moved")
            crumb.setData(value: result.errors, key: "errors")
            SentrySDK.addBreadcrumb(crumb)
        }
        settings.reload()
    }

    /// 이관할 프리웜 플래그 키(`prewarm:done:<버전>`)용. GameDataStore보다 먼저 돌아서 version.json만 읽는다.
    private static func bundledDdragonVersion() -> String {
        guard let url = Bundle.main.url(forResource: "version.json", withExtension: nil, subdirectory: "Data"),
              let data = try? Data(contentsOf: url),
              let version = try? JSONDecoder().decode(VersionInfo.self, from: data)
        else { return "" }
        return version.ddragonVersion
    }
}

/// 스플래시(600ms)·첫 실행 설치 화면. 셸이 맨 위 레이어로 깐다(아래에 메인 UI가 그려진다).
struct BootOverlay: View {
    @Environment(GameDataStore.self) private var gameData
    @State private var prewarm: PrewarmService?

    var body: some View {
        ZStack {
            if let prewarm { SetupLayer(service: prewarm) }
            AnimatedSplashOverlay()
        }
        // 첫 프레임은 스플래시가 불투명하게 덮고 있어 한 프레임 늦게 만들어도 보이지 않는다.
        .onAppear { if prewarm == nil { prewarm = PrewarmService(data: gameData.data) } }
    }
}

/// 첫 실행이면 진행률을 보여 주고, 100%가 되면 450ms 페이드로 걷힌다. 그 뒤로는 포그라운드 복귀 때 조용히 보충.
private struct SetupLayer: View {
    let service: PrewarmService

    var body: some View {
        ZStack {
            if service.showSetup {
                SetupScreen(progress: service.progress).transition(.opacity)
            }
        }
        // Reanimated FadeOut 기본 easing = inOut(quad)
        .animation(.timingCurve(0.455, 0.03, 0.515, 0.955, duration: 0.45), value: service.showSetup)
        .imagePrewarm(service)
    }
}

/// RN `animated-splash-overlay.tsx`: 네이티브 스플래시와 같은 색 판을 페이드아웃시켜 첫 화면으로 넘긴다(§3.1).
/// 키프레임의 scale(화면높이/90 → 1)은 단색 판이라 보이지 않아 생략했다 — 보이는 건 120~420ms의 opacity뿐이다.
struct AnimatedSplashOverlay: View {
    static let duration = 0.6
    @State private var start = Date.now
    @State private var visible = true

    var body: some View {
        if visible {
            TimelineView(.animation) { context in
                Brand.splashBg.opacity(Self.opacity(at: context.date.timeIntervalSince(start)))
            }
            .ignoresSafeArea()
            .task {
                try? await Task.sleep(for: .seconds(Self.duration))
                visible = false
            }
        }
    }

    /// 0–20% 1, 20–70% 1→0 (Reanimated `Easing.elastic(0.7)`), 이후 0
    static func opacity(at t: TimeInterval) -> Double {
        let p = t / duration
        guard p > 0.2 else { return 1 }
        guard p < 0.7 else { return 0 }
        let x = (p - 0.2) / 0.5
        let eased = 1 - pow(cos(x * .pi / 2), 3) * cos(x * 0.7 * .pi)
        return min(max(1 - eased, 0), 1)
    }
}

private let L = L10n(
    ko: ["preparing": "이미지 준비 중...", "hint": "처음 한 번만 받아두면 다음부터는 바로 열려요"],
    en: ["preparing": "Preparing images", "hint": "Just once — next time it opens instantly"]
)

/// RN `setup-screen.tsx` (design-system §2.11). 진행 바 폭은 애니메이션하지 않는다.
private struct SetupScreen: View {
    static let barWidth: CGFloat = 240
    let progress: Double
    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let t = L.t(settings.locale)
        let pct = Int((min(max(progress, 0), 1) * 100).rounded())
        ZStack(alignment: .bottom) {
            palette.surface.base
            VStack(spacing: Spacing.three) {
                Image("brand-logo").resizable().scaledToFit().frame(width: 120, height: 120)
                VStack(spacing: Spacing.two) {
                    HStack {
                        Text(t("preparing")).rnText(.caption).foregroundStyle(palette.text.secondary)
                        Spacer()
                        Text(verbatim: "\(pct)%").rnText(.caption).monospacedDigit().foregroundStyle(palette.accent.default)
                    }
                    Capsule().fill(palette.surface.raised).frame(height: 6)
                        .overlay(alignment: .leading) {
                            Capsule().fill(palette.accent.default)
                                .frame(width: Self.barWidth * CGFloat(pct) / 100)
                                .shadow(color: palette.accent.subtle, radius: 5)
                        }
                        .clipShape(Capsule())
                }
                .frame(width: Self.barWidth)
            }
            .frame(maxHeight: .infinity)
            Text(t("hint")).rnText(.caption).foregroundStyle(palette.text.tertiary).padding(.bottom, Spacing.six)
        }
        .ignoresSafeArea()
    }
}
