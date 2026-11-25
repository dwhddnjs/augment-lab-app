import AugmentCore
import SwiftUI

// RN `src/constants/theme.ts`를 그대로 옮긴 토큰. UI 코드는 hex·숫자를 직접 쓰지 않고 이것만 쓴다.
// 값의 정답지: docs/migration/spec/design-system.md §1

public extension Color {
    /// 토큰 문자열("#RRGGBB" / "#RRGGBBAA" / "rgba(...)") → Color. 오타는 개발 중에 바로 터지게 한다.
    init(token: String) {
        guard let c = RGBA(token) else { preconditionFailure("잘못된 색 토큰: \(token)") }
        self.init(.sRGB, red: c.r, green: c.g, blue: c.b, opacity: c.a)
    }

    /// RN처럼 hex 뒤에 알파 2자리를 붙인다: `Color(hex: HeadlinerColors.kda, alpha: StageAlpha.glow)`
    init(hex: String, alpha: String) { self.init(token: hex + alpha) }
}

/// 테마 팔레트 (`Theme.dark` / `Theme.light`)
public struct Palette: Sendable {
    public struct Surface: Sendable { public let base, raised, sunken, overlay: Color }
    public struct Text: Sendable { public let primary, secondary, tertiary, disabled, inverse, onAccent: Color }
    public struct Border: Sendable { public let `default`, subtle, strong: Color }
    public struct Accent: Sendable { public let `default`, subtle, onAccent: Color }
    public struct Status: Sendable { public let danger, dangerSubtle: Color }

    public let scheme: ColorScheme
    public let surface: Surface
    public let text: Text
    public let border: Border
    public let accent: Accent
    public let status: Status
    public let glassFill: Color

    public static func of(_ scheme: ColorScheme) -> Palette { scheme == .dark ? .dark : .light }

    public static let dark = Palette(
        scheme: .dark,
        surface: Surface(base: Color(token: "#0E0F12"), raised: Color(token: "#16181C"), sunken: Color(token: "#0A0B0D"), overlay: Color(token: "rgba(0,0,0,0.6)")),
        text: Text(primary: Color(token: "#F2F4F7"), secondary: Color(token: "#B0B4BA"), tertiary: Color(token: "#7A7F87"),
                   disabled: Color(token: "#4A4E55"), inverse: Color(token: "#0E0F12"), onAccent: Color(token: "#04231A")),
        border: Border(default: Color(token: "#26292F"), subtle: Color(token: "#1B1E22"), strong: Color(token: "#3A3F47")),
        accent: Accent(default: Color(token: "#00E994"), subtle: Color(token: "rgba(0,233,148,0.14)"), onAccent: Color(token: "#04231A")),
        status: Status(danger: Color(token: "#F26D6D"), dangerSubtle: Color(token: "rgba(242,109,109,0.16)")),
        glassFill: Color(token: "rgba(255,255,255,0.06)"))

    public static let light = Palette(
        scheme: .light,
        surface: Surface(base: Color(token: "#F2F2F7"), raised: Color(token: "#FFFFFF"), sunken: Color(token: "#E5E5EA"), overlay: Color(token: "rgba(15,17,21,0.45)")),
        text: Text(primary: Color(token: "#0E0F12"), secondary: Color(token: "#5A6068"), tertiary: Color(token: "#878D96"),
                   disabled: Color(token: "#B4B8BE"), inverse: Color(token: "#FAFBFC"), onAccent: Color(token: "#04231A")),
        border: Border(default: Color(token: "#D7DAE0"), subtle: Color(token: "#E6E8EC"), strong: Color(token: "#B4B8BE")),
        accent: Accent(default: Color(token: "#18A368"), subtle: Color(token: "rgba(24,163,104,0.12)"), onAccent: Color(token: "#04231A")),
        status: Status(danger: Color(token: "#D0463F"), dangerSubtle: Color(token: "rgba(208,70,63,0.16)")),
        glassFill: Color(token: "rgba(255,255,255,0.45)"))
}

private struct PaletteKey: EnvironmentKey { static let defaultValue = Palette.dark }

public extension EnvironmentValues {
    /// 현재 모드 팔레트. 루트에서 `.providesPalette()`로 넣는다(I-06a).
    var palette: Palette {
        get { self[PaletteKey.self] }
        set { self[PaletteKey.self] = newValue }
    }
}

private struct ProvidesPalette: ViewModifier {
    @Environment(\.colorScheme) private var scheme
    func body(content: Content) -> some View { content.environment(\.palette, .of(scheme)) }
}

public extension View {
    /// 현재 colorScheme에 맞는 팔레트를 하위 뷰에 넣는다. 시트·풀스크린 안에서도 다시 걸어 준다.
    func providesPalette() -> some View { modifier(ProvidesPalette()) }
}

/// 증강 희귀도 색 (`AugmentRarityColors` / `...Light`). **카드 아트 위에서는 항상 dark**를 쓴다(spec §7).
public enum RarityColors {
    public static let darkHex: [Rarity: String] = [.silver: "#B5B6B5", .gold: "#D0AE80", .prismatic: "#B592D6"]
    public static let lightHex: [Rarity: String] = [.silver: "#848484", .gold: "#9C7A58", .prismatic: "#976ED3"]
    public static func hex(_ r: Rarity, _ scheme: ColorScheme) -> String { (scheme == .dark ? darkHex : lightHex)[r]! }
    public static func color(_ r: Rarity, _ scheme: ColorScheme) -> Color { Color(token: hex(r, scheme)) }
    /// 아이콘을 못 받았을 때의 대체 글리프 (MCI)
    public static let glyph: [Rarity: String] = [.silver: "shield", .gold: "star", .prismatic: "shimmer"]
}

