/**
 * SelectedPanel — 커스텀 화면 우측(4.5). 챔피언 행 + 담은 증강/아이템 목록.
 *
 * 아래 절반은 5:5 두 칸이다(좌 증강 · 우 아이템). 지금 담기는 칸은 헤더 토글(target)이
 * 정하고, 그 칸만 accent 테두리로 **항상** 켜 둔다 — 드래그 중이 아니어도 어디로 담기는지
 * 보인다. 손가락이 드롭 경계를 넘으면 그 칸 위에 오버레이 + 트레이 아이콘을 얹는다
 * (경계 계산은 custom-screen 이 하고 여기는 그리기만 한다).
 *
 * 반대편 칸을 탭하면 목록이 그쪽으로 넘어간다 — 헤더 토글까지 손을 옮기지 않아도 된다.
 * 그래서 행 탭은 더 이상 제거가 아니다(스크롤 중 오탭으로 지워지던 것도 같이 없어졌다).
 * 제거는 행 오른쪽 위 모서리의 작은 x 배지 하나뿐이다.
 *
 * 그 전환 탭을 칸 전체를 덮는 Pressable 하나로 받으면 안 된다 — 부모가 터치를 먼저
 * 잡아 안쪽 FlatList 가 스크롤을 못 한다(담은 게 꽉 차면 마지막 줄을 볼 수 없다).
 * 그래서 라벨 머리 · 각 행 · 목록 아래 빈 자리(footer)가 각자 같은 onPress 를 든다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentTile } from "@/components/ui/augment-tile";
import { GlassSurface } from "@/components/ui/glass-surface";
import { RemoteImage } from "@/components/ui/remote-image";
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
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
    showAugments: "증강 목록 보기",
    showItems: "아이템 목록 보기",
    remove: "제거",
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
    showAugments: "Show augments",
    showItems: "Show items",
    remove: "Remove",
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
/** 행 모서리에 얹는 제거 배지. 목록 위에 올라앉으므로 글리프 중 가장 작게 잡는다. */
const REMOVE_BADGE = 14;

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
  const translate = useTranslation(t) as (key: string) => string;

  const switchTarget = () => {
    Haptics.selectionAsync().catch(() => {});
    onSwitchTarget();
  };

  /** 지금 칸이면 undefined — 눌러도 아무 일이 없어야 한다. */
  const switchTo = (kind: PickTarget) =>
    target === kind ? undefined : switchTarget;

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

  /**
   * 행 오른쪽 위 모서리의 유일한 제거 수단. 행 자체는 이제 칸 전환으로 흘러간다.
   * 이름 옆 자리(중앙)에 danger 색으로 두니 목록을 훑을 때마다 빨간 점이 먼저 읽혔다 —
   * 모서리로 올리고 tertiary 로 낮춰 "지울 때만 눈에 들어오는" 무게로 맞췄다.
   * 배지 폭은 row 의 paddingRight 가 비워 두므로 이름과 겹치지 않는다.
   */
  const removeButton = (onPress: () => void) => (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={translate("remove")}
      style={({ pressed }) => [
        styles.removeBadge,
        { opacity: pressed ? 0.5 : 1 },
      ]}
    >
      <MaterialCommunityIcons
        name="close-circle-outline"
        size={REMOVE_BADGE}
        color={colors.text.tertiary}
      />
    </Pressable>
  );

  /**
   * 라벨 + 박스 한 칸. 두 칸이 같은 높이를 나눠 갖는다.
   * 지금 칸이 아니면 통째로 탭 타깃이다 — 라벨 머리까지 포함해 넓게 잡는다.
   */
  const column = (kind: PickTarget, count: string, body: ReactNode) => {
    const active = target === kind;
    const onPress = switchTo(kind);
    const labelKey = kind === "augment" ? "augments" : "items";
    return (
      <View style={styles.column}>
        <Pressable
          style={({ pressed }) => [
            styles.columnHead,
            { opacity: onPress && pressed ? 0.6 : 1 },
          ]}
          onPress={onPress}
          accessibilityRole={onPress ? "button" : undefined}
          accessibilityLabel={
            onPress
              ? translate(kind === "augment" ? "showAugments" : "showItems")
              : undefined
          }
        >
          <ThemedText color="secondary" style={styles.columnLabel}>
            {translate(labelKey)}
          </ThemedText>
          <ThemedText color="tertiary" style={styles.columnLabel}>
            {count}
          </ThemedText>
        </Pressable>
        <View
          style={[
            styles.box,
            {
              // 굵기는 그대로 둔다 — 바꾸면 강조될 때마다 안쪽 목록이 1pt 밀린다.
              borderColor: active
                ? colors.accent.default
                : colors.border.subtle,
            },
          ]}
        >
          {body}
          {/* 담긴 행을 색으로 덮지 않는다 — 어둡게 깔고 "여기 놓으라"는 글리프만 띄운다. */}
          {active && dropping && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.drop,
                { backgroundColor: colors.surface.overlay },
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-down-circle-outline"
                size={28}
                color={colors.accent.default}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  /** 빈 칸은 "여기에 넣는 자리"로 보여야 한다 — 담긴 행과 같은 크기·자리의 점선 한 칸. */
  const emptyHint = (key: string, onPress?: () => void) => (
    <Pressable style={styles.empty} onPress={onPress}>
      <View style={[styles.emptySlot, { borderColor: colors.border.default }]}>
        <ThemedText color="tertiary" style={styles.emptyText}>
          {translate(key)}
        </ThemedText>
      </View>
    </Pressable>
  );

  /**
   * 두 목록이 공유하는 리스트 설정 — 마지막 행만 홈 인디케이터를 피한다.
   * footer 가 남은 빈 자리를 채워 목록 아래를 눌러도 칸이 전환된다(flexGrow 와 한 쌍).
   */
  const listProps = (onPress?: () => void) => ({
    contentContainerStyle: [
      styles.listContent,
      { flexGrow: 1, paddingBottom: Spacing.one + bottomInset },
    ],
    showsVerticalScrollIndicator: false,
    // 검색 키보드가 떠 있어도 제거 버튼이 첫 번째 탭부터 먹히도록.
    keyboardShouldPersistTaps: "handled" as const,
    // wrapper 에도 flex 를 줘야 한다 — FlatList 가 footer 를 감싸는 View 는 기본 높이 auto 라
    // footer 의 flex: 1 이 0 으로 접힌다(빈 자리를 눌러도 전환이 안 되던 원인).
    ListFooterComponentStyle: styles.listFiller,
    ListFooterComponent: (
      <Pressable style={styles.listFiller} onPress={onPress} />
    ),
  });

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
            <ThemedText style={styles.pillLabel}>
              {translate("info")}
            </ThemedText>,
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
          "augment",
          `${picked.length}/${MAX_AUGMENTS}`,
          picked.length === 0 ? (
            emptyHint("emptyAugment", switchTo("augment"))
          ) : (
            <FlatList
              data={picked}
              keyExtractor={(a) => a.id}
              {...listProps(switchTo("augment"))}
              renderItem={({ item }) => {
                const tint = rarityColors[item.rarity].border;
                const onPress = switchTo("augment");
                return (
                  <Pressable
                    onPress={onPress}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: colors.surface.raised,
                        borderLeftColor: tint,
                        opacity: onPress && pressed ? 0.6 : 1,
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
                    {removeButton(() => onRemove(item.id))}
                  </Pressable>
                );
              }}
            />
          ),
        )}

        {column(
          "item",
          `${items.length}/${MAX_ITEMS}`,
          items.length === 0 ? (
            emptyHint("emptyItem", switchTo("item"))
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              {...listProps(switchTo("item"))}
              renderItem={({ item }) => {
                const onPress = switchTo("item");
                return (
                  <Pressable
                    onPress={onPress}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: colors.surface.raised,
                        borderLeftColor: colors.border.strong,
                        opacity: onPress && pressed ? 0.6 : 1,
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
                    {removeButton(() => onRemoveItem(item.id))}
                  </Pressable>
                );
              }}
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
  drop: { alignItems: "center", justifyContent: "center" },
  // listContent 와 같은 padding — 점선 칸이 실제 첫 행이 놓일 자리에 정확히 앉는다.
  // flex 로 박스를 가득 채운다 — 점선 아래 빈 자리를 눌러도 칸이 전환되도록(목록의 footer 와 같은 역할).
  empty: { flex: 1, padding: Spacing.one },
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
  // 목록 아래 남는 자리 — 여기까지가 "칸을 눌렀다"로 친다.
  listFiller: { flex: 1 },
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
  removeBadge: { position: "absolute", top: Spacing.half, right: Spacing.half },
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
