/**
 * ShopCategoryTabs — 상점 좌측 세로 카테고리 탭(신발·전설급·모루).
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";

export type ShopCat = "boots" | "legendary" | "anvil";

const t = {
  ko: { boots: "신발", legendary: "전설급", anvil: "모루" },
  en: { boots: "Boots", legendary: "Legendary", anvil: "Anvil" },
};

const CATS: { key: ShopCat; icon: string }[] = [
  { key: "boots", icon: "shoe-sneaker" },
  { key: "legendary", icon: "sword" },
  { key: "anvil", icon: "anvil" },
];

interface Props {
  active: ShopCat;
  onChange: (cat: ShopCat) => void;
}

export function ShopCategoryTabs({ active, onChange }: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();

  return (
    <View style={styles.tabs}>
      {CATS.map((c) => {
        const on = active === c.key;
        const tint = on ? colors.accent.default : colors.text.secondary;
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            style={[
              styles.tab,
              {
                backgroundColor: on
                  ? colors.accent.subtle
                  : colors.surface.raised,
                borderColor: on ? colors.accent.default : colors.border.subtle,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={c.icon as never}
              size={20}
              color={tint}
            />
            <ThemedText type="caption" style={{ color: tint }} numberOfLines={1}>
              {translate(c.key)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    width: 96,
    gap: Spacing.two,
  },
  tab: {
    alignItems: "center",
    gap: Spacing.half,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.two,
  },
});
