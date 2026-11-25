import Foundation
import PostHog
import Sentry

/// 사용자 지표(PostHog)와 크래시 리포트(Sentry). RN `lib/analytics.ts`와 같은 설정·같은 화면 이름(app-shell §7).
/// PostHog = 화면 이동·체류·세션 리플레이, Sentry = 크래시·에러. PostHog 에러 수집은 켜지 않는다(기본값 꺼짐).
/// 두 키 모두 번들에 들어가도 되는 공개 값이다. DEBUG 빌드에선 아무것도 만들지 않는다 — 개발 중 기록이 지표에 섞이지 않게.
@MainActor
enum Analytics {
    #if DEBUG
    private static let enabled = false
    #else
    private static let enabled = true
    #endif

    private static var current: (name: String, at: Date)?

    /// 앱 시작 때 한 번(I-06a).
    static func start() {
        guard enabled else { return }

        SentrySDK.start { options in
            options.dsn = "https://95f5d2e79f0d3ceb7c4e5e9753c5b866@o4512466062082048.ingest.us.sentry.io/4512466068242433"
            // 에러 순간의 화면 캡처 — 어떤 UI 상태에서 터졌는지 바로 보인다.
            options.attachScreenshot = true
        }

        let config = PostHogConfig(projectToken: "phc_zZqj3uAVvnDFr5nHXAWQT4zbv2E9iV24oguBxBhdeDXC", host: "https://us.i.posthog.com")
        config.sessionReplay = true
        // 화면에 개인정보가 없다(챔피언·증강·아이템뿐). 기본값(전부 가림)이면 리플레이가 빈 상자만 보인다.
        config.sessionReplayConfig.maskAllTextInputs = false
        config.sessionReplayConfig.maskAllImages = false
        // 자동 화면 수집은 UIHostingController 같은 이름을 보낸다. 화면 이름은 trackScreen으로만 RN과 같게 보낸다.
        config.captureScreenViews = false
        // 생명주기 이벤트(Installed/Updated/Opened/Became Active/Backgrounded)는 기본값으로 켜져 있다.
        PostHogSDK.shared.setup(config)
    }

    /// 화면 전환 기록. 이름은 RN 라우트 문자열 그대로(`/(tabs)/(home)`, `/build/[id]` …) — 대시보드 연속성.
    static func trackScreen(_ name: String) {
        guard enabled else { return }
        leaveScreen()
        current = (name, .now)
        PostHogSDK.shared.screen(name)
        SentrySDK.configureScope { $0.setTag(value: name, key: "screen") }
        let crumb = Breadcrumb(level: .info, category: "navigation")
        crumb.message = name
        SentrySDK.addBreadcrumb(crumb)
    }

    /// 백그라운드 시간은 체류시간에서 뺀다 — 나갈 때 한 번 보내고, 돌아오면 다시 잰다.
    static func appDidEnterBackground() {
        guard enabled else { return }
        leaveScreen()
    }

    static func appDidBecomeActive() {
        current?.at = .now
    }

    /// PostHog 모바일엔 화면 체류시간 지표가 없어 직접 잰다.
    private static func leaveScreen() {
        guard let current else { return }
        PostHogSDK.shared.capture("screen_left", properties: [
            "screen": current.name,
            "duration_s": Int(Date.now.timeIntervalSince(current.at).rounded()),
        ])
    }
}
