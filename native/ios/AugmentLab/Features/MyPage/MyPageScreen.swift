import AugmentCore
import SafariServices
import SwiftUI
import UIKit

private let githubURL = URL(string: "https://github.com/dwhddnjs/aram-augment-lab-app")!
private let feedbackURL = URL(string: "mailto:syd1215no@gmail.com")! // RN mypage-screen.tsx FEEDBACK_EMAIL 그대로

private let L = L10n(
    ko: [
        "general": "일반", "theme": "테마", "system": "시스템", "light": "라이트", "dark": "다크",
        "language": "언어", "dataManage": "데이터 관리", "info": "정보", "version": "앱 버전",
        "patch": "패치 버전", "github": "GitHub", "feedback": "피드백 보내기",
        "disclaimer": "이 앱은 Riot Games가 제작·후원·승인하지 않은 비공식 앱입니다. League of Legends 및 Riot Games는 Riot Games, Inc.의 상표 또는 등록 상표입니다.",
    ],
    en: [
        "general": "General", "theme": "Theme", "system": "System", "light": "Light", "dark": "Dark",
        "language": "Language", "dataManage": "Manage Data", "info": "About", "version": "App Version",
        "patch": "Game Patch", "github": "GitHub", "feedback": "Send feedback",
        "disclaimer": "This app is unofficial and is not endorsed by, sponsored by, or affiliated with Riot Games. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.",
    ]
)

/// 설정 화면 (RN `mypage-screen.tsx`). spec mypage.md §1. 제목(large)은 셸이 단다.
struct MyPageScreen: View {
    @Environment(AppSettings.self) private var settings
    @Environment(GameDataStore.self) private var gameData
    @Environment(Router.self) private var router
    @Environment(\.palette) private var palette
    @Environment(\.openURL) private var openURL

    private var version: String { Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0.0" }

    var body: some View {
        let t = L.t(settings.locale)
        let row = palette.surface.raised
        let icon = palette.text.primary
        List {
            // Picker 스타일은 RN처럼 기본(automatic) — 리스트 안에선 행 어디를 눌러도 메뉴가 열린다. `.menu`를 박으면 오른쪽 값만 눌린다.
            Section(t("general")) {
                Picker(selection: Binding { settings.theme } set: { settings.setTheme($0) }) {
                    Text(t("system")).tag(ThemePreference.system)
                    Text(t("light")).tag(ThemePreference.light)
                    Text(t("dark")).tag(ThemePreference.dark)
                } label: {
                    RowLabel(icon: "circle.lefthalf.filled", label: t("theme"), color: icon)
                }
                .tint(palette.accent.default)
                .listRowBackground(row)

                Picker(selection: Binding { settings.locale } set: { settings.setLocale($0) }) {
                    Text(verbatim: "한국어").tag(AppLocale.ko)
                    Text(verbatim: "English").tag(AppLocale.en)
                } label: {
                    RowLabel(icon: "globe", label: t("language"), color: icon)
                }
                .tint(palette.accent.default)
                .listRowBackground(row)

                SettingsRow(t("dataManage"), icon: "externaldrive", iconColor: icon, rowBackground: row) { router.push(.data) }
            }

            Section {
                SettingsRow(t("version"), value: version, icon: "info.circle", iconColor: icon, rowBackground: row)
                SettingsRow(t("patch"), value: gameData.data.version.patch, icon: "gamecontroller", iconColor: icon, rowBackground: row)
                SettingsRow(t("github"), icon: "chevron.left.forwardslash.chevron.right", iconColor: icon, rowBackground: row) {
                    presentSafari(githubURL)
                }
                SettingsRow(t("feedback"), icon: "envelope", iconColor: icon, rowBackground: row) { openURL(feedbackURL) }
            } header: {
                Text(t("info"))
            } footer: {
                Text(t("disclaimer"))
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(palette.surface.base)
    }

    /// RN `openBrowserAsync`처럼 앱 안 브라우저(SFSafariViewController)를 모달로 띄운다.
    private func presentSafari(_ url: URL) {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first { $0.activationState == .foregroundActive }
        guard var top = scene?.keyWindow?.rootViewController else { return }
        while let next = top.presentedViewController { top = next }
        top.present(SFSafariViewController(url: url), animated: true)
    }
}

/// 아이콘 + 라벨. Picker 라벨 슬롯에 넣어 아이콘 색을 tint와 무관하게 고정한다(SettingsRow와 같은 치수).
private struct RowLabel: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 17)).foregroundStyle(color).frame(width: 26)
            Text(label)
        }
    }
}
