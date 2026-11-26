import AugmentCore
import SwiftUI
import UIKit

@main
struct AugmentLabApp: App {
    /// 방향 잠금 창구 (I-06b)
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @Environment(\.scenePhase) private var scenePhase
    @State private var settings: AppSettings
    @State private var router: Router

    init() {
        Analytics.start()
        let settings = AppSettings(store: UserDefaultsStore())
        // 이관(I-04c) → 설정 다시 읽기 → 프리웜. 설정을 화면이 읽기 전에 끝난다.
        Boot.start(settings: settings)
        Self.styleNavigationBars()
        _settings = State(initialValue: settings)
        _router = State(initialValue: Router(settings: settings))
        #if DEBUG
        Route.selfCheck()
        #endif
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(router)
                .appSettings(settings)
                .providesPalette()
        }
        // 체류시간에서 백그라운드 시간을 뺀다 (§7 screen_left)
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .background: Analytics.appDidEnterBackground()
            case .active: Analytics.appDidBecomeActive()
            default: break
            }
        }
    }

    /// RN 스택 헤더 옵션(`stack-screen-options.ts` + 테마 card 색) 그대로: 배경 `surface.base`, 그림자 없음, 제목 `text.primary`.
    /// tint(accent)는 SwiftUI `.tint`가 맡는다. 테마를 바꾸면 창 스타일이 바뀌어 동적 색이 따라온다.
    private static func styleNavigationBars() {
        func dynamic(_ pick: @escaping (Palette) -> Color) -> UIColor {
            UIColor { UIColor(pick($0.userInterfaceStyle == .dark ? .dark : .light)) }
        }
        let title: [NSAttributedString.Key: Any] = [.foregroundColor: dynamic { $0.text.primary }]

        let standard = UINavigationBarAppearance()
        standard.configureWithOpaqueBackground()
        standard.backgroundColor = dynamic { $0.surface.base }
        standard.shadowColor = .clear
        standard.titleTextAttributes = title
        standard.largeTitleTextAttributes = title

        // 큰 제목이 펼쳐진 맨 위에서는 투명(화면 배경 surface.base가 비친다)
        let edge = UINavigationBarAppearance()
        edge.configureWithTransparentBackground()
        edge.titleTextAttributes = title
        edge.largeTitleTextAttributes = title

        let bar = UINavigationBar.appearance()
        bar.standardAppearance = standard
        bar.compactAppearance = standard
        bar.scrollEdgeAppearance = edge
        bar.compactScrollEdgeAppearance = edge
    }
}
