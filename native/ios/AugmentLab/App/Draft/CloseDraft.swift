/// 드래프트 닫기 계약 (app-shell §3, RN `useCloseDraft`) — I-06b가 구현한다.
/// I-06a 스텁: 드래프트 화면은 `router.closeDraft.openBuild(id)` / `.confirmExit(...)`만 부른다.
@MainActor
struct CloseDraft {
    let router: Router

    /// 저장 경로: 가로 유지 → 시트·드래프트를 한 번에 닫고 빌드 상세(`saved`)를 전환 없이 → 상세가 뜨면 세로.
    func openBuild(_ id: String) {}

    /// 나가기 경로: 확인창. 취소면 아무 일 없음, 확인이면 탭으로 페이드하며 닫는다.
    func confirmExit(title: String, cancel: String, ok: String) {}
}
