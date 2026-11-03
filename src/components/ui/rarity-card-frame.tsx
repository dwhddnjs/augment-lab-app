import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentImage } from "@/components/ui/augment-image";
import {
  AugmentCardColors,
  AugmentRarityColors,
  AugmentRarityGlyphs,
  HeroOverlay,
  Spacing,
} from "@/constants/theme";
import type { Augment, AugmentRarity } from "@/features/augments/types";
import { useTheme } from "@/hooks/use-theme";
import { cleanAugmentDescription } from "@/lib/augment-text";

/**
 * 게임의 증강 카드 원본(CDragon `ux/cherry/augments/augmentselection/augmentcard_{bg,frame_<등급>}`).
 * 512 캔버스에서 카드 영역만 잘랐다(309×512). 원본 좌우 끝 1~2px 은 투명·반투명이라 세 등급 모두 불투명한 구간만 남겼다.
 * 배경(bg)은 같은 폭으로 자르고, 프레임 바깥선에서 3px 안쪽까지 투명하게 깎았다. 배경 가장자리가 프레임의 반투명 모서리와
 * 겹치면 확대 보간 때 어두운 배경이 비쳐 둥근 모서리에 검은 선이 생긴다(원본은 오른쪽 위 모서리가 정확히 겹쳤다).
 * 골드·실버 프레임 바깥 띠(13px)는 위가 밝고 아래로 갈수록 어두워져 아랫변이 실버 71·골드 73 까지 내려간다.
 * 밝은 배경과 밝은 안쪽 선 사이에 끼어 검은 띠로 보여, 바깥 띠의 어두운 끝을 안쪽 밝은 선 가까이(실버 140·골드 125)
 * 끌어올렸다(색상 유지, 밝기만 비례). 실버는 띠와 안쪽 선 사이 홈 선도 옆변 홈 선 밝기(110)로 맞췄다.
 * 안쪽 띠·프리즘 프레임은 원본 그대로다. 펜타킬 스킬 카드도 같은 배경·골드 프레임을 쓴다.
 *
 * 아이콘 뒤 소용돌이 문양(`augmenticon_defaultbacklayer_*`)은 깔지 않는다. 아수라장 증강 아이콘
 * (`_large`)에 문양이 이미 그려져 있어서, 깔면 두 겹이 된다. 문양이 없는 스킬 아이콘만 쓴다.
 */
export const AUGMENT_CARD_ART = {
  background: require("@/assets/augment-card/bg.png") as number,
  frame: {
    silver: require("@/assets/augment-card/frame-silver.png") as number,
    gold: require("@/assets/augment-card/frame-gold.png") as number,
    prismatic: require("@/assets/augment-card/frame-prismatic.png") as number,
  } satisfies Record<AugmentRarity, number>,
};

/**
 * 인게임 카드 배치. 실제 칼바람 증강 카드 3장(실버·골드·프리즘) 화면을 재서 얻은 비율이다.
 * 크기는 카드 폭(W), 세로 위치는 카드 높이(H) 기준이다. 프레임 이미지가 카드 높이에 맞춰 늘어나므로,
 * 위치도 높이를 따라야 장식선과의 거리가 게임과 같다.
 */
const LAYOUT = {
  iconSize: 0.5, // W. 아이콘 원본(256px 캔버스) 전체
  iconCenter: 0.227, // H
  textTop: 0.459, // H. 이름 글자 윗선
  textBottom: 0.9, // H. 아래 장식선 위(가운데 0.96H, 모서리 꺾임 0.9H)
  side: 0.14, // W. 프레임 안쪽 선(0.067W)에서 그만큼 더 띄운다. 좁으면 글자가 프레임에 붙어 보인다
} as const;

/**
 * 글자 크기는 인게임 비율을 따르지 않는다. 그대로 줄이면 설명이 6.6pt 라 폰에서 읽히지 않는다.
 * 모든 카드가 같은 크기를 쓴다. 설명 줄 간격은 글자의 1.4배다(그보다 좁으면 줄이 붙어 보인다).
 * 이름이 두 줄인 카드와 가장 긴 설명까지 이 크기로 들어가게 정했다. 커스텀 그리드는 카드가 좁아서 8pt 로는
 * 1.4배 간격이 들어가지 않아 7.5pt 다.
 * 게임은 이름과 설명 사이에 분류 태그(일반·보조)가 있는데, 앱 데이터에 분류가 없어 설명을 이름 바로 밑에 붙인다.
 */
const TEXT = {
  normal: { name: 12, desc: 9, descLine: 12.5, gap: Spacing.one },
  compact: { name: 10, desc: 7.5, descLine: 10.5, gap: Spacing.one },
};

