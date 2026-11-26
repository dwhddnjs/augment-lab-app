import AugmentCore
import Observation
import SwiftUI

/// 첫 설치 프리웜 (RN `image-prewarm.ts` + `use-image-prewarm.ts`). spec/app-shell.md §6.
///
/// 첫 설치에 한해 설치 화면(I-06c)에 진행률을 보여 주며 아이콘을 전부 받고, 끝나면 완료 플래그를 찍는다.
/// 그다음 부팅부터는 UI 없이 첫 URL이 캐시에 없는 것만 채운다 — 업데이트로 데이터가 늘었거나 캐시가 지워졌을 때.
/// 포그라운드로 돌아올 때마다 다시 채운다(`imagePrewarm(_:)`).
@MainActor
@Observable
final class PrewarmService {
    static let concurrency = 12

    /// 0~1. 실패·시간 초과도 끝난 것으로 센다 → 오프라인이어도 100%에 닿아 앱이 잠기지 않는다.
    private(set) var progress: Double = 0
    /// 완료 플래그가 없다 = 첫 설치
    let isFirstRun: Bool
    /// 설치 화면을 띄울지
    var showSetup: Bool { isFirstRun && progress < 1 }

    private let chains: [[URL]]
    private let store: KeyValueStore
    /// ddragon 버전이 바뀌면(에셋 교체) 다시 받도록 버전을 키에 넣는다.
    private let flagKey: String
    private var started = false
    private var toppingUp = false

    init(data: GameData, store: KeyValueStore = UserDefaultsStore()) {
        ImagePipeline.configure()
        chains = prewarmChains(data)
        self.store = store
        flagKey = "prewarm:done:\(data.version.ddragonVersion)"
        // 읽기 실패는 "아직 안 받음"으로(RN과 같음)
        isFirstRun = ((try? store.get(flagKey)) ?? nil) == nil
    }

    /// 부팅 때 한 번(두 번 불러도 한 번만 돈다).
    func start() {
        guard !started else { return }
        started = true
        guard isFirstRun else { return topUp() }
        Task {
            var done = 0
            await fetchAll(chains) {
                done += 1
                progress = Double(done) / Double(chains.count)
            }
            progress = 1
            try? store.set(flagKey, "1")
        }
    }

    /// 첫 URL이 디스크에 없는 체인만 조용히 받는다. 연달아 불려도 한 번만 돈다.
    func topUp() {
        guard !toppingUp else { return }
        toppingUp = true
        Task {
            let chains = chains
            let missing = await Task.detached { chains.filter { !ImagePrefetch.isCached($0) } }.value
            await fetchAll(missing)
            toppingUp = false
        }
    }

    /// 작업자 `concurrency`개로 받는다. 체인 하나가 끝날 때마다(성공·실패 무관) `onEach`.
    private func fetchAll(_ list: [[URL]], onEach: () -> Void = {}) async {
        await withTaskGroup(of: Void.self) { group in
            var rest = list[...]
            for chain in rest.prefix(Self.concurrency) {
                group.addTask { await ImagePrefetch.prefetch(chain) }
            }
            rest = rest.dropFirst(Self.concurrency)
            while await group.next() != nil {
                onEach()
                if let chain = rest.popFirst() {
                    group.addTask { await ImagePrefetch.prefetch(chain) }
                }
            }
        }
    }
}

extension View {
    /// 앱 루트에 한 번 붙인다(I-06c). 부팅 때 `start()`, 포그라운드로 돌아올 때마다 `topUp()`.
    func imagePrewarm(_ service: PrewarmService) -> some View {
        modifier(ImagePrewarmModifier(service: service))
    }
}

private struct ImagePrewarmModifier: ViewModifier {
    let service: PrewarmService
    @Environment(\.scenePhase) private var scenePhase

    func body(content: Content) -> some View {
        content
            .task { service.start() }
            .onChange(of: scenePhase) { _, phase in
                if phase == .active { service.topUp() }
            }
    }
}
