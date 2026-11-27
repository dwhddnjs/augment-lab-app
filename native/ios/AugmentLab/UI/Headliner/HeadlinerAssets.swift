import AugmentCore
import SwiftUI
import UIKit

/// 헤드라이너 로고 한 벌 (RN `headliners/assets.ts`). 로고별 예외는 여기에만 둔다 — 그리는 쪽은 이 표만 읽는다.
/// - light: 라이트 모드 판 없는 자리(헤더)에 쓸 그림. 없으면 asset 그대로.
/// - small: 작은 자리(홈 시작 타일·빌드 카드 배지)에 쓸 그림. 없으면 asset 그대로.
/// - aspect: 판 없이 그릴 때 상자의 가로:세로. 기본 1 — 정사각 상자에 fit.
/// - ink: 상자 대비 실제 그림(투명 여백·번진 빛 제외) 비율. 정사각 로고는 긴 변, 가로로 긴 K/DA는 높이.
/// - inkLeft: 그린 폭 대비 왼쪽 투명 여백. 없으면 정사각 로고는 (1 - ink) / 2, 가로로 긴 로고는 0.
public struct HeadlinerLogoArt: Sendable {
    public var asset: String
    public var light: String? = nil
    public var small: String? = nil
    public var aspect: CGFloat = 1
    public var ink: CGFloat = 1
    public var inkLeft: CGFloat? = nil
}

public enum HeadlinerAssets {
    public static func logo(_ id: HeadlinerId) -> HeadlinerLogoArt {
        let asset = "headliners-\(id.rawValue)"
        switch id {
        // K/DA 워드마크: 1000×267, 글로우 여백을 빼면 높이의 73%, 폭의 90%(좌우 5%씩)가 그림.
        case .kda: return HeadlinerLogoArt(asset: "headliners-kda-mark", aspect: 1000 / 267, ink: 0.73, inkLeft: 0.05)
        case .bees: return HeadlinerLogoArt(asset: asset, ink: 0.8)
        // 라이트: 진한 금색 그림자를 깐 판. small: 번진 빛을 절반쯤 걷어낸 판. 번진 빛 때문에 82%만 그림.
        case .commandLine: return HeadlinerLogoArt(asset: asset, light: asset + "-light", small: asset + "-small", ink: 0.82)
        default: return HeadlinerLogoArt(asset: asset)
        }
    }

    /// 판 없이 그리는 로고의 상자 높이 — 잉크의 긴 변이 `inkSize`pt가 되게 한다.
    /// 가로로 긴 워드마크(K/DA)는 그림 높이를 절반만 준다(같은 높이면 폭이 네 배로 늘어 혼자 튄다).
    public static func logoBoxHeight(_ id: HeadlinerId, inkSize: CGFloat) -> CGFloat {
        let art = logo(id)
        return ((art.aspect > 1 ? inkSize / 2 : inkSize) / art.ink).rounded()
    }

    /// 상자 왼쪽 끝에서 실제 그림 왼쪽 끝까지(pt). 그림을 다른 요소의 세로선에 맞출 때 그만큼 당긴다.
    /// fit으로 남는 좌우 여백 + 원본 안 투명 여백(inkLeft).
    public static func logoInkLeft(_ id: HeadlinerId, boxHeight: CGFloat) -> CGFloat {
        let art = logo(id)
        let px = UIImage(named: art.small ?? art.asset)?.size ?? CGSize(width: 1, height: 1)
        let boxW = boxHeight * art.aspect
        let drawnW = min(boxW, boxHeight * px.width / px.height)
        return (boxW - drawnW) / 2 + drawnW * (art.inkLeft ?? (art.aspect > 1 ? 0 : (1 - art.ink) / 2))
    }

    /// 열혈 팬 21레벨 카드 윗변에 걸치는 Worlds 로고(파란 빛 두름). 625×633, 빛 여백을 빼면 77%가 그림.
    public enum WorldsCardMark {
        public static let asset = "headliners-worlds-card"
        public static let ink: CGFloat = 0.77
        public static let aspect: CGFloat = 625 / 633
    }

    /// 커맨드 라인 리롤 버튼. flash는 번쩍이는 순간의 레이어, light는 라이트 모드 그림자 판.
    public enum CommandLineReroll {
        public static let icon = "headliners-command-line-reroll"
        public static let lightIcon = "headliners-command-line-reroll-light"
        public static let flash = "headliners-command-line-reroll-flash"
    }

    /// 펜타킬 스킬 카드 장식. 배경·골드 프레임은 증강 카드 것을 쓴다.
    public enum SkillCardArt {
        public static let swirl = "headliners-skill-card-swirl"
        public static let iconFrame = "headliners-skill-card-icon-frame"
    }

    /// HEARTSTEEL 스티커 초상(256×128)
    public static func stickerPortrait(_ id: StickerId) -> String { "headliners-sticker-\(id.rawValue)" }
}
