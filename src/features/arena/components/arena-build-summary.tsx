/**
 * ArenaBuildSummary — 저장된 아레나 빌드의 상세 본문(세로). 증강(강화 레벨)·
 * 프리즘 아이템·전설 아이템·능력치 모루를 섹션별로 표시한다. 빌드 상세 화면
 * (build-detail-screen)이 mode === 'arena'일 때 칼바람 본문 대신 렌더한다.
 *
 * 레이아웃은 칼바람 빌드 상세와 공용 프리미티브(DetailCardRow/IconNameCell/
 * AugmentTile)를 그대로 공유한다. 아레나 고유 요소만 추가한다:
 *   - 증강 강화 레벨(별), 재련(골드 카드), 능력치 모루(텍스트 목록).
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentImage } from "@/components/ui/augment-image";
import { AugmentTile } from "@/components/ui/augment-tile";
import { DetailCardRow } from "@/components/ui/detail-card-row";
import { IconNameCell } from "@/components/ui/icon-name-cell";
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
import { useArenaAugments } from "@/features/arena/hooks/use-arena-augments";
import {
  usePrismaticItems,
  useSpecialAugments,
  useStatShards,
} from "@/features/arena/hooks/use-arena-items";
import { useItems } from "@/features/items/hooks/use-items";
import { useRarityColors } from "@/hooks/use-rarity-colors";
import { resolveIds } from "@/lib/arrays";
import { cleanAugmentDescription } from "@/lib/augment-text";
import type { SavedBuild } from "@/lib/build-storage";
import { cdragonItemIconUrl, itemImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: {
    augments: "증강",
    items: "아이템",
    shards: "능력치 모루",
    reforge: "재련",
  },
  en: {
    augments: "Augments",
    items: "Items",
    shards: "Stat Anvils",
    reforge: "Reforge",
  },
};

interface Props {
  build: SavedBuild;
}

export function ArenaBuildSummary({ build }: Props) {
  const rarityColors = useRarityColors();
  const translate = useTranslation(t);
  const arenaAugments = useArenaAugments();
  const allItems = useItems();
  const allPrismatics = usePrismaticItems();
  const allShards = useStatShards();
  const allSpecials = useSpecialAugments();

  const augments = resolveIds(build.augmentIds, arenaAugments);
  const items = resolveIds(build.itemIds, allItems);
  const prismatics = resolveIds(build.prismaticIds, allPrismatics);
  const shards = resolveIds(build.shardIds, allShards);
  const reforges = resolveIds(build.reforgeIds, allSpecials);

  // 프리즘 + 전설을 하나의 아이템 셀 목록으로 합친다(아이콘 소스만 다름).
  const itemCells = [
    ...prismatics.map((p) => ({
      key: `p-${p.id}`,
      uri: cdragonItemIconUrl(p.iconPath),
      name: p.name,
    })),
    ...items.map((it) => ({
      key: `i-${it.id}`,
      uri: itemImageUrl(it.imageKey),
      name: it.name,
    })),
  ];

  return (
    <View style={styles.root}>
      {/* 증강 (강화 레벨) — 칼바람과 동일한 카드 행 + 레벨 별 메타 */}
      {augments.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("augments")} {augments.length}
          </ThemedText>
          {augments.map((aug, i) => {
            const tint = rarityColors[aug.rarity].border;
            const level = build.augmentLevels?.[aug.id] ?? 1;
            return (
              <DetailCardRow
                key={`${aug.id}-${i}`}
                accentColor={tint}
                icon={
                  <AugmentTile
                    iconPath={aug.iconPath}
                    rarity={aug.rarity}
                    recyclingKey={aug.id}
                    size={48}
                    background={HeroOverlay.cardBase}
                  />
                }
                title={aug.name}
                description={cleanAugmentDescription(aug.description)}
                meta={
                  aug.maxLevel > 1 ? (
                    <View style={styles.lvlRow}>
                      {Array.from({ length: level }).map((_, s) => (
                        <MaterialCommunityIcons
                          key={s}
                          name="star"
                          size={11}
                          color={tint}
                        />
                      ))}
                    </View>
                  ) : undefined
                }
              />
            );
          })}
        </View>
      )}

      {/* 아이템 (프리즘 + 전설) — 칼바람과 동일한 아이콘 + 이름 셀 */}
      {itemCells.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("items")} {itemCells.length}
          </ThemedText>
          <View style={styles.itemsRow}>
            {itemCells.map((cell) => (
              <IconNameCell
                key={cell.key}
                uri={cell.uri}
                recyclingKey={cell.key}
                name={cell.name}
              />
            ))}
          </View>
        </View>
      )}

      {/* 능력치 모루 */}
      {shards.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("shards")} {shards.length}
          </ThemedText>
          <View style={styles.shardList}>
            {shards.map((s, i) => (
              <ThemedText key={`${s.id}-${i}`} type="body" color="secondary">
                • {s.description}
              </ThemedText>
            ))}
          </View>
        </View>
      )}

      {/* 재련 — 증강 카드 행과 동일 스타일(골드 테두리, 아이콘은 anvil 폴백) */}
      {reforges.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("reforge")} {reforges.length}
          </ThemedText>
          {reforges.map((r, i) => {
            const tint = rarityColors.gold.border;
            return (
              <DetailCardRow
                key={`${r.id}-${i}`}
                accentColor={tint}
                icon={
                  <View
                    style={[
                      styles.reforgeTile,
                      { borderColor: tint, backgroundColor: HeroOverlay.cardBase },
                    ]}
                  >
                    <AugmentImage
                      iconPath={r.iconPath}
                      size={36}
                      tint={tint}
                      fallbackGlyph="anvil"
                      fallbackRatio={0.8}
                      recyclingKey={r.id}
                    />
                  </View>
                }
                title={r.name}
                description={cleanAugmentDescription(r.description)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.five },
  section: { gap: Spacing.two },
  lvlRow: {
    flexDirection: "row",
    gap: 1,
  },
  itemsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
  },
  shardList: {
    gap: Spacing.one,
  },
  // 재련 아이콘 타일 — AugmentTile과 동일 규격이나 rarity 없이 골드 고정.
  reforgeTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
