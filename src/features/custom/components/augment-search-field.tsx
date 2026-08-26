/**
 * AugmentSearchField — 커스텀 화면 헤더 가운데의 증강 이름 검색 입력.
 *
 * RN TextInput 을 쓰는 이유: 이 헤더는 네이티브 Stack 헤더가 아니라 transform 으로
 * 움직이는 <Drawer> 안의 커스텀 View 다. SwiftUI TextField Host 를 넣으면 포커스·
 * 키보드 앵커가 drawer 변환과 얽힌다(같은 화면의 챔피언 변경 오버레이도 RN 입력이다).
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { GlassSurface } from "@/components/ui/glass-surface";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: { placeholder: "증강 이름을 입력해주세요" },
  en: { placeholder: "Search augments by name" },
};

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export function AugmentSearchField({ value, onChange }: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t);

  return (
    <GlassSurface glassStyle="regular" style={styles.container}>
      <MaterialCommunityIcons
        name="magnify"
        size={15}
        color={colors.text.tertiary}
      />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={translate("placeholder")}
        placeholderTextColor={colors.text.tertiary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={[styles.input, { color: colors.text.primary }]}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange("")} hitSlop={8}>
          <MaterialCommunityIcons
            name="close-circle"
            size={14}
            color={colors.text.tertiary}
          />
        </Pressable>
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // 가로 화면이라 제한이 없으면 헤더 전체로 늘어난다.
    maxWidth: 300,
    // 44 원형 버튼 사이에서 눌리지 않을 만큼만. 테두리는 글래스 림에 맡긴다.
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.double,
    borderRadius: Radius.full,
  },
  input: { flex: 1, minWidth: 0, fontSize: 13, padding: 0 },
});
