import AugmentCore
import SDWebImageSwiftUI
import StoreKit
import SwiftUI

private let L = L10n(
    ko: ["augments": "증강", "items": "아이템", "stats": "합산 스탯", "delete": "빌드 삭제",
         "deleteConfirm": "빌드를 삭제할까요?", "deleteOk": "삭제", "cancel": "취소", "notFound": "빌드를 찾을 수 없어요"],
    en: ["augments": "Augments", "items": "Items", "stats": "Total Stats", "delete": "Delete Build",
         "deleteConfirm": "Delete this build?", "deleteOk": "Delete", "cancel": "Cancel", "notFound": "Build not found"]
)

/// 스크롤 수치 (spec design-system §3.8)
enum BuildDetailScroll {
    /// 배너가 가장 클 때 높이. 스크롤하면 0까지 줄어든다.
    static let bannerHeight: CGFloat = 300
    /// 본문 시트가 배너 하단을 덮으며 올라오는 겹침
    static let sheetOverlap: CGFloat = 24
    /// 배너 높이가 0이 되는 스크롤 거리(시트가 화면 위에 닿는 지점) = 276
    static var collapseDistance: CGFloat { bannerHeight - sheetOverlap }
    /// 당겨서 이미지를 더 키울 수 있는 여유
    static let pullExtra: CGFloat = 140

    /// scrollY [-140, 0, 276] → [440, 300, 0] (clamp)
    static func bannerHeight(_ y: CGFloat) -> CGFloat {
        y <= 0 ? bannerHeight + min(pullExtra, -y) : max(0, bannerHeight * (1 - y / collapseDistance))
    }

    /// 헤더 배경·제목: scrollY [276×0.45, 276×0.8] = [124.2, 220.8] → [0, 1] (clamp)
    static func headerOpacity(_ y: CGFloat) -> Double {
        let from = collapseDistance * 0.45, to = collapseDistance * 0.8
        return Double(min(1, max(0, (y - from) / (to - from))))
    }
}

/// 저장된 빌드 상세 (RN `builds/screens/build-detail-screen.tsx`, spec home-builds §4).
/// 챔피언 배너가 스크롤에 따라 접히고(당기면 확대), 본문 시트가 위로 올라오며 내용을 드러낸다.
/// 헤더는 셸 스택의 시스템 내비게이션 바를 투명하게 쓰고, 접히면 glass 배경과 챔피언 이름이 페이드 인된다.
/// `saved` = 드래프트에서 방금 저장하고 들어옴 → 1초 뒤 리뷰 요청.
struct BuildDetailScreen: View {
    static let reviewDelayMs = 1000
    static let bottomSpacer: CGFloat = 240
    static let gradientAlphas = ["00", "00", "14", "40", "A6", "FF"]
    static let gradientStops: [CGFloat] = [0, 0.5, 0.68, 0.82, 0.93, 1]

    let id: String
    let saved: Bool
    @Environment(BuildStore.self) private var builds
    @Environment(GameDataStore.self) private var store
    @Environment(AppSettings.self) private var settings
    @Environment(Router.self) private var router
    @Environment(\.palette) private var palette
    @Environment(\.displayScale) private var displayScale
    @Environment(\.requestReview) private var requestReview
    /// RN처럼 한 번 읽어 둔다 — 삭제 뒤 뒤로 가는 동안에도 내용이 남는다.
    @State private var loaded = false
    @State private var build: SavedBuild?
    @State private var scrollY: CGFloat = 0
    @State private var confirmingDelete = false

    var body: some View {
        let t = L.t(settings.locale)
        Group {
            if !loaded {
                palette.surface.base.ignoresSafeArea()
            } else if let build {
                content(build, t)
            } else {
                notFound(t)
            }
        }
        .task(id: id) {
            build = builds.get(id)
            loaded = true
        }
        // 방금 만든 빌드를 보여 준 뒤에 리뷰를 청한다(가로 → 세로 회전이 끝나고 결과를 본 뒤)
        .task(id: build?.id) {
            guard saved, build != nil else { return }
            guard (try? await Task.sleep(for: .milliseconds(Self.reviewDelayMs))) != nil else { return }
            ReviewRequest.maybeRequest(requestReview, builds: builds)
        }
    }

