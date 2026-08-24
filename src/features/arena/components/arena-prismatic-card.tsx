/**
 * ArenaPrismaticCard — 프리즘 아이템 카드. 프리즘 등급 프레임에 아이템 아이콘
 * (CDragon)·이름·요약·가격을 표시한다. 프리즘 라운드와 상점 프리즘 모루에서 공용.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import { RARITY } from "@/components/ui/rarity-card-frame";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import type { PrismaticItem } from "@/features/arena/types";
import {
  prismaticEffectSummary,
  prismaticStatSummary,
} from "@/features/items/text";
import { useTheme } from "@/hooks/use-theme";
import { cdragonItemIconUrl } from "@/lib/ddragon";
import {
  ArenaPickCard,
  type ArenaCardEntryMode,
  type ArenaCardExitMode,
} from "./arena-pick-card";

const PRISM = RARITY.prismatic;

interface Props {
  item: PrismaticItem;
  cardWidth: number;
  disabled?: boolean;
  /** 가격 배지 표시(상점 프리즘 모루). 없으면 가격 숨김. */
  price?: number;
  affordable?: boolean;
  onPick: () => void;
  /** 리롤 버튼 표시 여부(프리즘 라운드). */
  rerolled?: boolean;
  onReroll?: () => void;
  /**
   * 프리즘 라운드(선택)에서만 전달되는 선택 애니메이션 props.
   * 미전달 시(상점 프리즘 모루) 정적 FadeIn으로 렌더한다.
   */
  index?: number;
  exitMode?: ArenaCardExitMode;
  entryMode?: ArenaCardEntryMode;
}

export function ArenaPrismaticCard({
  item,
  cardWidth,
  disabled,
  price,
  affordable = true,
  onPick,
  rerolled,
  onReroll,
  index,
  exitMode,
  entryMode,
}: Props) {
  const { colors } = useTheme();
  const cardHeight = Math.round(cardWidth * (14 / 9));
  const framePad = Math.max(3, Math.round(cardWidth * 0.056));
  const stats = prismaticStatSummary(item.description).replace(/\n/g, " · ");
  const summary = prismaticEffectSummary(item.description);
  const dimmed = disabled || !affordable;

  const frame = (
    <View
      style={[
        styles.frame,
        {
          width: cardWidth,
          height: cardHeight,
          padding: framePad,
          experimental_backgroundImage: PRISM.frameImage,
          boxShadow: PRISM.outerGlow,
        },
      ]}
    >
      <View style={[styles.body, { backgroundColor: PRISM.bodyColor }]}>
        <RemoteImage
          uri={cdragonItemIconUrl(item.iconPath)}
          recyclingKey={item.id}
          style={[styles.icon, { borderColor: colors.border.default }]}
          contentFit="contain"
        />
        <ThemedText
          numberOfLines={2}
          style={[styles.name, { color: PRISM.title }]}
        >
          {item.name}
        </ThemedText>
        {!!stats && (
          <ThemedText
            numberOfLines={2}
            style={[styles.stats, { color: PRISM.title }]}
          >
            {stats}
          </ThemedText>
        )}
        <ThemedText
          numberOfLines={7}
          style={[styles.desc, { color: PRISM.desc }]}
        >
          {summary}
        </ThemedText>
        {price != null && (
          <View style={styles.priceRow}>
            <MaterialCommunityIcons
              name="circle-multiple"
              size={12}
              color="#F2C766"
            />
            <ThemedText
              style={[
                styles.price,
                { color: affordable ? "#F2C766" : colors.text.disabled },
              ]}
            >
              {price.toLocaleString()}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {exitMode != null && entryMode != null ? (
        // 프리즘 라운드: 칼바람 카드 선택 애니메이션으로 통일.
        <ArenaPickCard
          index={index ?? 0}
          exitMode={exitMode}
          entryMode={entryMode}
          disabled={dimmed}
          onPress={onPick}
        >
          {frame}
        </ArenaPickCard>
      ) : (
        // 상점 프리즘 모루: 정적 FadeIn + 구매 Pressable.
        <Animated.View key={item.id} entering={FadeIn.duration(220)}>
          <Pressable
            onPress={dimmed ? undefined : onPick}
            disabled={dimmed}
            style={{ opacity: dimmed ? 0.5 : 1 }}
          >
            {frame}
          </Pressable>
        </Animated.View>
      )}

      {onReroll && (
        <Pressable
          onPress={rerolled || disabled ? undefined : onReroll}
          disabled={rerolled || disabled}
          style={[
            styles.reroll,
            {
              backgroundColor: rerolled
                ? colors.surface.sunken
                : colors.surface.raised,
              borderColor: rerolled
                ? colors.border.subtle
                : colors.border.strong,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color={rerolled ? colors.text.disabled : colors.text.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: Spacing.double,
  },
  frame: {
    overflow: "hidden",
    borderRadius: Radius.lg + 3,
    borderCurve: "continuous",
  },
  body: {
    flex: 1,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    alignItems: "center",
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
    gap: Spacing.two,
  },
  // 아이템 아이콘 소스가 64px라 표시를 작게 둘수록 업스케일이 줄어 선명하다.
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  name: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 14,
    marginTop: Spacing.one,
  },
  stats: {
    textAlign: "center",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "600",
    paddingHorizontal: Spacing.one,
    opacity: 0.85,
  },
  desc: {
    textAlign: "center",
    fontSize: 8,
    lineHeight: 12,
    paddingHorizontal: Spacing.one,
    flexShrink: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
    marginTop: "auto",
  },
  price: {
    fontSize: 12,
    fontWeight: "800",
  },
  reroll: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
