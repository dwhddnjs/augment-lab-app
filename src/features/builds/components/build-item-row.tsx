/**
 * BuildItemRow — 빌드 상세의 아이템 목록.
 * 증강은 "읽는" 개별 카드, 아이템은 "훑는" 스탯 데이터라 시각 언어를 나눈다.
 * iOS 인셋 그룹 리스트처럼 한 컨테이너 안에 행을 쌓고 사이는 hairline만 둔다.
 */
import { Fragment } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { RemoteImage } from "@/components/ui/remote-image";
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
import { formatItemStats } from "@/features/items/stats";
import { cleanItemDescription } from "@/features/items/text";
import type { Item } from "@/features/items/types";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { itemImageUrl } from "@/lib/ddragon";

const ICON_SIZE = 40;

interface Props {
  items: Item[];
  /** 섹션 헤더 라벨(개수는 내부에서 덧붙임). */
  label: string;
}

export function BuildItemRow({ items, label }: Props) {
  const { colors } = useTheme();
  const { locale } = useLocale();

  return (
    <View style={styles.section}>
      <ThemedText type="label" color="secondary">
        {label} {items.length}
      </ThemedText>
      <ThemedView
        surface="raised"
        style={[styles.group, { borderColor: colors.border.subtle }]}
      >
        {items.map((item, i) => {
          const effect = cleanItemDescription(item.description);
          return (
            <Fragment key={`${item.id}-${i}`}>
              {/* 구분선은 아이콘을 지나 텍스트 시작점부터 — iOS 인셋 스타일 */}
              {i > 0 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.surface.base },
                  ]}
                />
              )}
              <View style={styles.row}>
                <View
                  style={[styles.tile, { borderColor: colors.border.subtle }]}
                >
                  <RemoteImage
                    uri={itemImageUrl(item.imageKey)}
                    recyclingKey={item.id}
                    style={styles.icon}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.body}>
                  <ThemedText type="label" numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="caption" color="accent" style={styles.stats}>
                    {formatItemStats(item.stats, locale)}
                  </ThemedText>
                  {effect ? (
                    <ThemedText
                      type="caption"
                      color="secondary"
                      style={styles.effect}
                    >
                      {effect}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            </Fragment>
          );
        })}
      </ThemedView>
    </View>
  );
}

const INSET = Spacing.three + ICON_SIZE + Spacing.double;

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  group: {
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.double,
    padding: Spacing.three,
  },
  divider: {
    // 카드(raised)보다 어두운 배경색으로 홈을 파둔다. border.subtle은 다크에서
    // raised와 명도가 거의 같아 선이 묻혔다. hairline은 그 대비로도 얇아 1px.
    height: 1,
    marginLeft: INSET,
    marginRight: Spacing.three,
  },
  tile: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: HeroOverlay.cardBase,
  },
  icon: { width: "100%", height: "100%" },
  body: { flex: 1, gap: Spacing.half },
  // 효과 설명은 스탯 줄과 붙지 않게 한 칸 띄운다.
  // 스탯 줄은 tint + 굵기로, 효과 설명은 secondary 회색으로 계층을 나눈다.
  stats: { fontWeight: "600" },
  effect: { marginTop: Spacing.half },
});
