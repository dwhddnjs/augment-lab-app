/**
 * AugmentPickGrid — 커스텀 화면 좌측(6.5). 티어 레일 + 증강 카드 3열 스크롤 그리드.
 *
 * 카드를 길게 눌러 우측 패널로 끌면 담긴다. 짧은 스와이프는 리스트 스크롤이라
 * activateAfterLongPress 로 갈라내고, 활성화된 뒤에는 blocksExternalGesture 로
 * FlatList 스크롤을 막는다 — 이게 없으면 드래그 중 리스트가 같이 흐른다.
 * (simultaneousWithExternalGesture 는 정반대 의미라 쓰면 안 된다.)
 *
 * 고스트 좌표는 worklet 이 shared value 에 직접 쓴다(UI 스레드). JS 로는 시작·끝만
 * 알린다 — 매 프레임 scheduleOnRN 하면 JS 스레드를 태워 프레임이 튄다.
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
import { scheduleOnRN } from "react-native-worklets";

import { ThemedText } from "@/components/themed/themed-text";
import { RarityCardFrame } from "@/components/ui/rarity-card-frame";
import {
  AugmentRarityColors,
  AugmentRarityGlyphs,
  HeroOverlay,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { Augment, AugmentRarity } from "@/features/augments/types";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: { all: "전체", silver: "실버", gold: "골드", prismatic: "프리즘" },
  en: { all: "All", silver: "Silver", gold: "Gold", prismatic: "Prism" },
};

/** 티어 세로 레일 폭 — 아이템 화면 필터바(SIDE_TAB_WIDTH)와 같은 44. */
export const TIER_RAIL_WIDTH = 44;
const COLS = 3;
const PAD = Spacing.two;
const GAP = Spacing.two;
/** 롱프레스 후 드래그 활성 — 짧으면 스크롤이 드래그로 오인되고, 길면 굼뜨다. */
const LONG_PRESS_MS = 180;

const TIERS: (AugmentRarity | null)[] = [null, "silver", "gold", "prismatic"];

/** 레일을 뺀 그리드 실측 폭에서 카드 한 장 너비를 낸다. */
export function cardWidthForGrid(gridW: number): number {
  return Math.max(72, Math.floor((gridW - PAD * 2 - GAP * (COLS - 1)) / COLS));
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
  const translate = useTranslation(t);

  return (
    <View style={styles.rail}>
      {TIERS.map((key) => {
        const active = tier === key;
        // 전체 칩만 테마색 — 나머지는 증강 티어 고유색이라 라이트/다크 무관.
        const tint = key
          ? AugmentRarityColors[key].border
          : colors.text.tertiary;
        return (
          <Pressable
            key={key ?? "all"}
            onPress={() => onChange(active ? null : key)}
            style={styles.railTab}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name={key ? AugmentRarityGlyphs[key] : "circle-outline"}
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
  onDragStart: (augment: Augment) => void;
  /** absoluteX 가 음수면 취소(시스템이 손가락을 가져감). */
  onDragEnd: (augment: Augment, absoluteX: number) => void;
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

  const pan = Gesture.Pan()
    .enabled(!quickMode)
    .activateAfterLongPress(LONG_PRESS_MS)
    .blocksExternalGesture(listGesture)
    .onStart((e) => {
      "worklet";
      ghostX.set(e.absoluteX);
      ghostY.set(e.absoluteY);
      scheduleOnRN(onDragStart, augment);
    })
    .onUpdate((e) => {
      "worklet";
      ghostX.set(e.absoluteX);
      ghostY.set(e.absoluteY);
    })
    .onEnd((e) => {
      "worklet";
      scheduleOnRN(onDragEnd, augment, e.absoluteX);
    })
    // 손가락을 시스템에 뺏겨도 고스트가 화면에 남지 않도록 취소 경로를 닫는다.
    .onTouchesCancelled(() => {
      "worklet";
      scheduleOnRN(onDragEnd, augment, -1);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: cardWidth }}>
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
      </View>
    </GestureDetector>
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
  ghostX: SharedValue<number>;
  ghostY: SharedValue<number>;
  onTap: (augment: Augment) => void;
  onDragStart: (augment: Augment) => void;
  onDragEnd: (augment: Augment, absoluteX: number) => void;
}

export function AugmentPickGrid({
  list,
  pickedIds,
  tier,
  onTierChange,
  quickMode,
  cardWidth,
  ghostX,
  ghostY,
  onTap,
  onDragStart,
  onDragEnd,
}: Props) {
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
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
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

  grid: { flex: 1, minWidth: 0 },
  gridContent: { padding: PAD, gap: GAP },
  gridRow: { gap: GAP },

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
