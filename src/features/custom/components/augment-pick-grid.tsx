/**
 * AugmentPickGrid — 커스텀 화면 좌측(6.5). 티어 레일 + 증강 카드 3열 스크롤 그리드.
 *
 * 카드를 길게 눌러 우측 패널로 끌면 담긴다(퀵모드면 탭 한 번). 끄는 조작 자체는
 * DragCell 이 맡고 여기는 카드와 리스트만 그린다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  type GestureType,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import { RarityCardFrame } from "@/components/ui/rarity-card-frame";
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
import type { Augment, AugmentRarity } from "@/features/augments/types";
import { useRarityColors } from "@/hooks/use-rarity-colors";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";
import { DragCell, type DragPayload } from "./drag-cell";

const t = {
  ko: {
    all: "전체",
    silver: "실버",
    gold: "골드",
    prismatic: "프리즘",
    empty: "결과 없음",
  },
  en: {
    all: "All",
    silver: "Silver",
    gold: "Gold",
    prismatic: "Prism",
    empty: "No results",
  },
};

/** 티어 세로 레일 폭 — 아이템 화면 필터바(SIDE_TAB_WIDTH)와 같은 44. */
export const TIER_RAIL_WIDTH = 44;
const COLS = 3;
const PAD = Spacing.two;
const GAP = Spacing.two;

const TIERS: (AugmentRarity | null)[] = [null, "silver", "gold", "prismatic"];

/**
 * 레일 전용 아이콘. 육각형 채움 정도로 등급이 올라가는 게 읽히고, 전체는 그리드 아이콘과
 * 의미가 맞는다. theme 의 AugmentRarityGlyphs 는 "아이콘을 못 받았을 때의 폴백"이라
 * 의미가 달라 재사용하지 않는다 — 저길 바꾸면 aram·builds·items 카드까지 바뀐다.
 */
const TIER_ICONS: Record<
  "all" | AugmentRarity,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  all: "view-grid-outline",
  silver: "hexagon-outline",
  gold: "hexagon-slice-6",
  prismatic: "hexagon-multiple",
};

/** 레일을 뺀 그리드 실측 폭에서 카드 한 장 너비를 낸다. */
export function cardWidthForGrid(gridW: number): number {
  // floor 하지 않는다 — 버린 소수가 열 수만큼 쌓여 행 끝에 남고, 그만큼
  // 오른쪽 여백만 넓어진다(왼쪽은 padding 그대로라 좌우가 안 맞는다).
  return Math.max(72, (gridW - PAD * 2 - GAP * (COLS - 1)) / COLS);
}

