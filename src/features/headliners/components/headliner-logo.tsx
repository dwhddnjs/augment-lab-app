import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { HeroOverlay, Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { HEADLINER_LOGOS } from "../assets";
import type { HeadlinerId } from "../types";

// 흰색 로고. 판 없이 그리면 라이트 모드에서 배경에 묻힌다.
// HEARTSTEEL 은 검은 윤곽이 있어 그대로 보이고, 칠하면 글자와 윤곽이 합쳐진다.
const WHITE_LOGOS: HeadlinerId[] = [
  "true-damage",
  "disco",
  "cafe-cuties",
];

interface Props {
  id: HeadlinerId;
  size: number;
  /** 판 없이 로고만 그린다(헤더). size 는 상자 높이다 — 폭은 로고의 aspect 를 따른다. */
  plain?: boolean;
}

/** 로고는 대부분 흰색이라 기본은 라이트 모드에서도 보이도록 어두운 판 위에 그린다. */
export function HeadlinerLogo({ id, size, plain }: Props) {
  const { colors, mode } = useTheme();
  const { source, light, aspect = 1 } = HEADLINER_LOGOS[id];

  if (plain) {
    const isLight = mode === "light";
    return (
      <Image
        // 라이트 전용 그림이 있으면(금색 커맨드 라인) 칠하지 않고 그걸로 바꾼다.
        source={(isLight && light) || source}
        style={{ width: size * aspect, height: size }}
        contentFit="contain"
        tintColor={isLight && WHITE_LOGOS.includes(id) ? colors.text.primary : undefined}
      />
    );
  }

  return (
    <View style={[styles.plate, { width: size, height: size, padding: size * 0.12 }]}>
      <Image source={source} style={styles.logo} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: HeroOverlay.cardBase,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  logo: {
    flex: 1,
  },
});
