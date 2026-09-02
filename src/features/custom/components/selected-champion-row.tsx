/**
 * SelectedChampionRow — 커스텀 패널 맨 윗줄. 챔피언 아이콘·이름·역할 + 동작 알약 셋.
 *
 * 챔피언을 못 찾았을 때(데이터에 없는 id 로 진입)도 행 자체는 그린다 — 통째로 숨기면
 * 챔피언을 바꿀 유일한 진입점까지 사라진다. 스탯만 챔피언이 있어야 계산되므로 그 버튼만 뺀다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { GlassSurface } from "@/components/ui/glass-surface";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import type { Champion } from "@/features/champions/types";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl } from "@/lib/ddragon";
import { CHAMPION_TAG_LABELS, useTranslation } from "@/lib/i18n";

const t = {
  ko: { info: "정보", change: "변경", reset: "선택 초기화", ...CHAMPION_TAG_LABELS.ko },
  en: { info: "Info", change: "Change", reset: "Clear picks", ...CHAMPION_TAG_LABELS.en },
};

const CHAMP_ICON = 44;

interface Props {
  champion: Champion | null;
  onShowStats: () => void;
  onChangeChampion: () => void;
  onClear: () => void;
}

export function SelectedChampionRow({
  champion,
  onShowStats,
  onChangeChampion,
  onClear,
}: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t) as (key: string) => string;

  /**
   * 동작 버튼 공통 껍데기 — 라벨이든 글리프든 같은 알약을 쓴다.
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

  return (
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
  );
}

const styles = StyleSheet.create({
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
});
