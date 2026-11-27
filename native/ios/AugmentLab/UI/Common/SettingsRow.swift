import SwiftUI

/// 설정 목록 한 줄 (RN `components/ui/settings-row.tsx` — 원래 @expo/ui SwiftUI라 그대로 옮겼다). 마이페이지·데이터 관리.
public struct SettingsRow: View {
    let label: String
    var value: String?
    /// 라벨 아래 보조 설명 한 줄
    var description: String?
    let icon: String
    let iconColor: Color
    /// 위험 동작(초기화)용. nil이면 기본 라벨 색
    var labelColor: Color?
    let rowBackground: Color
    var action: (() -> Void)?

    public init(_ label: String, value: String? = nil, description: String? = nil, icon: String, iconColor: Color,
                labelColor: Color? = nil, rowBackground: Color, action: (() -> Void)? = nil) {
        self.label = label; self.value = value; self.description = description; self.icon = icon
        self.iconColor = iconColor; self.labelColor = labelColor; self.rowBackground = rowBackground; self.action = action
    }

    public var body: some View {
        Button { action?() } label: {
            HStack(spacing: 12) {
                Image(systemName: icon).font(.system(size: 17)).foregroundStyle(iconColor).frame(width: 26)
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).foregroundStyle(labelColor ?? Color(uiColor: .label))
                    if let description {
                        Text(description).font(.footnote)
                    }
                }
                Spacer()
                // RN 코드는 secondaryLabel·tertiaryLabel을 적었지만 @expo/ui가 그 이름을 못 읽어(색 문자열 변환 실패 → 수정자 무시)
                // 실제 화면은 기본 전경색이었다. 화면에 보이던 대로 맞춘다(I-41-04).
                if let value { Text(value) }
                if action != nil {
                    Image(systemName: "chevron.right").font(.system(size: 13))
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .listRowBackground(rowBackground)
    }
}
