import AugmentCore
import SwiftUI

/// 부팅 순서 (app-shell §5) — I-06c가 구현한다.
/// I-06a 스텁: 앱 init에서 한 번 부른다. AsyncStorage 이관(I-04c) → `settings.reload()` → 프리웜 시작.
@MainActor
enum Boot {
    static func start(settings: AppSettings) {}
}

/// 스플래시(600ms)·첫 실행 설치 화면 — I-06c가 구현한다. 셸이 맨 위 레이어로 깐다(아래에 메인 UI가 그려진다).
struct BootOverlay: View {
    var body: some View { EmptyView() }
}
