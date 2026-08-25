/**
 * SelectedPanel — 커스텀 화면 우측(4.5). 챔피언 정보 + 담은 증강 목록.
 *
 * 이 패널 전체가 드롭존이다(경계 계산은 custom-screen 이 하고 여기는 그리기만 한다).
 * 행을 탭하면 제거된다 — 우→좌 드래그 되돌리기를 만들지 않은 이유.
 */
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentTile } from "@/components/ui/augment-tile";
import { RemoteImage } from "@/components/ui/remote-image";
import { AugmentRarityColors, Radius, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import type { Champion } from "@/features/champions/types";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl } from "@/lib/ddragon";
import { CHAMPION_TAG_LABELS, useTranslation } from "@/lib/i18n";
import type { PickLimit } from "../hooks/use-custom-draft";

const t = {
  ko: {
    selected: "선택된 증강",
    emptyDrag: "카드를 끌어다 놓으세요",
    emptyTap: "카드를 탭해서 담으세요",
    ...CHAMPION_TAG_LABELS.ko,
  },
  en: {
    selected: "Selected",
    emptyDrag: "Drag cards here",
    emptyTap: "Tap cards to add",
    ...CHAMPION_TAG_LABELS.en,
  },
};

const ROW_ICON = 30;
const CHAMP_ICON = 44;

interface Props {
  champion: Champion | null;
  picked: Augment[];
  limit: PickLimit;
  /** 빈 상태 안내 문구를 조작 방식에 맞춘다. */
  quickMode: boolean;
  onRemove: (id: string) => void;
}

export function SelectedPanel({
  champion,
  picked,
  limit,
  quickMode,
  onRemove,
}: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t) as (key: string) => string;

  return (
    <View style={styles.container}>
      {champion && (
        <View style={styles.champRow}>
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
        </View>
      )}

      <View style={styles.headerRow}>
        <ThemedText type="label" color="secondary">
          {translate("selected")}
        </ThemedText>
        <ThemedText type="label" color={picked.length ? "accent" : "tertiary"}>
          {picked.length}
          {limit === null ? "" : ` / ${limit}`}
        </ThemedText>
      </View>

      <View
        style={[styles.box, { borderColor: colors.border.subtle }]}
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
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const tint = AugmentRarityColors[item.rarity].border;
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
  container: { flex: 1, gap: Spacing.two, paddingHorizontal: Spacing.three },

  champRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  champIcon: {
    width: CHAMP_ICON,
    height: CHAMP_ICON,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  champMeta: { flex: 1, minWidth: 0, gap: 1 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  box: {
    flex: 1,
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
