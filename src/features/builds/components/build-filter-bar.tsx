/**
 * BuildFilterBar — 홈 빌드 그리드 위 네이티브 세그먼트(전체·최근 7일·프리즘·커스텀).
 * 세그먼트는 Host 에 준 폭을 그대로 채운다 — Host 높이만 고정한다.
 */
import { Host, Picker, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag, tint } from "@expo/ui/swift-ui/modifiers";
import { StyleSheet } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";

export const BUILD_FILTERS = ["all", "week", "prismatic", "custom"] as const;
export type BuildFilter = (typeof BUILD_FILTERS)[number];

const t = {
  ko: { all: "전체", week: "최근 7일", prismatic: "프리즘", custom: "커스텀" },
  en: { all: "All", week: "7 days", prismatic: "Prismatic", custom: "Custom" },
};

interface Props {
  value: BuildFilter;
  onChange: (next: BuildFilter) => void;
}

export function BuildFilterBar({ value, onChange }: Props) {
  const { colors, mode } = useTheme();
  const translate = useTranslation(t);

  return (
    // key={mode} — expo-ui 가 런타임 테마 변경 때 tint 를 갱신하지 않아 remount 로 반영한다(mypage 와 같다).
    <Host key={mode} colorScheme={mode} style={styles.host}>
      <Picker
        selection={value}
        onSelectionChange={(next) => onChange(next as BuildFilter)}
        modifiers={[pickerStyle("segmented"), tint(colors.accent.default)]}
      >
        {BUILD_FILTERS.map((key) => (
          <Text key={key} modifiers={[tag(key)]}>
            {translate(key)}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}

const styles = StyleSheet.create({
  // iOS 기본 세그먼트 높이(32pt).
  host: { height: 32 },
});