/** 이름 줄 상자 윗선에서 한글 글자 윗선까지의 거리(글자 크기 대비). 시뮬레이터에서 재서 맞췄다. */
const NAME_INK_TOP = 0.18;

/**
 * 다크 모드 빛 번짐(카드 폭 대비). 인게임 캡처의 카드 밖 밝기 감쇠를 가우시안 두 겹으로 맞췄다 — 표준편차가 카드 폭의
 * 0.6%·2.8% 이고, CSS blur 는 표준편차의 두 배다.
 */
const GLOW_BLUR = { inner: 0.012, outer: 0.056 };

/**
 * 등급색 카드 그림자(boxShadow). 라이트는 네 변에 고르게 두른다 — 프레임 아랫변은 원본 그림부터 어두운 띠라,
 * 그림자를 아래로 떨구면 그 띠와 겹쳐 검은 테두리처럼 두꺼워진다. 다크는 어두운 배경에 그림자가 묻혀 등급색 빛을 두른다.
 * 펜타킬 스킬 카드는 골드를 쓴다.
 */
export function cardShadow(
  rarity: AugmentRarity,
  width: number,
  mode: "light" | "dark",
): string {
  if (mode === "light") {
    const { alpha, [rarity]: color } = AugmentCardColors.shadow.light;
    return `0 0 2px ${color}${alpha}, 0 0 10px ${color}${alpha}`;
  }
  const glow = AugmentCardColors.shadow.dark[rarity];
  const blur = (k: number) => `${(width * k).toFixed(1)}px`;
  return `0 0 ${blur(GLOW_BLUR.inner)} ${glow.color}${glow.inner}, 0 0 ${blur(GLOW_BLUR.outer)} ${glow.color}${glow.outer}`;
}

/** 카드 비율(세로/가로). 프레임을 쓰지 않는 아이템·프리즘 카드도 이 비율을 따른다. */
export const CARD_ASPECT = 14 / 9;

/**
 * 카드 모서리 반경(카드 폭 대비). Radius 토큰이 아니라 그림 비율을 따른다.
 * 프레임 그림(309px 폭)의 모서리를 원으로 맞추면 반경 약 21.5px 이고, 카드 비율로 세로가 눌려 가로 7.0%·세로 6.5% 가 된다.
 * 큰 쪽(7%)으로 잡고 그림을 이 반경으로 잘라(CardArt) 그림이 상자 모서리를 빈틈없이 채우게 한다.
 * 그림자·체크 베일도 이 반경을 써야 모서리가 그림과 한 곡선으로 맞는다.
 */
export const CARD_CORNER = 0.07;

/** 카드 배경 + 등급 프레임 그림. CARD_CORNER 둥근 상자로 잘라 그린다. 펜타킬 스킬 카드도 이걸(골드) 쓴다. */
export function CardArt({ rarity, width }: { rarity: AugmentRarity; width: number }) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: width * CARD_CORNER, overflow: "hidden" },
      ]}
    >
      <Image
        source={AUGMENT_CARD_ART.background}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
      />
      <Image
        source={AUGMENT_CARD_ART.frame[rarity]}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
      />
    </View>
  );
}

/** 카드 3장 행의 좌우 여백. */
export const CARD_ROW_PAD = Spacing.four;

/**
 * 칼바람 드래프트 화면에서 카드 3장 사이 간격.
 */
export const CARD_GAP = Spacing.four;

/**
 * 카드 높이의 화면 세로 대비 상한. 꽉 채우면 헤더와 아래 리롤 버튼 자리가 없다.
 */
export const CARD_HEIGHT_RATIO = 0.56;

/**
 * 카드 한 장의 너비 — 가로 3장이 들어가는 너비와 화면 높이 제한 중 작은 쪽.
 * heightRatio 는 헤더와 아래 리롤 버튼 자리를 남기기 위한 상한으로, 카드 비율을
 * 역산해 너비로 환산한다.
 */
export function cardWidthFor(
  screenW: number,
  screenH: number,
  gap: number,
  heightRatio: number,
): number {
  const byWidth = Math.floor((screenW - CARD_ROW_PAD * 2 - gap * 2) / 3);
  const byHeight = Math.floor((screenH * heightRatio) / CARD_ASPECT);
  return Math.min(byWidth, byHeight);
}

