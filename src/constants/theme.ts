import "@/styles/global.css";
import { Platform } from "react-native";

export const Theme = {
  dark: {
    surface: {
      base: "#0E0F12",
      raised: "#16181C",
      sunken: "#0A0B0D",
      overlay: "rgba(0,0,0,0.6)",
    },
    text: {
      primary: "#F2F4F7",
      secondary: "#B0B4BA",
      tertiary: "#7A7F87",
      disabled: "#4A4E55",
      inverse: "#0E0F12",
      onAccent: "#04231A",
    },
    border: {
      default: "#26292F",
      subtle: "#1B1E22",
      strong: "#3A3F47",
    },
    accent: {
      default: "#1ED7A0",
      hover: "#2FE3AE",
      pressed: "#17B689",
      subtle: "rgba(30,215,160,0.14)",
      onAccent: "#04231A",
    },
    status: {
      success: { default: "#1ED7A0", subtle: "rgba(30,215,160,0.14)" },
      warning: { default: "#F2B33D", subtle: "rgba(242,179,61,0.16)" },
      danger: { default: "#F26D6D", subtle: "rgba(242,109,109,0.16)" },
      info: { default: "#5BA8FF", subtle: "rgba(91,168,255,0.16)" },
    },
    // 유리 질감용 — 어두운 배경 위 칩/패널의 광택·림 라이트
    glass: {
      fill: "rgba(255,255,255,0.06)", // 베이스 반투명 채움
      sheen: "rgba(255,255,255,0.16)", // 상단 하이라이트 그라디언트 시작
      rimTop: "rgba(255,255,255,0.32)", // 상단 가장자리(빛 받는 면)
      rim: "rgba(255,255,255,0.10)", // 좌우/하단 가장자리
    },
  },
  light: {
    // iOS grouped 스타일 — 배경은 회색빛(systemGroupedBackground), 카드는 흰색.
    // 다크와 동일한 시맨틱: 밝기 raised(카드) > base(배경) > sunken.
    surface: {
      base: "#F2F2F7",
      raised: "#FFFFFF",
      sunken: "#E5E5EA",
      overlay: "rgba(15,17,21,0.45)",
    },
    text: {
      primary: "#0E0F12",
      secondary: "#5A6068",
      tertiary: "#878D96",
      disabled: "#B4B8BE",
      inverse: "#FAFBFC",
      onAccent: "#04231A",
    },
    border: {
      default: "#D7DAE0",
      subtle: "#E6E8EC",
      strong: "#B4B8BE",
    },
    // 라이트 배경(흰/회색) 위 텍스트·아이콘 가독성을 위해 진한 민트로.
    // default #0A8466 = 흰 배경 대비 ~4.7:1 (WCAG AA 통과).
    accent: {
      default: "#0A8466",
      hover: "#0C9676",
      pressed: "#086E54",
      subtle: "rgba(10,132,102,0.12)",
      onAccent: "#FFFFFF",
    },
    status: {
      success: { default: "#0E9F79", subtle: "rgba(14,159,121,0.12)" },
      warning: { default: "#C98712", subtle: "rgba(201,135,18,0.16)" },
      danger: { default: "#D0463F", subtle: "rgba(208,70,63,0.16)" },
      info: { default: "#2E78D6", subtle: "rgba(46,120,214,0.16)" },
    },
    // 유리 질감용 — 밝은 배경에선 흰 광택을 더 강하게 주어 유리알 느낌
    glass: {
      fill: "rgba(255,255,255,0.45)",
      sheen: "rgba(255,255,255,0.65)",
      rimTop: "rgba(255,255,255,0.9)",
      rim: "rgba(255,255,255,0.35)",
    },
  },
} as const;

export type ThemeColors = typeof Theme.dark;

export const Typography = {
  display: { fontSize: 48, lineHeight: 52, fontWeight: "700" as const },
  title: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "500" as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
  code: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
} as const;

export const Radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

type ElevationLevel = {
  shadowColor?: string;
  shadowOpacity?: number;
  shadowOffset?: { width: number; height: number };
  shadowRadius?: number;
  elevation?: number;
};

const makeElevation = (
  ios: Omit<ElevationLevel, "elevation">,
  androidElevation: number,
): ElevationLevel =>
  Platform.select({
    ios,
    android: { elevation: androidElevation } as ElevationLevel,
    default: {},
  })!;

export const Elevation = {
  level0: {} as ElevationLevel,
  level1: makeElevation(
    {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
    },
    1,
  ),
  level2: makeElevation(
    {
      shadowColor: "#000",
      shadowOpacity: 0.14,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 10,
    },
    4,
  ),
  level3: makeElevation(
    {
      shadowColor: "#000",
      shadowOpacity: 0.22,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 18,
    },
    8,
  ),
};

export const AugmentRarityColors = {
  silver: {
    border: "#9BA3AE",
    glow: "rgba(155,163,174,0.35)",
    badge: "#9BA3AE",
    badgeText: "#0E0F12",
  },
  gold: {
    border: "#E8B339",
    glow: "rgba(232,179,57,0.40)",
    badge: "#E8B339",
    badgeText: "#1A0F00",
  },
  prismatic: {
    border: "#C6A1FF",
    gradient: ["#FF9ECE", "#C6A1FF", "#6EE7FF", "#9FFFC9"] as [
      string,
      string,
      ...string[],
    ],
    glow: "rgba(198,161,255,0.45)",
    badge: "#C6A1FF",
    badgeText: "#1A0033",
  },
} as const;

// 증강 아이콘 미해결 시 표시하는 희귀도 폴백 글리프 (MaterialCommunityIcons).
// 여러 feature(draft·builds·items)가 공유하므로 여기 단일 정의를 import해 쓴다.
export const AugmentRarityGlyphs = {
  silver: "shield",
  gold: "star",
  prismatic: "shimmer",
} as const;

// splash 히어로 카드 내부 — 라이트/다크 공통 고정 어두운 톤(이미지 가독성).
// 카드 위는 컬러풀한 splash라 모드와 무관하게 어두운 scrim/타일이 표준이며,
// 이 그룹이 카드 내부 색의 유일한 출처다(다른 곳에서 hex 직접 쓰지 말 것).
export const HeroOverlay = {
  scrim0: "rgba(8,9,11,0)",
  scrim1: "rgba(8,9,11,0.55)",
  scrim2: "rgba(8,9,11,0.85)",
  scrim3: "rgba(8,9,11,0.96)",
  cardBase: "#0A0B0D", // splash 로드 전/빈 영역 베이스
  tileBg: "rgba(0,0,0,0.45)", // 증강·아이템 타일 배경
  tileBorder: "rgba(255,255,255,0.14)", // 아이템 타일 테두리
  chipBg: "rgba(0,0,0,0.55)", // 날짜 칩 배경
  textPrimary: "#F2F4F7",
  textSecondary: "#B5BAC1",
} as const;

export const Brand = {
  splashBg: "#0E0F12",
  logoBgFrom: "#3C9FFE",
  logoBgTo: "#0274DF",
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  double: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
