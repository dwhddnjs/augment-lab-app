import SwiftUI

/// 드래프트 닫기 계약 (app-shell §3, RN `useCloseDraft`). 칼바람·아이템·커스텀이 같이 쓴다.
/// 드래프트 화면은 `router.closeDraft.openBuild(id)` / `.confirmExit(...)`만 부른다.
/// 목표: 회전은 진행 중인 전환이 없을 때 **한 번만**(세로 → 가로 → 세로 흔들림 금지).
@MainActor
struct CloseDraft {
    let router: Router

    /// 저장 경로
    /// 1. 가로를 붙잡는다(1.5초 안전 타이머).
    /// 2. 시트·드래프트를 한 번에 전환 없이 닫고, 같은 순간 빌드 상세(`saved`)를 전환 없이 쌓는다.
    /// 3. 드래프트가 사라지면 세로로 푼다 → 빌드 상세가 한 번 돈다.
    /// 전환 없이 쌓은 건 이번 한 번뿐이라 이후 스와이프 뒤로가기는 손가락을 따라간다.
    func openBuild(_ id: String) {
        OrientationLock.hold()
        router.drafts.close(animated: false)
        var noAnimation = Transaction()
        noAnimation.disablesAnimations = true
        withTransaction(noAnimation) { router.push(.build(id: id, saved: true)) }
    }

    /// 나가기 경로: 확인창 → 확인이면 탭으로 페이드하며 닫는다.
    /// 닫기 전에 세로로 바꿔 두어 회전이 닫는 전환과 함께 일어나게 한다(RN은 닫힌 뒤 돌아 가로 홈이 0.5초 보였다).
    func confirmExit(title: String, cancel: String, ok: String) {
        router.drafts.confirm(title: title, cancel: cancel, ok: ok) { [router] in
            OrientationLock.set(.portrait)
            router.drafts.close(animated: true)
        }
    }
}
