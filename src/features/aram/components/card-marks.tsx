/**
 * 카드에 붙는 헤드라이너 표식 — HEARTSTEEL 스티커(좌상단 멤버 얼굴 + 카드 밑 효과), K/DA 표시.
 * 카드 위치는 헤드라이너와 무관하게 같다. HEARTSTEEL 은 카드 밑 효과 줄만큼 리롤 버튼이 내려간다.
 * 가로 화면 예산에 맞춘 크기라 글자 크기 설정을 따르지 않는다.
 */
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { CARD_GAP } from "@/components/ui/rarity-card-frame";
import {
  AugmentRarityColors,
  HeroOverlay,
  Radius,
  Spacing,
  StatTextColors,
} from "@/constants/theme";
import type { AugmentRarity } from "@/features/augments/types";
import { HEADLINER_LOGOS, STICKER_PORTRAITS } from "@/features/headliners/assets";
import { useHeadlinerTexts } from "@/features/headliners/hooks/use-headliners";
import type { StickerId } from "@/features/headliners/types";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { renderMarked } from "./marked-text";
import { PORTRAIT_INSET, PORTRAIT_SIZE } from "./skill-card";

// 글로우 여백을 포함한 크기다.
const KDA_MARK_SIZE = { width: 71, height: 21 };

/**
 * 효과 줄 글자 배치. 한국어는 최장 문구(이즈리얼 약 154pt)도 가장 좁은 칸(SE, 카드 135 + 24)에 한 줄이고,
 * 영어는 요네(약 229pt)가 두 줄이다. 영어는 줄 간격·위 여백을 줄여 카드 밑 묶음(위 여백 + 글자 + 리롤 간격 8)을
 * 이전 툴팁 예산 34pt 에 맞춘다(2 + 24 + 8). 한국어는 4 + 13 + 8 = 25pt.
 */
const STICKER_TEXT = {
  ko: { lines: 1, line: 13, top: Spacing.one },
  en: { lines: 2, line: 12, top: Spacing.half },
} as const;

/**
 * HEARTSTEEL 스티커 — 카드 좌상단 모서리에 걸친 멤버 얼굴. 펜타킬 스킬 카드의 챔피언 얼굴과 같은 자리이고, 살짝 기울여 붙인 스티커처럼 보인다.
 * 테두리는 카드 프레임과 같은 등급색 1pt 라 카드에 붙은 장식으로 읽힌다.
 * 원은 4pt 만 카드 밖이고 나머지는 어두운 카드 그림 위라, 모드와 무관하게 다크 팔레트다(라이트 짝은 어두운 프레임에 묻힌다).
 */
export function StickerMark({
  sticker,
  rarity,
}: {
  sticker: StickerId;
  rarity: AugmentRarity;
}) {
  const borderColor = AugmentRarityColors[rarity].border;
  return (
    <View pointerEvents="none" style={styles.mark}>
      <Image
        source={STICKER_PORTRAITS[sticker]}
        style={[styles.portrait, { borderColor }]}
        contentFit="cover"
        contentPosition="top center"
      />
    </View>
  );
}

/**
 * HEARTSTEEL 스티커 효과 — 카드 밑에 "멤버: 효과" 를 쓴다. 게임처럼 이름은 강조어 색으로 고정이고,
 * 효과는 스탯 구간(`[as]공격 속도 40%[/as]`)만 그 스탯 색이다.
 * 스티커가 없는 카드도 같은 높이를 비워 3장의 리롤 버튼 줄을 맞춘다.
 * 폭은 카드 + 카드 사이 간격으로 고정하고 음수 마진으로 옆 간격 절반씩 넘친다. 폭을 정하지 않으면 긴 문구가
 * 카드 칸 자체를 넓혀 멤버 얼굴·리롤 버튼이 카드에서 어긋난다.
 */
export function StickerLabel({
  sticker,
  cardWidth,
}: {
  sticker: StickerId | null;
  cardWidth: number;
}) {
  const texts = useHeadlinerTexts();
  const colors = StatTextColors[useTheme().mode];
  // ponytail: 언어별 최장 문구를 재서 줄 수를 고정했다(STICKER_TEXT). 문구가 길어지면 onTextLayout 으로 재서 맞춰야 한다.
  const layout = STICKER_TEXT[useLocale().locale];
  const slot = [
    styles.sticker,
    {
      width: cardWidth + CARD_GAP,
      height: layout.line * layout.lines,
      marginTop: layout.top,
    },
  ];
  if (!sticker) return <View style={slot} />;
  const { name, full } = texts.stickers[sticker];
  return (
    <View pointerEvents="none" style={slot}>
      <ThemedText
        allowFontScaling={false}
        numberOfLines={layout.lines}
        style={[styles.stickerText, { lineHeight: layout.line }]}
      >
        <Text style={[styles.stickerName, { color: colors.k }]}>{name}</Text>
        : {renderMarked(full, colors)}
      </ThemedText>
    </View>
  );
}

/** K/DA 보너스 카드 위 표시. 카드 위 빈자리에 띄워 다른 라운드와 카드 위치가 같다. */
export function KdaBadge() {
  return (
    <View pointerEvents="none" style={styles.kda}>
      <Image source={HEADLINER_LOGOS.kda.source} style={KDA_MARK_SIZE} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    position: "absolute",
    // 펜타킬 스킬 카드 초상과 같은 자리다.
    top: PORTRAIT_INSET,
    left: PORTRAIT_INSET,
    transform: [{ rotate: "10deg" }],
  },
  portrait: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: HeroOverlay.cardBase,
  },
  sticker: {
    marginHorizontal: -CARD_GAP / 2,
  },
  stickerText: {
    fontSize: 10,
    textAlign: "center",
  },
  stickerName: {
    fontWeight: "700",
  },
  kda: {
    position: "absolute",
    top: -(KDA_MARK_SIZE.height + Spacing.half),
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
