import UIKit

/// 방향 잠금 창구. 앱 기본은 세로이고, 드래프트가 떠 있는 동안만 가로다(`OrientationLock`).
/// 드래프트가 아닌 화면은 방향을 따로 선언하지 않는다 — 이 마스크 하나로 정한다.
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        OrientationLock.mask
    }
}
