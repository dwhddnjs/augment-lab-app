import AugmentCore
import SwiftUI
import UIKit

extension View {
    /// 앱 루트에 한 번 붙인다(I-06a). `AppSettings`를 환경에 넣고 테마를 창 전체에 강제한다.
    ///
    ///     @State private var settings = AppSettings(store: UserDefaultsStore())
    ///     RootView().appSettings(settings)
    @MainActor
    func appSettings(_ settings: AppSettings) -> some View {
        environment(settings)
            .onChange(of: settings.theme, initial: true) { _, theme in
                let style = theme.uiStyle
                for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
                    scene.windows.forEach { $0.overrideUserInterfaceStyle = style }
                }
            }
    }
}

extension ThemePreference {
    /// system → unspecified: 기기 값을 따른다. 기기 값을 모르면 UIKit이 light로 그린다(storage.md §5).
    var uiStyle: UIUserInterfaceStyle {
        switch self {
        case .system: .unspecified
        case .light: .light
        case .dark: .dark
        }
    }
}
