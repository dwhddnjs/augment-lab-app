import "@/styles/global.css";

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
      default: "#00E994",
      subtle: "rgba(0,233,148,0.14)",
      onAccent: "#04231A",
    },
    status: {
      success: { default: "#1ED7A0", subtle: "rgba(30,215,160,0.14)" },
      warning: { default: "#F2B33D", subtle: "rgba(242,179,61,0.16)" },
      danger: { default: "#F26D6D", subtle: "rgba(242,109,109,0.16)" },
      info: { default: "#5BA8FF", subtle: "rgba(91,168,255,0.16)" },
    },
    // 유리 질감 흉내 — 어두운 배경 위 칩/패널의 반투명 채움
    glass: {
      fill: "rgba(255,255,255,0.06)",
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
    // 라이트 accent — 흰/회색 배경 위 가독을 위해 다크(#00E994)보다 진한 민트.
    // #18A368 = 흰 배경 3.24:1(UI/큰 텍스트 AA). onAccent는 흰색보다 대비 높은 어두운 톤.
    accent: {
      default: "#18A368",
      subtle: "rgba(24,163,104,0.12)",
      onAccent: "#04231A",
    },
    status: {
      success: { default: "#0E9F79", subtle: "rgba(14,159,121,0.12)" },
      warning: { default: "#C98712", subtle: "rgba(201,135,18,0.16)" },
      danger: { default: "#D0463F", subtle: "rgba(208,70,63,0.16)" },
      info: { default: "#2E78D6", subtle: "rgba(46,120,214,0.16)" },
    },
    // 밝은 배경에선 흰 채움을 더 강하게 주어 유리알 느낌
    glass: {
      fill: "rgba(255,255,255,0.45)",
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
};

export const Elevation: Record<"level1" | "level2", ElevationLevel> = {
  level1: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  level2: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
};

// 증강 희귀도 고유색. 앱이 실제로 읽는 값은 border 하나다 — 테두리·아이콘 tint·
// 이름 색에 모두 이 한 색을 쓴다.
//
// 값은 게임 증강 카드 프레임(assets/augment-card/frame-*.png) 테두리 그라데이션에서 뽑았다.
// 다크는 금속 면(위에서 1/4 지점)의 색이다. 프리즘은 위쪽이 분홍·민트로 변해서, 아래쪽을
// 덮는 보라 중 가장 밝은 값을 쓴다. 밝은 배경 위에 그대로 올리면 대비가 무너지므로
// 라이트 모드용 짝을 따로 두고 useRarityColors() 가 골라준다.
export const AugmentRarityColors: Record<
  "silver" | "gold" | "prismatic",
  { border: string }
> = {
  silver: { border: "#B5B6B5" },
  gold: { border: "#D0AE80" },
  prismatic: { border: "#B592D6" },
};

/**
 * 라이트 모드 짝. 같은 프레임 그라데이션을 따라 내려가다 흰 배경(surface.raised)
 * 대비가 3.5:1 을 넘는 첫 지점의 색이다(실버 3.7, 골드 3.9, 프리즘 3.8).
 * 11pt 이름은 본문 텍스트 AA(4.5:1)에 못 미치고 UI 요소 기준(3:1)만 넘는다. 그래서 라이트 모드의
 * 증강 이름(아이템 화면·픽 현황)은 text.secondary 로 쓰고 이 색은 보더·아이콘에만 남긴다.
 */
export const AugmentRarityColorsLight: typeof AugmentRarityColors = {
  silver: { border: "#848484" },
  gold: { border: "#9C7A58" },
  prismatic: { border: "#976ED3" },
};

/**
 * 챔피언 티어(S~D) 색 — 인게임 등급 위계를 그대로 빌린다.
 * S 프리즘 / B 실버 는 위 증강 희귀도 색을 재사용하고(같은 색이 같은 등급을 뜻해야 한다),
 * C 는 그 아래 동(브론즈), D 는 철이다. A 만 증강 골드(게임 카드의 샴페인색)를 쓰지 않는다 — 브론즈 C 와
 * 색상각이 같아 배너 그라데이션에서 구분되지 않는다(ΔE 14). 채도 높은 금색을 따로 둔다. C·D 를 둘 다 어두운 무채색으로 두면 서로도
 * 배경과도 구분되지 않아서(#6D737C/#4F545C 였다) C 에만 색상을 주고 D 는 명도를 올렸다.
 *
 * 쓰이는 곳은 티어 배너 그라데이션과 챔피언 타일 테두리 — 둘 다 UI 요소라 대비 기준이
 * 3:1 이다. 라이트 짝을 따로 두는 이유는 useRarityColors 주석과 같다(실버가 흰 배경에서 사라진다).
 */
export const TierColors: Record<
  "dark" | "light",
  Record<"S" | "A" | "B" | "C" | "D", string>
> = {
  dark: {
    S: AugmentRarityColors.prismatic.border,
    A: "#E8B339",
    B: AugmentRarityColors.silver.border,
    C: "#C08C5C",
    D: "#767D87",
  },
  light: {
    S: AugmentRarityColorsLight.prismatic.border,
    A: "#AD821F",
    B: AugmentRarityColorsLight.silver.border,
    C: "#8A5F33",
    D: "#5C626A",
  },
};

/**
 * 티어 배너·배지 그라데이션 알파(8자리 hex 의 뒤 2자리). TierColors 에 붙여 쓴다 —
 * 가장자리는 옅게(10%) 가운데는 진하게(65%), 테두리는 40%.
 */
export const TierGradientAlpha = { edge: "1A", center: "A6", border: "66" } as const;

// 증강 아이콘 미해결 시 표시하는 희귀도 폴백 글리프 (MaterialCommunityIcons).
// 여러 feature(aram·builds·items)가 공유하므로 여기 단일 정의를 import해 쓴다.
export const AugmentRarityGlyphs = {
  silver: "shield",
  gold: "star",
  prismatic: "shimmer",
} as const;

// splash 히어로 카드 내부 — 라이트/다크 공통 고정 어두운 톤(이미지 가독성).
// 카드 위는 컬러풀한 splash라 모드와 무관하게 어두운 scrim/타일이 표준이며,
// 이 그룹이 카드 내부 색의 유일한 출처다(다른 곳에서 hex 직접 쓰지 말 것).
export const HeroOverlay = {
  // 하단 scrim — 흰 텍스트 가독성용. 다크는 배경과 이어져 강하게 깔아도 되지만,
  // 라이트는 밝은 배경과 맞닿아 검은 띠처럼 튀므로 톤을 낮춘다.
  scrimDark: [
    "rgba(8,9,11,0)",
    "rgba(8,9,11,0.55)",
    "rgba(8,9,11,0.85)",
    "rgba(8,9,11,0.96)",
  ],
  scrimLight: [
    "rgba(8,9,11,0)",
    "rgba(8,9,11,0.3)",
    "rgba(8,9,11,0.55)",
    "rgba(8,9,11,0.7)",
  ],
  cardBase: "#0A0B0D", // splash 로드 전/빈 영역 베이스
  tileBg: "rgba(0,0,0,0.45)", // 증강·아이템 타일 배경
  tileBorder: "rgba(255,255,255,0.14)", // 아이템 타일 테두리
  textPrimary: "#F2F4F7",
  textSecondary: "#B5BAC1",
} as const;

/**
 * 증강 카드(RarityCardFrame) 고유색. 카드 아트가 어두운 고정색이라 라이트/다크 공통이다.
 * - amount: 설명 안 골드 금액 강조. 증강 골드 토큰(샴페인색)은 회색 설명과 너무 가까워 채도 높은 금색을 따로 둔다.
 * - shadow: 카드 그림자 — 등급색. 프레임 옆 띠 평균색(골드 #88694E·실버 #777777·프리즘 #968ECA)과 같은 색상각이다.
 *   light: 밝은 배경 위 그림자. 띠색보다 어둡고 진하게 잡아 등급 색이 비치는 그림자가 되게 했다. 아래로 떨구지 않는다
 *   (cardShadow 주석). alpha 는 8자리 hex 뒤 2자리.
 *   dark: 어두운 배경 위 빛. 골드·프리즘은 인게임 캡처에서 잰 값이고(inner·outer 두 겹), 실버는 원본에 빛이 없어 옅게 둔다.
 */
export const AugmentCardColors = {
  amount: "#E8B339",
  shadow: {
    light: {
      alpha: "4D",
      silver: "#3E434B",
      gold: "#6B4423",
      prismatic: "#5B47C2",
    },
    dark: {
      silver: { color: "#D5D8DE", inner: "14", outer: "1A" },
      gold: { color: "#E9CFAF", inner: "2B", outer: "2B" },
      prismatic: { color: "#BCACFF", inner: "40", outer: "61" },
    },
  },
} as const;

/** 헤드라이너 고유색(밴드 로고·컨셉). 등장 연출의 무대 조명이라 라이트/다크 공통이다. */
export const HeadlinerColors = {
  // 드래프트의 K/DA 마크(헤더·보너스 카드 위)의 파란 글로우와 같은 계열.
  // 등장 연출만 보라였다가 드래프트와 색이 어긋나 맞췄다. HEARTSTEEL(#6FB1FF)보다 짙어 구분된다.
  kda: "#3478FF",
  pentakill: "#D4AF6A",
  heartsteel: "#6FB1FF",
  "true-damage": "#2DD4BF",
  disco: "#F472D0",
  "cafe-cuties": "#FFB0C4",
  bees: "#FFC23D",
  "command-line": "#FFB938",
} as const;

/**
 * 게임 툴팁의 스탯 글자색(HEARTSTEEL 스티커 문구). 문구 안 `[as]공격 속도 40%[/as]` 처럼 표시한 구간에 입힌다.
 * 키는 표시 이름이다. 스탯 색은 게임 스탯 아이콘(CDragon `texticons/lol/statsicon/scale*.png`) 색이고, k 는 게임의 강조어
 * (`keywordMajor` — 멤버 이름·능력치 모루·레벨) 색을 인게임 캡처에서 뽑았다.
 * 카드 밖 화면 배경 위에 쓰므로 라이트 짝을 둔다. 라이트는 색상·채도를 두고 명도만 내려 배경 대비 4.5:1 을 넘긴 값이다.
 * 다크의 흡혈(sv)만 게임 색(#D52042)이 어두운 배경에서 3.6:1 이라 밝혔다.
 */
export const StatTextColors = {
  dark: {
    k: "#C2C59B", // keywordMajor
    ad: "#EC8D34",
    ap: "#786CFF",
    as: "#FFE78C",
    hp: "#21995C",
    sv: "#DC4460",
  },
  light: {
    k: "#6E7142",
    ad: "#AA5A10",
    ap: "#5E50FF",
    as: "#876B00",
    hp: "#1B7E4C",
    sv: "#D52042",
  },
} as const;

/** 펜타킬 스킬 카드의 인게임 고유색. 카드 아트가 어두운 고정색이라 라이트/다크 공통이다. */
export const SkillCardColors = {
  portraitRing: "#EBD7B4",
  swirl: "#8F6F4C",
  body: "#AEB4BD",
  key: "#D9A441",
  empower: "#E0709A",
  spell: "#E2AE4C",
  heal: "#7FCB74",
  shield: "#5FBBD0",
} as const;

/** 네이티브 스플래시(app.json backgroundColor)와 같은 색 — 스플래시 오버레이가 이어받는다. */
export const Brand = {
  splashBg: "#0E0F12",
} as const;

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

export const BottomTabInset = 50;

/** 모달(챔피언 선택·티어리스트 챔피언 상세)의 native large title 크기 — 두 모달이 같은 헤더로 보여야 한다. */
export const ModalLargeTitleStyle = { fontSize: 28 } as const;
