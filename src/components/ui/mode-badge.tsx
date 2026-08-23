/**
 * ModeBadge — 저장된 빌드가 어느 모드인지 알려주는 마킹.
 *
 * `onHero`  : 아이콘만. 챔피언 splash 위에 얹는 카드 우상단용 — 라이트/다크 무관하게
 *             HeroOverlay 고정 톤을 쓴다(카드 안은 항상 어두운 이미지 위라서).
 * `chip`    : 아이콘 + 라벨. 빌드 상세의 챔피언 헤더용 — 옆의 역할 태그 칩과 같은 모양.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
import { MODE_ICONS, MODE_LABELS } from "@/constants/game-modes";
import { useTheme } from "@/hooks/use-theme";
import type { GameMode } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";

interface Props {
  mode: GameMode;
  variant: "onHero" | "chip";
}

export function ModeBadge({ mode, variant }: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(MODE_LABELS);

  if (variant === "onHero") {
    return (
      <View
        style={[
          styles.hero,
          {
            backgroundColor: HeroOverlay.chipBg,
            borderColor: HeroOverlay.tileBorder,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={MODE_ICONS[mode]}
          size={16}
          color={HeroOverlay.textPrimary}
        />
      </View>
    );
  }

  return (
    <View style={[styles.chip, { backgroundColor: colors.accent.subtle }]}>
      <MaterialCommunityIcons
        name={MODE_ICONS[mode]}
        size={13}
        color={colors.accent.default}
      />
      <ThemedText type="caption" style={{ color: colors.accent.default }}>
        {translate(mode)}
      </ThemedText>
    </View>
  );
}

const HERO = 28;

const styles = StyleSheet.create({
  hero: {
    width: HERO,
    height: HERO,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
});
