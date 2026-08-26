/**
 * SelectedPanel — 커스텀 화면 우측(4.5). 챔피언 정보 + 담은 증강 목록.
 *
 * 이 패널 전체가 드롭존이다(경계 계산은 custom-screen 이 하고 여기는 그리기만 한다).
 * 행을 탭하면 제거된다 — 우→좌 드래그 되돌리기를 만들지 않은 이유.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentTile } from "@/components/ui/augment-tile";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import type { Champion } from "@/features/champions/types";
import { useRarityColors } from "@/hooks/use-rarity-colors";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl } from "@/lib/ddragon";
import { CHAMPION_TAG_LABELS, useTranslation } from "@/lib/i18n";

const t = {
  ko: {
    emptyDrag: "카드를 끌어다 놓으세요",
    emptyTap: "카드를 탭해서 담으세요",
    changeChampion: "챔피언 변경",
    reset: "선택 초기화",
    ...CHAMPION_TAG_LABELS.ko,
  },
  en: {
    emptyDrag: "Drag cards here",
    emptyTap: "Tap cards to add",
    changeChampion: "Change champion",
    reset: "Clear picks",
    ...CHAMPION_TAG_LABELS.en,
  },
};

const ROW_ICON = 30;
const CHAMP_ICON = 44;

interface Props {
  champion: Champion | null;
  picked: Augment[];
  /** 빈 상태 안내 문구를 조작 방식에 맞춘다. */
  quickMode: boolean;
  /** 드래그한 카드가 이 패널 위에 왔을 때만 강조해 "여기 놓으라"고 알린다. */
  dropActive: boolean;
  /** 화면이 재는 홈 인디케이터 높이. 박스가 화면 끝까지 내려오므로 목록 안에서 띄운다. */
  bottomInset: number;
  onRemove: (id: string) => void;
  onChangeChampion: () => void;
  onClear: () => void;
}

export function SelectedPanel({
  champion,
  picked,
  quickMode,
  dropActive,
  bottomInset,
  onRemove,
  onChangeChampion,
  onClear,
}: Props) {
  const { colors } = useTheme();
  const rarityColors = useRarityColors();
  const translate = useTranslation(t) as (key: string) => string;

  /** 챔피언 행 끝의 아이콘 버튼 — 드로어까지 가지 않고 바로 누른다. */
  const iconButton = (
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    label: string,
    color: string,
    onPress: () => void,
  ) => (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={translate(label)}
      style={({ pressed }) => [
        styles.iconButton,
        {
          borderColor: colors.border.subtle,
          backgroundColor: colors.surface.raised,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={16} color={color} />
    </Pressable>
  );

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

        {iconButton(
          "account-switch-outline",
          "changeChampion",
          colors.text.secondary,
          onChangeChampion,
        )}
        {iconButton(
          "trash-can-outline",
          "reset",
          colors.status.danger.default,
          onClear,
        )}
      </View>

      <View
        style={[
          styles.box,
          {
            // 굵기는 그대로 둔다 — 바꾸면 강조될 때마다 안쪽 목록이 1pt 밀린다.
            borderColor: dropActive
              ? colors.accent.default
              : colors.border.subtle,
            backgroundColor: dropActive ? colors.accent.subtle : "transparent",
          },
        ]}
      >
        {picked.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText type="caption" color="tertiary" style={styles.emptyText}>
              {translate(quickMode ? "emptyTap" : "emptyDrag")}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={picked}
            keyExtractor={(a) => a.id}
            contentContainerStyle={[
              styles.listContent,
              // 박스는 화면 끝 가까이까지 내려오므로 마지막 행만 인디케이터를 피한다.
              { paddingBottom: Spacing.one + bottomInset },
            ]}
            showsVerticalScrollIndicator={false}
            // 검색 키보드가 떠 있어도 행 탭(제거)이 첫 번째부터 먹히도록.
            keyboardShouldPersistTaps="handled"
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
                    type="caption"
                    numberOfLines={2}
                    style={[styles.rowName, { color: tint }]}
                  >
                    {item.name}
                  </ThemedText>
                </Pressable>
              );
            }}
          />
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
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  box: {
    flex: 1,
    // 좌우(container paddingHorizontal)와 같은 값. 홈 인디케이터는 더하지 않는다 — 요청.
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { textAlign: "center", paddingHorizontal: Spacing.three },

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
  rowName: { flex: 1, minWidth: 0, fontWeight: "600" },
});
