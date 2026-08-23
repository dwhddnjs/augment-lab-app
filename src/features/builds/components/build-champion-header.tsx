import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { ModeBadge } from "@/components/ui/mode-badge";
import { Radius, Spacing } from "@/constants/theme";
import type { Champion } from "@/features/champions/types";
import { useTheme } from "@/hooks/use-theme";
import type { GameMode } from "@/lib/build-storage";
import { championSquareUrl } from "@/lib/ddragon";
import { CHAMPION_TAG_LABELS, useTranslation } from "@/lib/i18n";

interface Props {
  champion: Champion;
  /** 어느 모드로 만든 빌드인지 — 우측에 날짜와 함께 마킹한다. */
  mode: GameMode;
  /** 로케일 포맷된 생성일. */
  date: string;
}

/** 빌드 상세 상단 — 챔피언 아이콘/이름/타입 + 생성일. */
export function BuildChampionHeader({ champion, mode, date }: Props) {
  const { colors } = useTheme();
  const translateTag = useTranslation(CHAMPION_TAG_LABELS);

  return (
    <View style={styles.champHeader}>
      <Image
        source={{ uri: championSquareUrl(champion.imageKey) }}
        style={[styles.champIcon, { borderColor: colors.accent.default }]}
        contentFit="cover"
      />
      <View style={styles.champMeta}>
        <ThemedText
          type="heading"
          numberOfLines={1}
          style={{ fontWeight: "800" }}
        >
          {champion.name}
        </ThemedText>
        <ThemedText type="caption" color="tertiary" numberOfLines={1}>
          {champion.title}
        </ThemedText>
        <View style={styles.tagRow}>
          {champion.tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tagChip,
                { backgroundColor: colors.accent.subtle },
              ]}
            >
              <ThemedText
                type="caption"
                style={{ color: colors.accent.default }}
              >
                {translateTag(tag)}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
      {/* 이 빌드의 메타 — 모드와 생성일을 우측에 한 덩어리로 묶는다. */}
      <View style={styles.meta}>
        <ModeBadge mode={mode} variant="chip" />
        <ThemedText type="caption" color="tertiary">
          {date}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  champHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  champIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  meta: {
    alignItems: "flex-end",
    gap: Spacing.one,
  },
  champMeta: {
    flex: 1,
    gap: Spacing.one,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
  },
  tagChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
});
