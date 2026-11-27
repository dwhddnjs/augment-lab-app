import AugmentCore
import SwiftUI

private let L = L10n(
    ko: ["deleteConfirm": "빌드를 삭제할까요?", "deleteOk": "삭제", "cancel": "취소"],
    en: ["deleteConfirm": "Delete this build?", "deleteOk": "Delete", "cancel": "Cancel"]
)

extension View {
    /// 빌드 카드 길게 누르기 → 삭제 확인 (RN `useConfirmDelete`). 홈 캐러셀과 내 빌드 그리드가 함께 쓴다.
    ///
    ///     @State private var deleting: SavedBuild?
    ///     BuildCard(build: b, width: w, onPress: { … }, onLongPress: { deleting = b })
    ///     …
    ///     .confirmDeleteBuild($deleting)
    ///
    /// 스토어가 바로 갱신돼 목록도 바로 바뀐다. 삭제 실패는 RN처럼 조용히 넘긴다.
    func confirmDeleteBuild(_ build: Binding<SavedBuild?>) -> some View {
        modifier(ConfirmDeleteBuild(build: build))
    }
}

private struct ConfirmDeleteBuild: ViewModifier {
    @Binding var build: SavedBuild?
    @Environment(BuildStore.self) private var store
    @Environment(AppSettings.self) private var settings

    func body(content: Content) -> some View {
        let t = L.t(settings.locale)
        content.alert(
            t("deleteConfirm"),
            isPresented: Binding(get: { build != nil }, set: { if !$0 { build = nil } }),
            presenting: build
        ) { target in
            Button(t("cancel"), role: .cancel) {}
            Button(t("deleteOk"), role: .destructive) { try? store.remove(id: target.id) }
        }
    }
}
