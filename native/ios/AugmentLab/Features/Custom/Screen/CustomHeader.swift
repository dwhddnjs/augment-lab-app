import AugmentCore
import SwiftUI
import UIKit

private let L = L10n(
    ko: ["placeholder": "증강 이름을 입력해주세요", "placeholderItem": "아이템 이름을 입력해주세요", "clear": "지우기",
         "augment": "증강", "item": "아이템", "toggleLabel": "증강 · 아이템 전환"],
    en: ["placeholder": "Search augments by name", "placeholderItem": "Search items by name", "clear": "Clear",
         "augment": "Augment", "item": "Item", "toggleLabel": "Augment / Item"]
)

/// 헤더 가운데 이름 검색 (RN `augment-search-field.tsx`). 토글이 가리키는 쪽을 찾는다 — 문구만 바뀌고 필터링은 드래프트가 한쪽에만 건다.
struct AugmentSearchField: View {
    @Binding var query: String
    let target: CustomDraft.PickTarget

    /// 가로 화면이라 제한이 없으면 헤더 전체로 늘어난다.
    static let maxWidth: CGFloat = 300
    /// 44 원형 버튼 사이에서 눌리지 않을 만큼만. 테두리는 글라스 림에 맡긴다.
    static let height: CGFloat = 32

    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette

    var body: some View {
        let t = L.t(settings.locale)
        GlassSurface(cornerRadius: Radius.full) {
            HStack(spacing: Spacing.two) {
                IconView(.mci("magnify"), size: 15).foregroundStyle(palette.text.tertiary)
                TextField("", text: $query, prompt: Text(t(target == .item ? "placeholderItem" : "placeholder")).foregroundStyle(palette.text.tertiary))
                    .font(.system(size: 13))
                    .foregroundStyle(palette.text.primary)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .submitLabel(.search)
                if !query.isEmpty {
                    Button { query = "" } label: {
                        IconView(.mci("close-circle"), size: 14).foregroundStyle(palette.text.tertiary)
                            .contentShape(Rectangle().inset(by: -Spacing.two)) // RN hitSlop 8
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(t("clear"))
                }
            }
            .padding(.horizontal, Spacing.double)
            .frame(height: Self.height)
        }
        .frame(maxWidth: Self.maxWidth)
    }
}

/// 헤더의 증강↔아이템 전환 (RN `pick-target-toggle.tsx`). 트랙 전체가 버튼 하나 — 누를 때마다 반대편으로.
/// 노브도 글라스, accent는 그 위 반투명 층(26 미만 블러 폴백에서도 활성 쪽 색이 남는다).
/// 노브 위치는 `target`에서 곧바로 낸다 — 따로 들고 있으면 두 번 빨리 눌린 순간 노브와 실제 값이 갈라선다.
struct PickTargetToggle: View {
    let target: CustomDraft.PickTarget
    /// 뒤집기는 드래프트가 이전 값 기준으로 한다
    let onToggle: () -> Void

    static let pad = Spacing.one
    /// 검색 필드와 같은 높이
    static let trackHeight = AugmentSearchField.height
    /// 가장 긴 라벨("Augment") 기준. 노브 폭 = 칸 폭이라야 좌우 끝 여백이 둘 다 `pad`로 같다.
    static let segment: CGFloat = 58

    @Environment(AppSettings.self) private var settings
    @Environment(\.palette) private var palette
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        let t = L.t(settings.locale)
        Button {
            UISelectionFeedbackGenerator().selectionChanged()
            onToggle()
        } label: {
            GlassSurface(cornerRadius: Radius.full) {
                ZStack(alignment: .leading) {
                    GlassSurface(cornerRadius: Radius.full) { palette.accent.subtle }
                        .frame(width: Self.segment, height: Self.trackHeight - Self.pad * 2)
                        .offset(x: Self.pad + (target == .item ? Self.segment : 0))
                        // RN withTiming 기본(inOut quad) 180ms
                        .animation(.timingCurve(0.455, 0.03, 0.515, 0.955, duration: 0.18), value: target)
                    HStack(spacing: 0) {
                        segmentLabel(t("augment"), active: target == .augment)
                        segmentLabel(t("item"), active: target == .item)
                    }
                    .padding(.horizontal, Self.pad)
                }
                .frame(width: Self.segment * 2 + Self.pad * 2, height: Self.trackHeight)
            }
            .overlay(Capsule().strokeBorder(palette.border.subtle, lineWidth: hairline(displayScale)))
            .contentShape(Rectangle().inset(by: -6)) // RN hitSlop 6
        }
        .buttonStyle(.plain)
        // 트랙 안 두 라벨은 그림일 뿐 — 무엇을 바꾸는 스위치인지와 지금 어느 쪽인지를 따로 알린다.
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(t("toggleLabel"))
        .accessibilityValue(t(target == .item ? "item" : "augment"))
        .accessibilityAddTraits(.isToggle)
    }

    private func segmentLabel(_ text: String, active: Bool) -> some View {
        Text(text)
            .rnText(size: 11, lineHeight: 16, weight: .bold)
            .foregroundStyle(active ? palette.accent.default : palette.text.tertiary)
            .lineLimit(1)
            .frame(width: Self.segment)
    }
}
