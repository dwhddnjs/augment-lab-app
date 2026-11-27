import AugmentCore
import SDWebImageSwiftUI
import SwiftUI

/// 증강 아이콘 로더 (RN `augment-image.tsx`). spec/design-system.md §2.8.
/// 앱에 넣어 둔 아이콘 → CDragon large(256px) → base(컬러 원본) → small(흰 라인아트) → 희귀도 글리프.
/// 일부 증강은 `_large` 가 404 라 base 로 컬러를 살린다. 테두리·이름 같은 장식은 호출측 몫.
struct AugmentImage: View {
    let iconPath: String
    let size: CGFloat
    /// 폴백 글리프 색 — 보통 희귀도 색
    let tint: Color
    /// 아이콘을 끝내 못 받았을 때 그릴 글리프 — 보통 `.mci(RarityColors.glyph[rarity]!)`
    let fallbackGlyph: Icon
    /// 글리프 크기 = size × ratio
    var fallbackRatio: CGFloat = 0.62

    /// 지금 시도 중인 체인 위치. 실패할 때마다 다음 URL로.
    @State private var step = 0

    var body: some View {
        content
            .frame(width: size, height: size)
            .onChange(of: iconPath) { step = 0 } // 다른 증강으로 바뀌면 처음 URL부터 다시
    }

    @ViewBuilder private var content: some View {
        let urls = CDN.augmentImageURLs(iconPath)
        if let local = CDN.localAugmentIcon(iconPath) {
            Image(local).resizable().scaledToFit()
        } else if iconPath.isEmpty || step >= urls.count {
            IconView(fallbackGlyph, size: (size * fallbackRatio).rounded()).foregroundStyle(tint)
        } else {
            WebImage(url: urls[step]) { $0.resizable().scaledToFit() } placeholder: { Color.clear }
                .onFailure { _ in step += 1 }
        }
    }
}
