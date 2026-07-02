/**
 * MyPageScreen (iOS) — 진짜 iOS 설정앱 룩의 마이페이지.
 * swift-ui `List(insetGrouped)` + `Section`(섹션 헤더) + `Picker`로 구성.
 * 화면 타이틀은 (mypage) 스택의 native large-title 헤더가 제공한다.
 *
 * 색은 시스템 시맨틱(secondaryLabel/tertiaryLabel — 다크모드 자동)과 테마 토큰만 사용.
 */
import {
  Button,
  HStack,
  Host,
  Image,
  List,
  Picker,
  Section,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import {
  background,
  buttonStyle,
  contentShape,
  foregroundStyle,
  frame,
  listRowBackground,
  listStyle,
  scrollContentBackground,
  shapes,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import Constants from "expo-constants";
import { openBrowserAsync } from "expo-web-browser";
import { Linking } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { useLocale, type Locale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import {
  useThemePreference,
  type ThemePreference,
} from "@/hooks/use-theme-preference";
import { useTranslation } from "@/lib/i18n";

const GITHUB_URL = "https://github.com/dwhddnjs/aram-augment-lab-app";
const FEEDBACK_EMAIL = "syd1215no@gmail.com";

const t = {
  ko: {
    general: "일반",
    theme: "테마",
    system: "시스템",
    light: "라이트",
    dark: "다크",
    language: "언어",
    info: "정보",
    version: "버전",
    github: "GitHub",
    feedback: "피드백 보내기",
    disclaimer:
      "이 앱은 Riot Games가 제작·후원·승인하지 않은 비공식 앱입니다. League of Legends 및 Riot Games는 Riot Games, Inc.의 상표 또는 등록 상표입니다.",
  },
  en: {
    general: "General",
    theme: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
    language: "Language",
    info: "About",
    version: "Version",
    github: "GitHub",
    feedback: "Send feedback",
    disclaimer:
      "This app is unofficial and is not endorsed by, sponsored by, or affiliated with Riot Games. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.",
  },
};

/** 아이콘 + 라벨 행 헤드. Picker `label` 슬롯에 넣어 leading 아이콘 색을 tint와 무관하게 고정한다. */
function RowLabel({
  icon,
  label,
  iconColor,
}: {
  icon: SFSymbol;
  label: string;
  iconColor: string;
}) {
  return (
    <HStack spacing={12}>
      <Image
        systemName={icon}
        size={17}
        modifiers={[
          foregroundStyle({ type: "color", color: iconColor }),
          frame({ width: 26 }),
        ]}
      />
      <Text>{label}</Text>
    </HStack>
  );
}

/** 좌측 아이콘 + 라벨 + 우측 값/disclosure chevron 행. onPress 없으면 비활성(정적 값). */
function SettingsRow({
  label,
  value,
  icon,
  iconColor,
  onPress,
  rowBackgroundColor,
}: {
  label: string;
  value?: string;
  icon: SFSymbol;
  iconColor: string;
  onPress?: () => void;
  rowBackgroundColor: string;
}) {
  return (
    <Button
      onPress={onPress}
      modifiers={[buttonStyle("plain"), listRowBackground(rowBackgroundColor)]}
    >
      <HStack spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
        <Image
          systemName={icon}
          size={17}
          modifiers={[
            foregroundStyle({ type: "color", color: iconColor }),
            frame({ width: 26 }),
          ]}
        />
        <Text>{label}</Text>
        <Spacer />
        {value ? (
          <Text
            modifiers={[
              foregroundStyle({ type: "color", color: "secondaryLabel" }),
            ]}
          >
            {value}
          </Text>
        ) : null}
        {onPress ? (
          <Image
            systemName="chevron.right"
            size={13}
            modifiers={[
              foregroundStyle({ type: "color", color: "tertiaryLabel" }),
            ]}
          />
        ) : null}
      </HStack>
    </Button>
  );
}

export default function MyPageScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const { locale, setLocale } = useLocale();
  const { preference, setPreference } = useThemePreference();

  const version = Constants.expoConfig?.version ?? "1.0.0";

  const rowBg = colors.surface.raised;
  const pickerModifiers = [
    tint(colors.accent.default),
    listRowBackground(rowBg),
  ];

  return (
    <Host style={{ flex: 1 }}>
      <List
        modifiers={[
          listStyle("insetGrouped"),
          scrollContentBackground("hidden"),
          background(colors.surface.base),
        ]}
      >
        <Section title={translate("general")}>
          <Picker
            label={
              <RowLabel
                icon="circle.lefthalf.filled"
                label={translate("theme")}
                iconColor={colors.text.primary}
              />
            }
            selection={preference}
            onSelectionChange={(next) => setPreference(next as ThemePreference)}
            modifiers={pickerModifiers}
          >
            <Text modifiers={[tag("system")]}>{translate("system")}</Text>
            <Text modifiers={[tag("light")]}>{translate("light")}</Text>
            <Text modifiers={[tag("dark")]}>{translate("dark")}</Text>
          </Picker>
          <Picker
            label={
              <RowLabel
                icon="globe"
                label={translate("language")}
                iconColor={colors.text.primary}
              />
            }
            selection={locale}
            onSelectionChange={(next) => setLocale(next as Locale)}
            modifiers={pickerModifiers}
          >
            <Text modifiers={[tag("ko")]}>한국어</Text>
            <Text modifiers={[tag("en")]}>English</Text>
          </Picker>
        </Section>

        <Section
          title={translate("info")}
          footer={<Text>{translate("disclaimer")}</Text>}
        >
          <SettingsRow
            label={translate("version")}
            value={version}
            icon="info.circle"
            iconColor={colors.text.primary}
            rowBackgroundColor={rowBg}
          />
          <SettingsRow
            label={translate("github")}
            icon="chevron.left.forwardslash.chevron.right"
            iconColor={colors.text.primary}
            onPress={() => openBrowserAsync(GITHUB_URL)}
            rowBackgroundColor={rowBg}
          />
          <SettingsRow
            label={translate("feedback")}
            icon="envelope"
            iconColor={colors.text.primary}
            onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}`)}
            rowBackgroundColor={rowBg}
          />
        </Section>
      </List>
    </Host>
  );
}
