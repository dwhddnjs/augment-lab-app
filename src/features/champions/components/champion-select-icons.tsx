/**
 * 챔피언 선택 그리드 아이콘 — SF Symbol (expo-image "sf:" 소스).
 */
import { Image } from "expo-image";
import { StyleSheet } from "react-native";

/** 전체 필터칩 아이콘 */
export function FilterAllIcon({ color }: { color: string }) {
  return (
    <Image
      source="sf:square.grid.2x2.fill"
      style={styles.chipIcon}
      tintColor={color}
    />
  );
}

const styles = StyleSheet.create({
  chipIcon: {
    width: 24,
    height: 24,
  },
});