/// 챔피언 티어 색 (`TierColors`) — S는 프리즘, B는 실버와 같은 값
public enum TierColors {
    public static let darkHex: [Tier: String] = [.S: "#B592D6", .A: "#E8B339", .B: "#B5B6B5", .C: "#C08C5C", .D: "#767D87"]
    public static let lightHex: [Tier: String] = [.S: "#976ED3", .A: "#AD821F", .B: "#848484", .C: "#8A5F33", .D: "#5C626A"]
    public static func hex(_ t: Tier, _ scheme: ColorScheme) -> String { (scheme == .dark ? darkHex : lightHex)[t]! }
    /// 그라데이션 알파 (`TierGradientAlpha`): 가장자리 10% · 가운데 65% · 테두리 40%
    public static let edge = "1A", center = "A6", border = "66"
}

/// 아트 위의 고정 어두운 톤 (두 모드 공통)
public enum HeroOverlay {
    public static let scrimDark = ["rgba(8,9,11,0)", "rgba(8,9,11,0.55)", "rgba(8,9,11,0.85)", "rgba(8,9,11,0.96)"].map(Color.init(token:))
    public static let scrimCorner = ["rgba(8,9,11,0.6)", "rgba(8,9,11,0.25)", "rgba(8,9,11,0)"].map(Color.init(token:))
    public static let cardBase = Color(token: "#0A0B0D")
    public static let tileBg = Color(token: "rgba(0,0,0,0.45)")
    public static let tileBorder = Color(token: "rgba(255,255,255,0.14)")
    public static let textPrimary = Color(token: "#F2F4F7")
    public static let textSecondary = Color(token: "#B5BAC1")
}

/// 증강 카드 색 (`AugmentCardColors`)
public enum AugmentCardColors {
    /// 설명 속 골드 수치
    public static let amount = Color(token: "#E8B339")
    /// 라이트: 색 그림자 (hex + 알파 4D)
    public static let lightShadowAlpha = "4D"
    public static let lightShadowHex: [Rarity: String] = [.silver: "#3E434B", .gold: "#6B4423", .prismatic: "#5B47C2"]
    /// 다크: 글로우 (색, 안쪽 알파, 바깥 알파)
    public static let darkGlow: [Rarity: (hex: String, inner: String, outer: String)] = [
        .silver: ("#D5D8DE", "14", "1A"), .gold: ("#E9CFAF", "2B", "2B"), .prismatic: ("#BCACFF", "40", "61"),
    ]
}

/// 헤드라이너 고유색 — 무대 조명이라 두 모드 공통. 키 = 헤드라이너 id
public let HeadlinerColors: [String: String] = [
    "kda": "#E83850", "pentakill": "#D4AF6A", "heartsteel": "#B4EE7A", "true-damage": "#2DD4BF",
    "disco": "#B58CFF", "cafe-cuties": "#FF6A84", "bees": "#FFC23D", "command-line": "#FF8A3D",
    "worlds": "#3D7DFF", "arcade": "#E040B0", "debonair": "#7CC24A", "la-ilusion": "#D8B85A", "maestro": "#E04A22",
]

/// 헤드라이너 무대 알파 (`StageAlpha`)
public enum StageAlpha {
    public static let light = "73", wash = "47", edge = "66", glow = "4D"
}

/// 마크 텍스트 색 (`StatTextColors`) — 키 k·ad·ap·as·hp·sv
public enum StatTextColors {
    public static let darkHex = ["k": "#C2C59B", "ad": "#EC8D34", "ap": "#786CFF", "as": "#FFE78C", "hp": "#21995C", "sv": "#DC4460"]
    public static let lightHex = ["k": "#6E7142", "ad": "#AA5A10", "ap": "#5E50FF", "as": "#876B00", "hp": "#1B7E4C", "sv": "#D52042"]
    public static func color(_ key: String, _ scheme: ColorScheme) -> Color? {
        (scheme == .dark ? darkHex : lightHex)[key].map(Color.init(token:))
    }
}

/// 펜타킬 스킬 카드 색 (두 모드 공통). 키 e·s·h·b는 마크 텍스트(empower·spell·heal·shield)
public enum SkillCardColors {
    public static let portraitRing = Color(token: "#EBD7B4")
    public static let swirl = Color(token: "#8F6F4C")
    public static let body = Color(token: "#AEB4BD")
    public static let key = Color(token: "#D9A441")
    public static let empower = Color(token: "#E0709A")
    public static let spell = Color(token: "#E2AE4C")
    public static let heal = Color(token: "#7FCB74")
    public static let shield = Color(token: "#5FBBD0")
    public static func mark(_ key: String) -> Color? { ["e": empower, "s": spell, "h": heal, "b": shield][key] }
}

public enum Brand {
    public static let splashBg = Color(token: "#0E0F12")
}
