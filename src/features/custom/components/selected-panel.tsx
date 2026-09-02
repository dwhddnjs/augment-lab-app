/**
 * SelectedPanel — 커스텀 화면 우측(4.5). 챔피언 행 + 담은 증강/아이템 목록.
 *
 * 아래 절반은 5:5 두 칸이다(좌 증강 · 우 아이템). 칸 껍데기와 그 안의 공용 부품
 * (제거 배지 · 빈 칸 힌트 · 목록 설정)은 pick-column 에 있고, 여기서는 두 목록의
 * 행을 그리고 조립한다.
 *
 * 행 탭은 제거가 아니라 **칸 전환**이다 — 헤더 토글까지 손을 옮기지 않아도 되고,
 * 스크롤 중 오탭으로 지워지던 것도 같이 없어졌다. 제거는 행 오른쪽 위의 x 배지 하나뿐.
 */
import * as Haptics from "expo-haptics";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentTile } from "@/components/ui/augment-tile";
import { RemoteImage } from "@/components/ui/remote-image";
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import type { Champion } from "@/features/champions/types";
import { MAX_ITEMS, type Item } from "@/features/items/types";
import { useRarityColors } from "@/hooks/use-rarity-colors";
import { useTheme } from "@/hooks/use-theme";
import { itemImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { MAX_AUGMENTS, type PickTarget } from "../hooks/use-custom-draft";
import {
  EmptyHint,
  PickColumn,
  REMOVE_BADGE,
  ROW_ICON,
  ROW_IMAGE,
  RemoveBadge,
  pickListProps,
} from "./pick-column";
import { SelectedChampionRow } from "./selected-champion-row";

const t = {
  ko: {
    augments: "증강",
    items: "아이템",
    emptyAugment: "카드를 넣어주세요",
    emptyItem: "아이템을 넣어주세요",
    showAugments: "증강 목록 보기",
    showItems: "아이템 목록 보기",
    remove: "제거",
  },
  en: {
    augments: "Augments",
    items: "Items",
    emptyAugment: "Drop a card here",
    emptyItem: "Drop an item here",
    showAugments: "Show augments",
    showItems: "Show items",
    remove: "Remove",
  },
};

interface Props {
  champion: Champion | null;
  picked: Augment[];
  items: Item[];
  /** 지금 담기는 칸. 그 칸의 테두리를 켜고, 드롭 오버레이도 그 칸에만 얹는다. */
  target: PickTarget;
  /** 드래그 중이고 손가락이 드롭 경계 안이다 — 종류는 언제나 target 과 같다. */
  dropping: boolean;
  /** 화면이 재는 홈 인디케이터 높이. 박스가 화면 끝까지 내려오므로 목록 안에서 띄운다. */
  bottomInset: number;
  /** 반대편 칸을 탭했다 — 헤더 토글과 같은 뒤집기다. */
  onSwitchTarget: () => void;
  onRemove: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onShowStats: () => void;
  onChangeChampion: () => void;
  onClear: () => void;
}

export function SelectedPanel({
  champion,
  picked,
  items,
  target,
  dropping,
  bottomInset,
  onSwitchTarget,
  onRemove,
  onRemoveItem,
  onShowStats,
  onChangeChampion,
  onClear,
}: Props) {
  const { colors } = useTheme();
  const rarityColors = useRarityColors();
  const translate = useTranslation(t);

  const switchTarget = () => {
    Haptics.selectionAsync().catch(() => {});
    onSwitchTarget();
  };

  /** 지금 칸이면 undefined — 눌러도 아무 일이 없어야 한다. */
  const switchTo = (kind: PickTarget) =>
    target === kind ? undefined : switchTarget;

  const toAugment = switchTo("augment");
  const toItem = switchTo("item");

  return (
    <View style={styles.container}>
      <SelectedChampionRow
        champion={champion}
        onShowStats={onShowStats}
        onChangeChampion={onChangeChampion}
        onClear={onClear}
      />

      <View style={styles.columns}>
        <PickColumn
          label={translate("augments")}
          count={`${picked.length}/${MAX_AUGMENTS}`}
          active={target === "augment"}
          dropping={dropping}
          onSwitch={toAugment}
          switchLabel={translate("showAugments")}
        >
          {picked.length === 0 ? (
            <EmptyHint text={translate("emptyAugment")} onPress={toAugment} />
          ) : (
            <FlatList
              data={picked}
              keyExtractor={(a) => a.id}
              {...pickListProps(bottomInset, toAugment)}
              renderItem={({ item }) => {
                const tint = rarityColors[item.rarity].border;
                return (
                  <Pressable
                    onPress={toAugment}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: colors.surface.raised,
                        borderLeftColor: tint,
                        opacity: toAugment && pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <AugmentTile
                      iconPath={item.iconPath}
                      rarity={item.rarity}
                      size={ROW_ICON}
                      // 증강·아이템 아이콘은 어두운 배경 자산이다 — 라이트에서 surface.sunken
                      // (연회색)을 깔면 아이콘이 회색 판에 떠 보인다. 빌드 상세와 같은 어두운 톤.
                      background={HeroOverlay.cardBase}
                      recyclingKey={item.id}
                    />
                    <ThemedText
                      numberOfLines={1}
                      style={[styles.rowName, { color: tint }]}
                    >
                      {item.name}
                    </ThemedText>
                    <RemoveBadge
                      label={translate("remove")}
                      onPress={() => onRemove(item.id)}
                    />
                  </Pressable>
                );
              }}
            />
          )}
        </PickColumn>

        <PickColumn
          label={translate("items")}
          count={`${items.length}/${MAX_ITEMS}`}
          active={target === "item"}
          dropping={dropping}
          onSwitch={toItem}
          switchLabel={translate("showItems")}
        >
          {items.length === 0 ? (
            <EmptyHint text={translate("emptyItem")} onPress={toItem} />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              {...pickListProps(bottomInset, toItem)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={toItem}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: colors.surface.raised,
                      borderLeftColor: colors.border.strong,
                      opacity: toItem && pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  {/* 증강 타일과 같은 30 틀에 이미지만 0.75 로 — 나란한 두 목록의
                      아이콘 크기가 눈으로 같아진다. */}
                  <View
                    style={[
                      styles.rowIcon,
                      { borderColor: colors.border.subtle },
                    ]}
                  >
                    <RemoteImage
                      uri={itemImageUrl(item.imageKey)}
                      recyclingKey={item.id}
                      style={styles.rowImage}
                      contentFit="contain"
                    />
                  </View>
                  <ThemedText
                    numberOfLines={1}
                    color="secondary"
                    style={styles.rowName}
                  >
                    {item.name}
                  </ThemedText>
                  <RemoveBadge
                    label={translate("remove")}
                    onPress={() => onRemoveItem(item.id)}
                  />
                </Pressable>
              )}
            />
          )}
        </PickColumn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // paddingLeft 는 좌측 그리드의 contentContainer padding(=Spacing.two)과 같은 값.
  container: { flex: 1, gap: Spacing.two, paddingHorizontal: Spacing.two },

  // 5:5 — 두 칸은 폭을 똑같이 나눠 갖는다.
  columns: { flex: 1, flexDirection: "row", gap: Spacing.two },

  row: {
    flexDirection: "row",
    alignItems: "center",
    // 이름에 한 글자라도 더 주려고 조인 간격이다 — 칸이 5:5 라 여유가 없다.
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    // 오른쪽 위 배지가 앉을 자리 — 이름이 그 아래로 흘러들지 않도록 폭에서 빼 둔다.
    paddingRight: REMOVE_BADGE + Spacing.half,
    paddingLeft: Spacing.one,
    borderRadius: Radius.md,
    borderCurve: "continuous",
    borderLeftWidth: 3,
  },
  rowIcon: {
    width: ROW_ICON,
    height: ROW_ICON,
    // 증강 타일과 같은 어두운 톤 — 테마를 타지 않는다(위 AugmentTile 주석 참고).
    backgroundColor: HeroOverlay.cardBase,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rowImage: { width: ROW_IMAGE, height: ROW_IMAGE, borderRadius: Radius.sm },
  rowName: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
});
