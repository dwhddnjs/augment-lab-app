import SwiftUI

/// 드래프트 닫기 계약 (app-shell §3, RN `useCloseDraft`). 칼바람·아이템·커스텀이 같이 쓴다.
/// 드래프트 화면은 `router.closeDraft.openBuild(id)` / `.confirmExit(...)`만 부른다.
/// 목표: 회전은 진행 중인 전환이 없을 때 **한 번만**(세로 → 가로 → 세로 흔들림 금지).
@MainActor
struct CloseDraft {
    let router: Router

    /// 저장 경로 — 나가기와 같은 모양: 세로로 바꿔 두고, 빌드 상세를 전환 없이 밑에 깐 뒤, 드래프트를 페이드로 닫는다.
    /// 회전이 닫는 전환과 함께 한 번 일어나고, 페이드가 끝나면 세로 빌드 상세다.
    /// 예전(가로 붙잡기 + 전환 없이 닫기)은 시트(pageSheet)가 낀 묶음을 전환 없이 닫을 때 iOS가 ≈0.3초 기다리는 동안
    /// 가로로 배치된 챔피언 시트가 그대로 보였다(I-40 측정 #3·#6·#9). 애니메이션 닫기에는 그 기다림이 없다.
    /// 밑에 깐 push는 전환이 없어 회전 중에 끝나지 않은 전환이 남지 않는다 — RN에서 흔들림을 낸 원인이 없다.
    /// 전환 없이 쌓은 건 이번 한 번뿐이라 이후 스와이프 뒤로가기는 손가락을 따라간다.
    func openBuild(_ id: String) {
        OrientationLock.set(.portrait)
        var noAnimation = Transaction()
        noAnimation.disablesAnimations = true
        withTransaction(noAnimation) { router.push(.build(id: id, saved: true)) }
        router.drafts.close(animated: true)
    }

    /// 나가기 경로: 확인창 → 확인이면 탭으로 페이드하며 닫는다.
    /// 닫기 전에 세로로 바꿔 두어 회전이 닫는 전환과 함께 일어나게 한다(RN은 닫힌 뒤 돌아 가로 홈이 0.5초 보였다).
    /// `message`: 제목 아래 설명(커스텀의 "담은 증강과 아이템은 저장되지 않습니다." 등). 없으면 제목만.
    func confirmExit(title: String, message: String? = nil, cancel: String, ok: String) {
        router.drafts.confirm(title: title, message: message, cancel: cancel, ok: ok) { [router] in
            OrientationLock.set(.portrait)
            router.drafts.close(animated: true)
        }
    }
}
