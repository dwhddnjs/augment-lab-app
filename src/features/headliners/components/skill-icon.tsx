import { StyleSheet, Text, View } from "react-native";

import { RemoteImage } from "@/components/ui/remote-image";
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
import type { ChampionSpell } from "@/features/champions/types";
import { spellImageUrl } from "@/lib/ddragon";
import type { SkillKey } from "../types";

interface Props {
  spell?: ChampionSpell;
  skill: SkillKey;
  size: number;
}

/** 챔피언 스킬 아이콘 + Q/W/E/R 키 배지. 이미지가 없거나 실패해도 어느 스킬인지는 읽힌다. */
export function SkillIcon({ spell, skill, size }: Props) {
  const badge = Math.round(size * 0.42);
  return (
    <View style={[styles.plate, { width: size, height: size }]}>
      {spell && (
        <RemoteImage
          uri={spellImageUrl(spell.image)}
          size={size}
          style={styles.image}
          accessibilityLabel={spell.name}
        />
      )}
      <View style={[styles.badge, { width: badge, height: badge }]}>
        <Text
          allowFontScaling={false}
          style={[styles.key, { fontSize: Math.round(badge * 0.6) }]}
        >
          {skill.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: HeroOverlay.cardBase,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  image: {
    borderRadius: Radius.md,
  },
  badge: {
    position: "absolute",
    right: -Spacing.one,
    bottom: -Spacing.one,
    backgroundColor: HeroOverlay.cardBase,
    borderColor: HeroOverlay.textSecondary,
    borderWidth: 1,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  key: {
    color: HeroOverlay.textPrimary,
    fontWeight: "800",
  },
});
