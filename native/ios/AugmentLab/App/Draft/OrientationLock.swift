import UIKit

/// 앱 방향 잠금 (RN `lib/orientation.ts`). 기본은 세로이고, 드래프트가 떠 있는 동안만 가로다.
/// `AppDelegate`가 이 마스크를 돌려준다. 드래프트 컨트롤러는 가로만 지원해서, 띄우고 닫는 전환이 회전을 함께 처리한다
/// — 코드로 회전을 거는 건 닫힌 뒤 마무리(`release`)뿐이다.
@MainActor
enum OrientationLock {
    private(set) static var mask: UIInterfaceOrientationMask = .portrait

    /// 마스크만 바꾼다. 다음 전환(드래프트 띄우기·닫기)이 이 값으로 회전한다.
    static func set(_ next: UIInterfaceOrientationMask) { mask = next }

    /// 세로로 돌아간다. 드래프트가 사라질 때마다 부른다(이미 세로면 아무 일 없음).
    static func release() {
        mask = .portrait
        for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
            scene.keyWindow?.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
            scene.requestGeometryUpdate(.iOS(interfaceOrientations: mask))
        }
    }
}
