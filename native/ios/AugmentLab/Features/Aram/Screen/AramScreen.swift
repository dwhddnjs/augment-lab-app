import AugmentCore
import SwiftUI

/// I-06a 스텁 — I-25b 이 채운다. 시그니처: `AramScreen(params: AramParams)`
/// 임시 버튼(저장(가짜 id)·나가기)은 I-06b 흐름 확인용 — I-25b 가 지운다.
struct AramScreen: View {
    let params: AramParams

    @Environment(Router.self) private var router

    var body: some View {
        VStack {
            Text(verbatim: "AramScreen")
            Button { router.pushItems(ItemSelectParams(picked: [], championId: params.championId, mode: params.mode)) } label: { Text(verbatim: "아이템으로") }
            Button { router.closeDraft.openBuild("stub") } label: { Text(verbatim: "저장(가짜 id)") }
            Button { router.closeDraft.confirmExit(title: "나갈까요?", cancel: "취소", ok: "나가기") } label: { Text(verbatim: "나가기") }
        }
    }
}
