import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { HeroOverlay, Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { COMMAND_LINE_LOGO_LIGHT, HEADLINER_LOGOS, KDA_MARK } from "../assets";
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
  /** 판 없이 로고만 그린다(헤더). */
  plain?: boolean;
}

/** 로고는 대부분 흰색이라 기본은 라이트 모드에서도 보이도록 어두운 판 위에 그린다. */
export function HeadlinerLogo({ id, size, plain }: Props) {
  const { colors, mode } = useTheme();

  if (plain) {
    const light = mode === "light";
    return (
      <Image
        source={
          id === "kda"
            ? KDA_MARK
            : light && id === "command-line"
              ? COMMAND_LINE_LOGO_LIGHT
              : HEADLINER_LOGOS[id]
        }
        // K/DA 로고만 가로로 길어 정사각형에 넣으면 글자가 뭉개진다.
        style={{ width: id === "kda" ? size * 1.65 : size, height: size }}
        contentFit="contain"
        tintColor={light && WHITE_LOGOS.includes(id) ? colors.text.primary : undefined}
      />
    );
  }

  return (
    <View style={[styles.plate, { width: size, height: size, padding: size * 0.12 }]}>
      <Image source={HEADLINER_LOGOS[id]} style={styles.logo} contentFit="contain" />
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
