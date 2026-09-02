/**
 * PickColumn 과 그 부품 — 커스텀 패널 아래 절반의 한 칸(좌 증강 · 우 아이템).
 *
 * 지금 담기는 칸은 헤더 토글(target)이 정하고, 그 칸만 accent 테두리로 **항상** 켜 둔다 —
 * 드래그 중이 아니어도 어디로 담기는지 보인다. 손가락이 드롭 경계를 넘으면 그 칸 위에
 * 오버레이 + 트레이 아이콘을 얹는다(경계 계산은 custom-screen 이 하고 여기는 그리기만 한다).
 *
 * 반대편 칸을 탭하면 목록이 그쪽으로 넘어간다. 그 전환 탭을 칸 전체를 덮는 Pressable
 * 하나로 받으면 안 된다 — 부모가 터치를 먼저 잡아 안쪽 FlatList 가 스크롤을 못 한다
 * (담은 게 꽉 차면 마지막 줄을 볼 수 없다). 그래서 라벨 머리 · 각 행 · 목록 아래 빈
 * 자리(listProps 의 footer)가 각자 같은 onPress 를 든다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** 목록 행의 아이콘 틀 크기. 빈 칸 힌트도 이 높이에 맞춰 같은 자리에 앉는다. */
export const ROW_ICON = 30;
/** 증강 타일은 테두리 안에 아이콘을 0.75 로 그린다 — 아이템도 같은 비율로 맞춘다. */
export const ROW_IMAGE = Math.round(ROW_ICON * 0.75);
/** 행 모서리에 얹는 제거 배지. 목록 위에 올라앉으므로 글리프 중 가장 작게 잡는다. */
export const REMOVE_BADGE = 14;

interface ColumnProps {
  /** 이미 번역된 칸 이름("증강"/"아이템"). */
  label: string;
  /** "3/5" 같은 담긴 수. */
  count: string;
  /** 지금 담기는 칸인가 — 테두리를 켜고 드롭 오버레이도 이 칸에만 얹는다. */
  active: boolean;
  /** 드래그 중이고 손가락이 드롭 경계 안이다. */
  dropping: boolean;
  /** 이 칸으로 전환. 이미 이 칸이면 undefined — 눌러도 아무 일이 없어야 한다. */
  onSwitch?: () => void;
  /** 전환 탭의 접근성 라벨(전환 가능할 때만). */
  switchLabel?: string;
  children: ReactNode;
}

export function PickColumn({
  label,
  count,
  active,
  dropping,
  onSwitch,
  switchLabel,
  children,
}: ColumnProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.column}>
      <Pressable
        style={({ pressed }) => [
          styles.columnHead,
          { opacity: onSwitch && pressed ? 0.6 : 1 },
        ]}
        onPress={onSwitch}
        accessibilityRole={onSwitch ? "button" : undefined}
        accessibilityLabel={onSwitch ? switchLabel : undefined}
      >
        <ThemedText color="secondary" style={styles.columnLabel}>
          {label}
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
            borderColor: active ? colors.accent.default : colors.border.subtle,
          },
        ]}
      >
        {children}
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
}

/**
 * 행 오른쪽 위 모서리의 유일한 제거 수단. 행 자체는 칸 전환으로 흘러간다.
 * 이름 옆 자리(중앙)에 danger 색으로 두니 목록을 훑을 때마다 빨간 점이 먼저 읽혔다 —
 * 모서리로 올리고 tertiary 로 낮춰 "지울 때만 눈에 들어오는" 무게로 맞췄다.
 * 배지 폭은 행의 paddingRight 가 비워 두므로 이름과 겹치지 않는다.
 */
export function RemoveBadge({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
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
}

/** 빈 칸은 "여기에 넣는 자리"로 보여야 한다 — 담긴 행과 같은 크기·자리의 점선 한 칸. */
export function EmptyHint({
  text,
  onPress,
}: {
  text: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable style={styles.empty} onPress={onPress}>
      <View style={[styles.emptySlot, { borderColor: colors.border.default }]}>
        <ThemedText color="tertiary" style={styles.emptyText}>
          {text}
        </ThemedText>
      </View>
    </Pressable>
  );
}

/**
 * 두 목록이 공유하는 FlatList 설정 — 마지막 행만 홈 인디케이터를 피한다.
 * footer 가 남은 빈 자리를 채워 목록 아래를 눌러도 칸이 전환된다(flexGrow 와 한 쌍).
 */
export function pickListProps(bottomInset: number, onPress?: () => void) {
  return {
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
  };
}

const styles = StyleSheet.create({
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
    // 좌우(패널 paddingHorizontal)와 같은 값. 홈 인디케이터는 더하지 않는다 — 요청.
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
  removeBadge: { position: "absolute", top: Spacing.half, right: Spacing.half },
});
