import AugmentCore
import Observation
import SwiftUI
import UIKit

/// 드래프트(칼바람·아이템·커스텀) 가로 풀스크린 표시 (app-shell §1·§3).
///
/// - 챔피언 시트 위에 UIKit으로 띄운다(`fullScreen` + `crossDissolve`). SwiftUI `fullScreenCover`는 페이드가 안 되고,
///   UIKit 풀스크린 전환은 지원 방향이 다른 화면을 띄우거나 닫을 때 회전을 전환과 한 동작으로 처리한다.
/// - 칼바람 → 아이템은 같은 컨트롤러 안에서 위에 쌓는다. 모달을 갈아 끼우면 앞 모달을 닫는 순간 세로로 돌았다가 다시 돈다.
/// - 스와이프로 닫히지 않는다. 닫기는 `CloseDraft`로만 한다.
@MainActor @Observable
final class DraftPresenter {
    /// 맨 위 드래프트 화면의 분석 이름(`/aram`·`/aram-items`·`/custom`). 드래프트가 없으면 nil.
    private(set) var screenName: String?
    /// 칼바람 위에 쌓인 아이템 선택
    private(set) var items: ItemSelectParams?

    /// 표시할 화면에 루트 환경(`router`, `router.settings`)을 다시 넣을 때 쓴다.
    @ObservationIgnored unowned let router: Router
    @ObservationIgnored private weak var host: UIViewController?

    /// 칼바람 위에 아이템을 덮는 페이드 (RN 모달 'fade' ≈ UIKit crossDissolve)
    private static let stackFade = Animation.easeInOut(duration: 0.3)

    init(router: Router) { self.router = router }

    /// 챔피언 시트 위에 페이드로 띄운다. 이미 떠 있으면 무시한다(✓ 연타로 두 겹 뜨는 것 방지).
    func start(_ draft: Draft) {
        present(draft, items: nil)
    }

    /// 칼바람 위에 아이템 선택을 쌓는다. 드래프트 없이 들어오면(딥링크) 아이템만 띄운다.
    func pushItems(_ params: ItemSelectParams) {
        guard host != nil else { return present(nil, items: params) }
        guard items == nil else { return }
        withAnimation(Self.stackFade) { items = params }
        screenName = "/aram-items"
    }

    // MARK: CloseDraft가 쓴다

    /// 시트·드래프트를 한 묶음으로 닫는다 — 루트에서 닫아 그 사이 시트가 비치지 않게 한다.
    /// SwiftUI가 들고 있는 시트 상태는 닫힘이 끝난 뒤 맞춘다(먼저 바꾸면 SwiftUI가 진행 중인 닫힘을 다시 건드린다).
    func close(animated: Bool) {
        guard host != nil, let root = Self.rootViewController() else { return }
        root.dismiss(animated: animated) { [router] in
            var noAnimation = Transaction()
            noAnimation.disablesAnimations = true
            withTransaction(noAnimation) { router.sheet = nil }
        }
    }

    /// 나가기 확인창. 취소하면 아무 일도 없다.
    func confirm(title: String, cancel: String, ok: String, onConfirm: @escaping () -> Void) {
        guard let host else { return }
        let alert = UIAlertController(title: title, message: nil, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: cancel, style: .cancel))
        alert.addAction(UIAlertAction(title: ok, style: .destructive) { _ in onConfirm() })
        host.present(alert, animated: true)
    }

    // MARK: 내부

    private func present(_ draft: Draft?, items: ItemSelectParams?) {
        guard host == nil, let root = Self.rootViewController() else { return }
        var top = root
        while let next = top.presentedViewController, !next.isBeingDismissed { top = next }

        self.items = items
        let content = DraftStack(draft: draft, presenter: self)
            .environment(router)
            .environment(router.settings)
            .providesPalette()
        let vc = DraftHostingController(rootView: AnyView(content))
        vc.modalPresentationStyle = .fullScreen
        vc.modalTransitionStyle = .crossDissolve
        vc.onDisappear = { [weak self] in self?.didClose() }

        OrientationLock.set(.landscape)
        top.present(vc, animated: true)
        host = vc
        screenName = items != nil ? "/aram-items" : draft?.screenName
    }

    /// 드래프트가 화면에서 사라졌다 — 저장(가로를 붙잡던 중)이든 나가기든 세로로 마무리한다.
    private func didClose() {
        host = nil
        items = nil
        screenName = nil
        OrientationLock.release()
    }

    private static func rootViewController() -> UIViewController? {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
        return scene?.keyWindow?.rootViewController
    }
}

private extension Draft {
    var screenName: String {
        switch self {
        case .aram: "/aram"
        case .custom: "/custom"
        }
    }
}

/// 가로 전용. 지원 방향이 세로 화면과 달라서 띄우고 닫는 전환이 회전을 함께 한다.
private final class DraftHostingController: UIHostingController<AnyView> {
    var onDisappear: (() -> Void)?

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }

    // 위에 뜨는 건 확인창뿐이라(이 화면을 가리지 않는다) 사라짐 = 닫힘이다.
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        onDisappear?()
    }
}

/// 드래프트 안쪽 스택: 칼바람(또는 커스텀) 위에 아이템 선택이 페이드로 덮인다. 아래 화면은 그대로 살아 있다.
private struct DraftStack: View {
    let draft: Draft?
    let presenter: DraftPresenter

    @Environment(\.palette) private var palette

    var body: some View {
        ZStack {
            switch draft {
            case .aram(let params): layer(AramScreen(params: params))
            case .custom(let championId): layer(CustomScreen(championId: championId))
            case nil: EmptyView()
            }
            if let items = presenter.items {
                layer(ItemSelectScreen(params: items)).transition(.opacity)
            }
        }
    }

    /// RN 스택 화면처럼 배경은 `surface.base`(테마 background)
    private func layer(_ screen: some View) -> some View {
        screen
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(palette.surface.base)
    }
}
