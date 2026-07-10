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

/** 아레나 "용기" 박스 안 큰 물음표 */
export function BraveryMark({ color }: { color: string }) {
  return (
    <Image
      source="sf:questionmark"
      style={styles.braveryMark}
      tintColor={color}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  chipIcon: {
    width: 24,
    height: 24,
  },
  // fontWeight로 SF Symbol stroke 두께를 굵게.
  braveryMark: {
    width: 52,
    height: 52,
    fontWeight: "700",
  },
});
