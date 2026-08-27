/**
 * SelectedPanel — 커스텀 화면 우측(4.5). 챔피언 행 + 담은 증강/아이템 목록.
 *
 * 아래 절반은 5:5 두 칸이다(좌 증강 · 우 아이템). 패널 전체가 드롭존이고, 어느 칸에
 * 담길지는 헤더 토글이 정한다 — 하이라이트는 그래서 드래그 중인 종류의 칸에만 켜진다
 * (경계 계산은 custom-screen 이 하고 여기는 그리기만 한다).
 *
 * 행을 탭하면 제거된다 — 우→좌 드래그 되돌리기를 만들지 않은 이유.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ReactNode } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentTile } from "@/components/ui/augment-tile";
import { GlassSurface } from "@/components/ui/glass-surface";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import type { Champion } from "@/features/champions/types";
import { MAX_ITEMS, type Item } from "@/features/items/types";
import { useRarityColors } from "@/hooks/use-rarity-colors";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl, itemImageUrl } from "@/lib/ddragon";
import { CHAMPION_TAG_LABELS, useTranslation } from "@/lib/i18n";
import { MAX_AUGMENTS, type PickTarget } from "../hooks/use-custom-draft";

const t = {
  ko: {
    augments: "증강",
    items: "아이템",
    emptyAugment: "카드를 넣어주세요",
    emptyItem: "아이템을 넣어주세요",
    info: "정보",
    change: "변경",
    reset: "선택 초기화",
    ...CHAMPION_TAG_LABELS.ko,
  },
  en: {
    augments: "Augments",
    items: "Items",
    emptyAugment: "Drop a card here",
    emptyItem: "Drop an item here",
    info: "Info",
    change: "Change",
    reset: "Clear picks",
    ...CHAMPION_TAG_LABELS.en,
  },
};

const ROW_ICON = 30;
/** 증강 타일은 테두리 안에 아이콘을 0.75 로 그린다 — 아이템도 같은 비율로 맞춘다. */
const ROW_IMAGE = Math.round(ROW_ICON * 0.75);
const CHAMP_ICON = 44;