    private func notFound(_ t: (String) -> String) -> some View {
        VStack(spacing: Spacing.two) {
            IconView(.mci("cards-outline"), size: 56).foregroundStyle(palette.text.disabled)
            Text(t("notFound")).rnText(.body).foregroundStyle(palette.text.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(palette.surface.base)
    }

    private func content(_ build: SavedBuild, _ t: @escaping (String) -> String) -> some View {
        let data = store.data
        let champion = data.championsById[build.championId]
        let transmuted = Set(build.transmutedIds ?? [])
        let augments = resolveIds(build.augmentIds, in: data.augmentsById).map { a in
            var a = a
            if transmuted.contains(a.id) { a.transmuted = true }
            return a
        }
        let items = resolveIds(build.itemIds, in: data.itemsById)
        let fade = BuildDetailScroll.headerOpacity(scrollY)

        return GeometryReader { geo in
            ZStack(alignment: .top) {
                palette.surface.base
                banner(champion)
                    .frame(height: BuildDetailScroll.bannerHeight(scrollY))
                    .frame(maxWidth: .infinity)
                    .clipped()
                    .allowsHitTesting(false)

                ScrollView {
                    VStack(spacing: 0) {
                        Color.clear.frame(height: BuildDetailScroll.collapseDistance) // 배너가 비치는 투명 스페이서
                        sheet(build, champion: champion, augments: augments, items: items, t: t)
                        Color.clear.frame(height: Self.bottomSpacer)
                    }
                    .padding(.bottom, Spacing.five)
                    .onGeometryChange(for: CGFloat.self) { $0.frame(in: .named(Self.scrollSpace)).minY } action: { scrollY = -$0 }
                }
                .scrollIndicators(.hidden)
                .coordinateSpace(.named(Self.scrollSpace))

                // 접히면 페이드 인되는 헤더 배경 — 상태 표시줄 + 내비게이션 바 높이
                GlassSurface(cornerRadius: 0) { Color.clear }
                    .frame(height: geo.safeAreaInsets.top)
                    .opacity(fade)
                    .allowsHitTesting(false)
            }
            .ignoresSafeArea(edges: .top)
        }
        .toolbarBackground(.hidden, for: .navigationBar)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text(champion?.name ?? "")
                    .rnText(size: 17, lineHeight: TypeStyle.heading.lineHeight, weight: TypeStyle.heading.weight)
                    .foregroundStyle(palette.text.primary)
                    .lineLimit(1)
                    .opacity(fade)
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { confirmingDelete = true } label: {
                    IconView(.mci("trash-can-outline"), size: 22).foregroundStyle(palette.status.danger)
                }
                .accessibilityLabel(t("delete"))
            }
        }
        .alert(t("deleteConfirm"), isPresented: $confirmingDelete) {
            Button(t("cancel"), role: .cancel) {}
            // 삭제(스토어 갱신)를 마친 뒤 뒤로 — 목록이 스토어 구독으로 바로 반영된다
            Button(t("deleteOk"), role: .destructive) {
                try? builds.remove(id: build.id)
                router.back()
            }
        }
    }

    private static let scrollSpace = "buildDetailScroll"

    private func banner(_ champion: Champion?) -> some View {
        ZStack {
            if let champion {
                WebImage(url: CDN.championSplashURL(champion.id)) { $0.resizable().scaledToFill() } placeholder: { Color.clear }
            }
            // fade를 아래쪽에 몰되 stop을 촘촘히 — 라이트의 밝은 바탕이 일찍 덮지 않고, 띠(banding)도 없다
            LinearGradient(stops: zip(Self.gradientAlphas, Self.gradientStops).map { alpha, at in
                .init(color: palette.surface.base.opacity(Double(Int(alpha, radix: 16)!) / 255), location: at)
            }, startPoint: .top, endPoint: .bottom)
        }
    }

    private func sheet(_ build: SavedBuild, champion: Champion?, augments: [Augment], items: [Item], t: (String) -> String) -> some View {
        let line = hairline(displayScale)
        let shape = UnevenRoundedRectangle(topLeadingRadius: Radius.xxl, topTrailingRadius: Radius.xxl, style: .continuous)
        return VStack(alignment: .leading, spacing: Spacing.five) {
            if let champion {
                BuildChampionHeader(champion: champion, date: Self.localizedDate(build.createdAt, settings.locale))
            }
            if let h = build.headliner {
                HeadlinerSummary(id: h.id, skills: h.skills, stickers: h.stickers, championId: build.championId)
            }
            BuildAugmentList(augments: augments, label: t("augments"))
            if !items.isEmpty {
                BuildItemRow(items: items, label: t("items"))
            }
            if let champion {
                VStack(alignment: .leading, spacing: Spacing.two) {
                    Text(t("stats")).rnText(.label).foregroundStyle(palette.text.secondary)
                    ItemStatPanel(baseStats: champion.stats, itemStats: items.map(\.stats))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, Spacing.four + line)
        .padding(.horizontal, Spacing.three + line)
        .background(palette.surface.base, in: shape)
        // 배너 끝과 시트 바탕이 같은 색이라 rim 선이 없으면 둥근 모서리가 안 보인다. 아래 변은 그리지 않는다(아래로 밀어 잘라 낸다).
        .overlay { shape.strokeBorder(palette.border.subtle, lineWidth: line).padding(.bottom, -2 * line) }
        .clipped()
    }

    /// RN `new Date(createdAt).toLocaleDateString('ko-KR' | 'en-US')` → "2026. 11. 27." / "11/27/2026"
    static func localizedDate(_ iso: String, _ locale: AppLocale) -> String {
        let parser = ISO8601DateFormatter()
        parser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = parser.date(from: iso) ?? ISO8601DateFormatter().date(from: iso) else { return "" }
        let f = DateFormatter()
        f.locale = Locale(identifier: locale == .ko ? "ko_KR" : "en_US")
        f.setLocalizedDateFormatFromTemplate("yMd")
        return f.string(from: date)
    }
}