// ─── 티어 레일 ───────────────────────────────────────────────────────────────
function TierRail({
  tier,
  onChange,
}: {
  tier: AugmentRarity | null;
  onChange: (next: AugmentRarity | null) => void;
}) {
  const { colors } = useTheme();
  const rarityColors = useRarityColors();
  const translate = useTranslation(t);

  return (
    <View style={styles.rail}>
      {TIERS.map((key) => {
        const active = tier === key;
        // 전체 칩만 테마색 — 나머지는 증강 티어 고유색이라 라이트/다크 무관.
        const tint = key ? rarityColors[key].border : colors.text.tertiary;
        return (
          <Pressable
            key={key ?? "all"}
            onPress={() => onChange(active ? null : key)}
            style={styles.railTab}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name={TIER_ICONS[key ?? "all"]}
              size={20}
              color={active ? tint : colors.text.tertiary}
            />
            <ThemedText
              style={[
                styles.railLabel,
                { color: active ? tint : colors.text.tertiary },
              ]}
            >
              {translate(key ?? "all")}
            </ThemedText>
            <View
              style={[
                styles.railDot,
                { backgroundColor: active ? tint : "transparent" },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── 드래그 셀 ───────────────────────────────────────────────────────────────
interface CellProps {
  augment: Augment;
  cardWidth: number;
  checked: boolean;
  quickMode: boolean;
  listGesture: GestureType;
  ghostX: SharedValue<number>;
  ghostY: SharedValue<number>;
  onTap: (augment: Augment) => void;
  onDragStart: (payload: DragPayload) => void;
  onDragEnd: (payload: DragPayload, absoluteX: number) => void;
}

function AugmentDragCell({
  augment,
  cardWidth,
  checked,
  quickMode,
  listGesture,
  ghostX,
  ghostY,
  onTap,
  onDragStart,
  onDragEnd,
}: CellProps) {
  const { colors } = useTheme();

  return (
    <DragCell
      payload={{ kind: "augment", augment }}
      enabled={!quickMode}
      listGesture={listGesture}
      ghostX={ghostX}
      ghostY={ghostY}
      style={{ width: cardWidth }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <Pressable
        onPress={() => quickMode && onTap(augment)}
        style={({ pressed }) => ({ opacity: pressed && quickMode ? 0.7 : 1 })}
      >
        <RarityCardFrame augment={augment} cardWidth={cardWidth} />
        {checked && (
          <>
            <View style={styles.checkedVeil} />
            <View
              style={[styles.check, { backgroundColor: colors.accent.default }]}
            >
              <ThemedText
                style={[styles.checkMark, { color: colors.accent.onAccent }]}
              >
                ✓
              </ThemedText>
            </View>
          </>
        )}
      </Pressable>
    </DragCell>
  );
}

// ─── 그리드 ──────────────────────────────────────────────────────────────────
interface Props {
  list: Augment[];
  pickedIds: Set<string>;
  tier: AugmentRarity | null;
  onTierChange: (next: AugmentRarity | null) => void;
  quickMode: boolean;
  cardWidth: number;
  /** 화면이 재는 홈 인디케이터 높이. 리스트가 화면 끝까지 흐르므로 여기서 띄운다. */
  bottomInset: number;
  ghostX: SharedValue<number>;
  ghostY: SharedValue<number>;
  onTap: (augment: Augment) => void;
  onDragStart: (payload: DragPayload) => void;
  onDragEnd: (payload: DragPayload, absoluteX: number) => void;
}

export function AugmentPickGrid({
  list,
  pickedIds,
  tier,
  onTierChange,
  quickMode,
  cardWidth,
  bottomInset,
  ghostX,
  ghostY,
  onTap,
  onDragStart,
  onDragEnd,
}: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  // 셀들이 blocksExternalGesture 로 참조할 대상. 인스턴스가 매 렌더 바뀌면 참조가
  // 끊기므로 lazy initializer 로 한 번만 만든다(useRef.current 는 렌더 중 읽을 수 없다).
  const [listGesture] = useState(() => Gesture.Native());

  return (
    <View style={styles.left}>
      <TierRail tier={tier} onChange={onTierChange} />

      <GestureDetector gesture={listGesture}>
        <FlatList
          data={list}
          numColumns={COLS}
          keyExtractor={(a) => a.id}
          style={[styles.grid, { borderColor: colors.border.subtle }]}
          contentContainerStyle={[
            styles.gridContent,
            // 화면 하단까지 그리드를 쓰되 마지막 줄이 홈 인디케이터에 물리지 않게.
            { paddingBottom: PAD + bottomInset },
          ]}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          // 검색 키보드가 떠 있어도 카드 탭·롱프레스가 첫 번째부터 먹히도록.
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="caption" color="tertiary">
                {translate("empty")}
              </ThemedText>
            </View>
          }
          // data 가 그대로면 FlatList 는 셀을 다시 그리지 않는다 — 담긴 표시(체크)가
          // 붙지 않던 원인. pickedIds 는 갱신마다 새 Set 이라 참조 비교로 충분하다.
          extraData={pickedIds}
          renderItem={({ item }) => (
            <AugmentDragCell
              augment={item}
              cardWidth={cardWidth}
              checked={pickedIds.has(item.id)}
              quickMode={quickMode}
              listGesture={listGesture}
              ghostX={ghostX}
              ghostY={ghostY}
              onTap={onTap}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          )}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  left: { flex: 1, flexDirection: "row", minWidth: 0 },

  rail: {
    width: TIER_RAIL_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: "center",
    gap: Spacing.double,
    paddingTop: Spacing.two,
  },
  railTab: { alignItems: "center", gap: 2 },
  railLabel: { fontSize: 9, lineHeight: 11, fontWeight: "600" },
  railDot: { width: 4, height: 4, borderRadius: Radius.full },

  grid: {
    flex: 1,
    minWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  // flexGrow — 결과가 없을 때 ListEmptyComponent 의 flex:1 이 살아나 안내가 보인다.
  gridContent: { flexGrow: 1, padding: PAD, gap: GAP },
  gridRow: { gap: GAP },
  empty: { flex: 1, alignItems: "center", paddingTop: Spacing.six },

  check: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { fontSize: 10, lineHeight: 14, fontWeight: "700" },
  // 담긴 카드를 눌러 앉힌다 — 체크 배지만으로는 스캔이 안 된다.
  checkedVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: HeroOverlay.tileBg,
    borderRadius: Radius.lg + 3,
  },
});
