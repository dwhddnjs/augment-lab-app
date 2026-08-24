/**
 * ShopCell — 상점 그리드의 셀 한 칸(아이템·신발·모루 공용).
 * 아이콘 + 가격 한 줄. 보유 중이면 테두리를 강조하고, 살 수 없으면 흐리게 죽인다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { ArenaGold, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface Props {
  uri: string;
  recyclingKey: string;
  price: number;
  /** 보유 중 — 테두리를 accent 로 올린다(재탭하면 되돌리기). */
  owned?: boolean;
  disabled?: boolean;
  /** 비활성 시 흐림 정도. */
  opacity?: number;
  contentFit?: "cover" | "contain";
  onPress: () => void;
}

export function ShopCell({
  uri,
  recyclingKey,
  price,
  owned,
  disabled,
  opacity = 1,
  contentFit = "cover",
  onPress,
}: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.cell, { opacity }]}
    >
      <RemoteImage
        uri={uri}
        recyclingKey={recyclingKey}
        style={[
          styles.icon,
          { borderColor: owned ? colors.accent.default : colors.border.subtle },
        ]}
        contentFit={contentFit}
      />
      <View style={styles.priceRow}>
        <MaterialCommunityIcons
          name="circle-multiple"
          size={10}
          color={ArenaGold}
        />
        <ThemedText style={styles.price}>{price.toLocaleString()}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: "center",
    gap: Spacing.half,
    width: 44,
  },
  // 아이템 아이콘 소스가 64px라 표시를 작게 둘수록 업스케일이 줄어 선명하다.
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  price: {
    fontSize: 11,
    fontWeight: "700",
    color: ArenaGold,
  },
});
