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
import { cleanItemDescription } from "@/features/items/item-text";
import { useTheme } from "@/hooks/use-theme";
import { cdragonItemIconUrl } from "@/lib/ddragon";

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
}: Props) {
  const { colors } = useTheme();
  const cardHeight = Math.round(cardWidth * (14 / 9));
  const framePad = Math.max(3, Math.round(cardWidth * 0.056));
  const summary = cleanItemDescription(item.description);
  const dimmed = disabled || !affordable;

  return (
    <View style={styles.wrapper}>
      <Animated.View key={item.id} entering={FadeIn.duration(220)}>
        <Pressable
          onPress={dimmed ? undefined : onPick}
          disabled={dimmed}
          style={{ opacity: dimmed ? 0.5 : 1 }}
        >
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
                style={styles.icon}
                contentFit="contain"
              />
              <ThemedText
                numberOfLines={2}
                style={[styles.name, { color: PRISM.title }]}
              >
                {item.name}
              </ThemedText>
              <ThemedText
                numberOfLines={5}
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
        </Pressable>
      </Animated.View>

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
  icon: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  name: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 14,
    marginTop: Spacing.one,
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
