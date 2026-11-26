import Observation

/// 드래프트(칼바람·아이템·커스텀) 가로 풀스크린 표시 — I-06b가 구현한다.
/// I-06a 스텁: 시그니처 고정. Router가 `start`·`pushItems`를 부르고, 셸이 `screenName`을 분석에 쓴다.
@MainActor @Observable
final class DraftPresenter {
    /// 맨 위 드래프트 화면의 분석 이름(`/aram`·`/aram-items`·`/custom`). 드래프트가 없으면 nil.
    private(set) var screenName: String?

    /// 표시할 화면에 루트 환경(`router`, `router.settings`)을 다시 넣을 때 쓴다.
    @ObservationIgnored unowned let router: Router

    init(router: Router) { self.router = router }

    /// 챔피언 시트 위에 페이드로 띄운다. 스와이프로 닫히지 않는다.
    func start(_ draft: Draft) {}

    /// 칼바람 위에 아이템 선택을 쌓는다(갈아 끼우지 않는다).
    func pushItems(_ params: ItemSelectParams) {}
}
