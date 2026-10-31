/**
 * 카드에 붙는 헤드라이너 표식 — HEARTSTEEL 스티커와 툴팁, K/DA 표시.
 * 툴팁 슬롯은 스티커가 없어도 높이를 차지해 3장의 카드·리롤 버튼 줄을 맞춘다. 높이는 가로 화면
 * 예산에 맞춘 값이라(docs/plans/2026-11-01-헤드라이너.md) 글자 크기 설정을 따르지 않는다.
 */
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
import { KDA_MARK, STICKER_PORTRAITS } from "@/features/headliners/assets";
import { useHeadlinerTexts } from "@/features/headliners/hooks/use-headliners";
import type { StickerId } from "@/features/headliners/types";

const TIP_HEIGHT = 28;
const TIP_PORTRAIT = 24;
const BADGE_SIZE = 44;
// 글로우 여백을 포함한 크기다.
const KDA_MARK_SIZE = { width: 71, height: 21 };

/** 카드 우상단에 살짝 기울여 붙이는 멤버 스티커. */
export function StickerBadge({ sticker }: { sticker: StickerId }) {
  return (
    <View pointerEvents="none" style={styles.badge}>
      <Image
        source={STICKER_PORTRAITS[sticker]}
        style={styles.badgeImage}
        contentFit="cover"
        contentPosition="top center"
      />
    </View>
  );
}

/** 카드 밑 툴팁 — 어떤 멤버가 무엇을 주는지. */
export function StickerTip({ sticker }: { sticker: StickerId | null }) {
  const texts = useHeadlinerTexts();
  if (!sticker) return <View style={styles.tip} />;
  const { name, short } = texts.stickers[sticker];
  return (
    <View style={styles.tip}>
      <Image
        source={STICKER_PORTRAITS[sticker]}
        style={styles.tipPortrait}
        contentFit="cover"
        contentPosition="top center"
      />
      <View style={styles.tipBody}>
        <ThemedText
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.tipName}
        >
          {name}
        </ThemedText>
        <ThemedText
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          color="secondary"
          style={styles.tipText}
        >
          {short}
        </ThemedText>
      </View>
    </View>
  );
}

/** K/DA 보너스 카드 위 표시. 카드 위 빈자리에 띄워 다른 라운드와 카드 위치가 같다. */
export function KdaBadge() {
  return (
    <View pointerEvents="none" style={styles.kda}>
      <Image source={KDA_MARK} style={KDA_MARK_SIZE} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -Spacing.one,
    right: -Spacing.one,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: HeroOverlay.textPrimary,
    backgroundColor: HeroOverlay.cardBase,
    overflow: "hidden",
    transform: [{ rotate: "10deg" }],
  },
  badgeImage: {
    flex: 1,
  },
  tip: {
    height: TIP_HEIGHT,
    marginTop: Spacing.half,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  tipPortrait: {
    width: TIP_PORTRAIT,
    height: TIP_PORTRAIT,
    borderRadius: Radius.full,
    backgroundColor: HeroOverlay.cardBase,
  },
  tipBody: {
    flex: 1,
    minWidth: 0,
  },
  tipName: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  tipText: {
    fontSize: 10,
    lineHeight: 14,
  },
  kda: {
    position: "absolute",
    top: -(KDA_MARK_SIZE.height + Spacing.half),
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