interface Props {
  champion: Champion | null;
  picked: Augment[];
  items: Item[];
  /** 드래그 중인 종류. 그 칸만 강조해 "여기 담긴다"고 알린다. */
  dropTarget: PickTarget | null;
  /** 화면이 재는 홈 인디케이터 높이. 박스가 화면 끝까지 내려오므로 목록 안에서 띄운다. */
  bottomInset: number;
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
  dropTarget,
  bottomInset,
  onRemove,
  onRemoveItem,
  onShowStats,
  onChangeChampion,
  onClear,
}: Props) {
  const { colors } = useTheme();
  const rarityColors = useRarityColors();
  const translate = useTranslation(t) as (key: string) => string;

  /**
   * 챔피언 행의 동작 버튼 공통 껍데기 — 라벨이든 글리프든 같은 알약을 쓴다.
   * 단색 알약은 패널 배경과 톤이 겹쳐 버튼으로 안 읽혔다. 헤더 버튼과 같은
   * 글라스 재질 + 진한 테두리로 "떠 있는 컨트롤"임을 재질로 구분한다.
   */
  const pillButton = (
    key: string,
    body: ReactNode,
    onPress: () => void,
    style?: object,
  ) => (
    <Pressable
      key={key}
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={translate(key)}
      style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
    >
      <GlassSurface
        glassStyle="regular"
        style={[styles.pill, style, { borderColor: colors.border.strong }]}
      >
        {body}
      </GlassSurface>
    </Pressable>
  );

  /** 라벨 + 박스 한 칸. 두 칸이 같은 높이를 나눠 갖는다. */
  const column = (
    labelKey: string,
    count: string,
    active: boolean,
    body: ReactNode,
  ) => (
    <View style={styles.column}>
      <View style={styles.columnHead}>
        <ThemedText color="secondary" style={styles.columnLabel}>
          {translate(labelKey)}
        </ThemedText>
        <ThemedText color="tertiary" style={styles.columnLabel}>
          {count}
        </ThemedText>
      </View>
      <View
        style={[
          styles.box,
          {
            // 굵기는 그대로 둔다 — 바꾸면 강조될 때마다 안쪽 목록이 1pt 밀린다.
            borderColor: active ? colors.accent.default : colors.border.subtle,
            backgroundColor: active ? colors.accent.subtle : "transparent",
          },
        ]}
      >
        {body}
      </View>
    </View>
  );

  /** 빈 칸은 "여기에 넣는 자리"로 보여야 한다 — 담긴 행과 같은 크기·자리의 점선 한 칸. */
  const emptyHint = (key: string) => (
    <View style={styles.empty}>
      <View style={[styles.emptySlot, { borderColor: colors.border.default }]}>
        <ThemedText color="tertiary" style={styles.emptyText}>
          {translate(key)}
        </ThemedText>
      </View>
    </View>
  );

  /** 두 목록이 공유하는 리스트 설정 — 마지막 행만 홈 인디케이터를 피한다. */
  const listProps = {
    contentContainerStyle: [
      styles.listContent,
      { paddingBottom: Spacing.one + bottomInset },
    ],
    showsVerticalScrollIndicator: false,
    // 검색 키보드가 떠 있어도 행 탭(제거)이 첫 번째부터 먹히도록.
    keyboardShouldPersistTaps: "handled" as const,
  };

  return (
    <View style={styles.container}>
      {/* 행 자체는 항상 그린다 — 챔피언을 못 찾았을 때(데이터에 없는 id 로 진입)
          이 행을 통째로 숨기면 챔피언을 바꿀 유일한 진입점까지 사라진다. */}
      <View style={styles.champRow}>
        {champion ? (
          <>
            <RemoteImage
              uri={championSquareUrl(champion.imageKey)}
              recyclingKey={champion.id}
              style={[styles.champIcon, { borderColor: colors.accent.default }]}
              contentFit="cover"
            />
            <View style={styles.champMeta}>
              <ThemedText type="label" numberOfLines={1}>
                {champion.name}
              </ThemedText>
              <ThemedText type="caption" color="tertiary" numberOfLines={1}>
                {champion.tags.map((tag) => translate(tag)).join(" · ")}
              </ThemedText>
            </View>
          </>
        ) : (
          <View style={styles.champMeta} />
        )}

        {/* 스탯은 챔피언이 있어야 계산된다 — 없으면 버튼도 두지 않는다. */}
        {champion &&
          pillButton(
            "info",
            <ThemedText style={styles.pillLabel}>{translate("info")}</ThemedText>,
            onShowStats,
            styles.pillText,
          )}
        {pillButton(
          "change",
          <ThemedText color="accent" style={styles.pillLabel}>
            {translate("change")}
          </ThemedText>,
          onChangeChampion,
          styles.pillText,
        )}
        {pillButton(
          "reset",
          <MaterialCommunityIcons
            name="restart"
            size={16}
            color={colors.status.danger.default}
          />,
          onClear,
          styles.pillIcon,
        )}
      </View>

      <View style={styles.columns}>
        {column(
          "augments",
          `${picked.length}/${MAX_AUGMENTS}`,
          dropTarget === "augment",
          picked.length === 0 ? (
            emptyHint("emptyAugment")
          ) : (
            <FlatList
              data={picked}
              keyExtractor={(a) => a.id}
              {...listProps}
              renderItem={({ item }) => {
                const tint = rarityColors[item.rarity].border;
                return (
                  <Pressable
                    onPress={() => onRemove(item.id)}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: colors.surface.raised,
                        borderLeftColor: tint,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <AugmentTile
                      iconPath={item.iconPath}
                      rarity={item.rarity}
                      size={ROW_ICON}
                      background={colors.surface.sunken}
                      recyclingKey={item.id}
                    />
                    <ThemedText
                      numberOfLines={2}
                      style={[styles.rowName, { color: tint }]}
                    >
                      {item.name}
                    </ThemedText>
                  </Pressable>
                );
              }}
            />
          ),
        )}

        {column(
          "items",
          `${items.length}/${MAX_ITEMS}`,
          dropTarget === "item",
          items.length === 0 ? (
            emptyHint("emptyItem")
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              {...listProps}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onRemoveItem(item.id)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: colors.surface.raised,
                      borderLeftColor: colors.border.strong,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  {/* 증강 타일과 같은 30 틀에 이미지만 0.75 로 — 나란한 두 목록의
                      아이콘 크기가 눈으로 같아진다. */}
                  <View
                    style={[
                      styles.rowIcon,
                      {
                        backgroundColor: colors.surface.sunken,
                        borderColor: colors.border.subtle,
                      },
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
                    numberOfLines={2}
                    color="secondary"
                    style={styles.rowName}
                  >
                    {item.name}
                  </ThemedText>
                </Pressable>
              )}
            />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // paddingLeft 는 좌측 그리드의 contentContainer padding(=Spacing.two)과 같은 값.
  container: { flex: 1, gap: Spacing.two, paddingHorizontal: Spacing.two },

  champRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  champIcon: {
    width: CHAMP_ICON,
    height: CHAMP_ICON,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  champMeta: { flex: 1, minWidth: 0, gap: 1 },
  pill: {
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pillText: { paddingHorizontal: Spacing.double },
  pillIcon: { width: 28 },
  pillLabel: { fontSize: 11, lineHeight: 14, fontWeight: "600" },

  // 5:5 — 두 칸은 폭을 똑같이 나눠 갖는다.
  columns: { flex: 1, flexDirection: "row", gap: Spacing.two },
  column: { flex: 1, minWidth: 0 },
  columnHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.half,
    paddingBottom: Spacing.one,
  },
  columnLabel: { fontSize: 10, lineHeight: 13, fontWeight: "600" },

  box: {
    flex: 1,
    // 좌우(container paddingHorizontal)와 같은 값. 홈 인디케이터는 더하지 않는다 — 요청.
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  // listContent 와 같은 padding — 점선 칸이 실제 첫 행이 놓일 자리에 정확히 앉는다.
  empty: { padding: Spacing.one },
  emptySlot: {
    // 행 높이(아이콘 30 + 위아래 4)와 같다.
    height: ROW_ICON + Spacing.two,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.md,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.two,
  },
  emptyText: { fontSize: 11, lineHeight: 15, textAlign: "center" },

  listContent: { padding: Spacing.one, gap: Spacing.one },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    paddingRight: Spacing.two,
    paddingLeft: Spacing.one,
    borderRadius: Radius.md,
    borderCurve: "continuous",
    borderLeftWidth: 3,
  },
  rowIcon: {
    width: ROW_ICON,
    height: ROW_ICON,
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