// 설명 안의 골드 금액("250골드", "250 gold")을 강조색으로 뽑아내는 패턴.
// split 은 캡처 그룹째로 쪼개므로 같은 패턴 하나를 판정에도 그대로 쓴다 —
// 예전엔 둘이 따로 적혀 있어 한쪽만 고치면 조용히 어긋났다.
// 카드마다 렌더할 때 부르는 함수라 정규식은 모듈 상수로 한 번만 만든다.
// 쪼개기용(g)과 판정용(g 없음)을 따로 두는 이유: test 는 g 가 붙으면 lastIndex 를
// 들고 다녀 같은 문자열에도 번갈아 다른 답을 낸다.
const AMOUNT = "(\\d[\\d,]*\\s*(?:골드|gold|원))";
const AMOUNT_SPLIT_RE = new RegExp(AMOUNT, "gi");
const AMOUNT_TEST_RE = new RegExp(AMOUNT, "i");

function splitDescription(text: string): { text: string; hl: boolean }[] {
  return text
    .split(AMOUNT_SPLIT_RE)
    .filter((p) => p.length > 0)
    .map((p) => ({ text: p, hl: AMOUNT_TEST_RE.test(p) }));
}

interface Props {
  augment: Augment;
  cardWidth: number;
  /**
   * 커스텀 화면 그리드용 — 작은 글자(TEXT.compact)를 쓰고, 카드가 촘촘히 붙어 그림자를 끈다.
   * 배치는 카드 폭에 비례하므로 따로 줄이지 않는다.
   */
  compact?: boolean;
}

export function RarityCardFrame({
  augment,
  cardWidth,
  compact = false,
}: Props) {
  const { rarity } = augment;
  const tint = AugmentRarityColors[rarity].border; // 카드 안은 모드와 무관하게 어두워 다크 팔레트를 쓴다.
  const { mode } = useTheme();
  // 이름이 두 줄이면 설명 한 줄을 내준다. 고정 높이 상자라 줄 수가 넘치면 마지막 줄이 "…" 없이 잘린다.
  const [nameLines, setNameLines] = useState(1);

  const W = cardWidth;
  const H = Math.round(W * CARD_ASPECT);
  const iconSize = Math.round(W * LAYOUT.iconSize);
  const text = compact ? TEXT.compact : TEXT.normal;
  const nameLine = text.name * 1.2;
  const textTop = H * LAYOUT.textTop - NAME_INK_TOP * text.name;
  const textBottom = H * LAYOUT.textBottom;
  const descLines = Math.max(
    1,
    Math.floor(
      (textBottom - textTop - nameLine * nameLines - text.gap) / text.descLine,
    ),
  );

  const segments = splitDescription(
    cleanAugmentDescription(augment.description),
  );

  return (
    <View
      style={{
        width: W,
        height: H,
        borderRadius: W * CARD_CORNER,
        boxShadow: compact ? undefined : cardShadow(rarity, W, mode),
      }}
    >
      <CardArt rarity={rarity} width={W} />

      <View
        style={[styles.icon, { top: H * LAYOUT.iconCenter - iconSize / 2 }]}
      >
        <AugmentImage
          iconPath={augment.iconPath}
          size={iconSize}
          tint={tint}
          fallbackGlyph={AugmentRarityGlyphs[rarity]}
          recyclingKey={augment.id}
        />
      </View>

      <View
        style={[
          styles.text,
          {
            top: textTop,
            height: textBottom - textTop,
            left: W * LAYOUT.side,
            right: W * LAYOUT.side,
            gap: text.gap,
          },
        ]}
      >
        <ThemedText
          allowFontScaling={false}
          numberOfLines={2}
          // 두 줄이 될 때 "업그레이드"가 "업그레이 / 드"로 갈리지 않게 단어 단위로 끊는다.
          // 설명은 글자 단위 그대로다 — 단어 단위면 긴 설명이 같은 크기로 들어가지 않는다.
          lineBreakStrategyIOS="hangul-word"
          onTextLayout={(e) =>
            setNameLines(e.nativeEvent.lines.length > 1 ? 2 : 1)
          }
          style={[styles.name, { fontSize: text.name, lineHeight: nameLine }]}
        >
          {augment.name}
        </ThemedText>
        <ThemedText
          allowFontScaling={false}
          numberOfLines={descLines}
          style={[
            styles.desc,
            { fontSize: text.desc, lineHeight: text.descLine },
          ]}
        >
          {segments.map((s, i) =>
            s.hl ? (
              <Text key={i} style={styles.highlight}>
                {s.text}
              </Text>
            ) : (
              s.text
            ),
          )}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    position: "absolute",
    alignSelf: "center",
  },
  text: {
    position: "absolute",
    overflow: "hidden",
  },
  name: {
    textAlign: "center",
    fontWeight: "700",
    color: HeroOverlay.textPrimary,
  },
  desc: {
    flexShrink: 1,
    textAlign: "center",
    color: HeroOverlay.textSecondary,
  },
  // 설명 안의 골드 금액은 등급과 무관하게 금색이다.
  highlight: {
    color: AugmentCardColors.amount,
    fontWeight: "700",
  },
});
