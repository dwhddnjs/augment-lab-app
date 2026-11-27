import SwiftUI

/// 목록 행의 아이콘 틀 크기. 빈 칸 힌트도 이 높이에 맞춰 같은 자리에 앉는다.
let pickRowIcon: CGFloat = 30
/// 증강 타일은 테두리 안에 아이콘을 0.75로 그린다 — 아이템도 같은 비율(RN `Math.round(30 × 0.75)`).
let pickRowImage: CGFloat = (pickRowIcon * 0.75).rounded()
/// 행 모서리에 얹는 제거 배지
let removeBadgeSize: CGFloat = 14

/// 커스텀 패널 아래 절반의 한 칸(왼쪽 증강 · 오른쪽 아이템) (RN `pick-column.tsx`).
/// 지금 담기는 칸만 accent 테두리로 **항상** 켠다 — 드래그 중이 아니어도 어디로 담기는지 보인다.
/// 손가락이 드롭 경계를 넘으면 그 칸 위에 어두운 베일 + 트레이 글리프를 얹는다(경계 계산은 화면 몫).
/// 반대편 칸 전환 탭은 칸 전체를 덮는 한 겹이 아니라 머리 · 각 행 · 목록 아래 빈자리가 각자 받는다 — 안쪽 목록이 스크롤돼야 한다.
struct PickColumn<Content: View>: View {
    let label: String
    /// "3/5"
    let count: String
    let active: Bool
    let dropping: Bool
    /// 이 칸으로 전환. 이미 이 칸이면 nil — 눌러도 아무 일이 없어야 한다.
    let onSwitch: (() -> Void)?
    let switchLabel: String
    @ViewBuilder let content: Content

    @Environment(\.palette) private var palette

    var body: some View {
        VStack(spacing: 0) {
            Button { onSwitch?() } label: {
                HStack {
                    Text(label).foregroundStyle(palette.text.secondary)
                    Spacer(minLength: 0)
                    Text(count).foregroundStyle(palette.text.tertiary)
                }
                .rnText(size: 10, lineHeight: 13, weight: .semibold)
                .padding(.horizontal, Spacing.half)
                .padding(.bottom, Spacing.one)
                .contentShape(Rectangle())
            }
            .buttonStyle(PressDim(opacity: onSwitch == nil ? 1 : 0.6))
            .disabled(onSwitch == nil)
            .accessibilityLabel(onSwitch == nil ? label : switchLabel)

            content
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .overlay {
                    // 담긴 행을 색으로 덮지 않는다 — 어둡게 깔고 "여기 놓으라"는 글리프만 띄운다.
                    if active && dropping {
                        ZStack {
                            palette.surface.overlay
                            IconView(.mci("arrow-down-circle-outline"), size: 28).foregroundStyle(palette.accent.default)
                        }
                        .allowsHitTesting(false)
                    }
                }
                .clipShape(Radius.shape(Radius.lg))
                // 굵기는 그대로 둔다 — 바꾸면 강조될 때마다 안쪽 목록이 1pt 밀린다.
                .overlay(Radius.shape(Radius.lg).strokeBorder(active ? palette.accent.default : palette.border.subtle, lineWidth: 1))
                .padding(.bottom, Spacing.two)
        }
        .frame(maxWidth: .infinity)
    }
}

/// 담은 목록 — 행 사이 4, 아래는 홈 인디케이터만큼 띄운다. 행 아래 빈자리를 눌러도 칸이 바뀐다.
struct PickList<Content: View>: View {
    let bottomInset: CGFloat
    let onSwitch: (() -> Void)?
    @ViewBuilder let content: Content

    var body: some View {
        GeometryReader { geo in
            ScrollView(showsIndicators: false) {
                VStack(spacing: Spacing.one) { content }
                    .padding(Spacing.one)
                    .padding(.bottom, bottomInset)
                    .frame(maxWidth: .infinity, minHeight: geo.size.height, alignment: .top)
                    .contentShape(Rectangle())
                    .onTapGesture { onSwitch?() }
            }
        }
    }
}

/// 행 오른쪽 위 모서리의 유일한 제거 수단 — 행 자체는 칸 전환이다. tertiary로 낮춰 지울 때만 눈에 들어오게 한다.
struct RemoveBadge: View {
    let label: String
    let onPress: () -> Void

    @Environment(\.palette) private var palette

    var body: some View {
        Button(action: onPress) {
            IconView(.mci("close-circle-outline"), size: removeBadgeSize)
                .foregroundStyle(palette.text.tertiary)
                .contentShape(Rectangle().inset(by: -10)) // RN hitSlop 10
        }
        .buttonStyle(PressDim(opacity: 0.5))
        .accessibilityLabel(label)
        .padding(.top, Spacing.half)
        .padding(.trailing, Spacing.half)
    }
}

/// 빈 칸은 "여기에 넣는 자리"로 보여야 한다 — 담긴 행과 같은 크기·자리의 점선 한 칸. 아래 빈자리까지 눌린다.
struct EmptyHint: View {
    let text: String
    let onPress: (() -> Void)?

    @Environment(\.palette) private var palette

    var body: some View {
        Text(text)
            .rnText(size: 11, lineHeight: 15)
            .foregroundStyle(palette.text.tertiary)
            .multilineTextAlignment(.center)
            .padding(.horizontal, Spacing.two)
            .frame(maxWidth: .infinity)
            .frame(height: pickRowIcon + Spacing.two)
            // RN iOS 점선 = 두께 × 3
            .overlay(Radius.shape(Radius.md).strokeBorder(palette.border.default, style: StrokeStyle(lineWidth: 1, dash: [3, 3])))
            .padding(Spacing.one)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .contentShape(Rectangle())
            .onTapGesture { onPress?() }
    }
}

/// 왼쪽 테두리만 굵은 행 바탕(RN `borderLeftWidth: 3` + `borderRadius: md`).
/// ponytail: 안쪽 모서리를 원으로 근사했다(RN은 가로 5 × 세로 8 타원). 3pt 띠라 차이가 작다.
struct LeftAccentBackground: View {
    let accent: Color
    let fill: Color

    var body: some View {
        ZStack(alignment: .trailing) {
            Radius.shape(Radius.md).fill(accent)
            GeometryReader { geo in
                UnevenRoundedRectangle(
                    topLeadingRadius: Radius.md - 3, bottomLeadingRadius: Radius.md - 3,
                    bottomTrailingRadius: Radius.md, topTrailingRadius: Radius.md, style: .continuous
                )
                .fill(fill)
                .frame(width: geo.size.width - 3)
                .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
    }
}

/// 눌림 opacity
struct PressDim: ButtonStyle {
    let opacity: Double
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.opacity(configuration.isPressed ? opacity : 1)
    }
}
