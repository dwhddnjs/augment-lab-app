/**
 * MyPageScreen (Android·fallback) — Jetpack Compose(@expo/ui/jetpack-compose) 리스트.
 *
 * universal `@expo/ui`의 List/ListItem에는 색·배경 prop이 없어 앱 테마(강제 다크/라이트)가
 * 반영되지 않는다. 그래서 jetpack-compose의 Surface/Column/Row로 재작성하고 배경·텍스트·
 * 구분선 색을 모두 테마 토큰(`useTheme().colors`)으로 직접 칠한다. `Host`에 `colorScheme={mode}`를
 * 넘겨 Compose 트리의 외관도 앱 선택을 따르게 한다.
 *
 * 테마·언어 선택은 SegmentedButton(단일 선택)으로 제공한다. 화면 타이틀은 (mypage) 스택 헤더가 준다.
 */
import {
  Column,
  HorizontalDivider,
  Host,
  Icon,
  Row,
  SegmentedButton,
  Shape,
  SingleChoiceSegmentedButtonRow,
  Surface,
  Text,
} from "@expo/ui/jetpack-compose";
import {
  background,
  clickable,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  verticalScroll,
} from "@expo/ui/jetpack-compose/modifiers";
import Constants from "expo-constants";
import { openBrowserAsync } from "expo-web-browser";
import { Linking } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useLocale, type Locale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import {
  useThemePreference,
  type ThemePreference,
} from "@/hooks/use-theme-preference";
import { useTranslation } from "@/lib/i18n";

const GITHUB_URL = "https://github.com/dwhddnjs/aram-augment-lab-app";
const FEEDBACK_EMAIL = "syd1215no@gmail.com";

/** 행 앞 아이콘 — Android Material Symbols(XML vector drawable). */
const ICONS = {
  theme: require("@expo/material-symbols/contrast.xml"),
  language: require("@expo/material-symbols/language.xml"),
  version: require("@expo/material-symbols/info.xml"),
  github: require("@expo/material-symbols/code.xml"),
  feedback: require("@expo/material-symbols/feedback.xml"),
};

/** 좌측 아이콘 + 라벨. */
function RowLabel({
  icon,
  label,
  color,
}: {
  icon: number;
  label: string;
  color: string;
}) {
  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{ spacedBy: Spacing.double }}
    >
      <Icon source={icon} tint={color} size={22} />
      <Text color={color} style={{ fontSize: 16 }}>
        {label}
      </Text>
    </Row>
  );
}

function SectionHeader({
  label,
  color,
  topSpacing = 0,
}: {
  label: string;
  color: string;
  topSpacing?: number;
}) {
  return (
    <Text
      color={color}
      style={{ typography: "labelMedium" }}
      modifiers={[
        padding(Spacing.two, Spacing.two + topSpacing, Spacing.two, Spacing.two),
      ]}
    >
      {label}
    </Text>
  );
}

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

export default function MyPageScreen() {
  const translate = useTranslation(t);
  const { colors, mode } = useTheme();
  const { locale, setLocale } = useLocale();
  const { preference, setPreference } = useThemePreference();

  const version = Constants.expoConfig?.version ?? "1.0.0";

  const cardShape = Shape.RoundedCorner({
    cornerRadii: {
      topStart: Radius.lg,
      topEnd: Radius.lg,
      bottomStart: Radius.lg,
      bottomEnd: Radius.lg,
    },
  });

  const segColors = {
    activeContainerColor: colors.accent.subtle,
    activeContentColor: colors.accent.default,
    activeBorderColor: colors.accent.default,
    inactiveContainerColor: colors.surface.raised,
    inactiveContentColor: colors.text.secondary,
    inactiveBorderColor: colors.border.default,
  };

  return (
    <Host style={{ flex: 1 }} colorScheme={mode}>
      <Column
        modifiers={[
          fillMaxSize(),
          background(colors.surface.base),
          verticalScroll(),
          paddingAll(Spacing.three),
        ]}
      >
        {/* 일반 */}
        <SectionHeader label={translate("general")} color={colors.text.tertiary} />
        <Surface color={colors.surface.raised} shape={cardShape}>
          <Column
            modifiers={[fillMaxWidth(), paddingAll(Spacing.double)]}
            verticalArrangement={{ spacedBy: Spacing.double }}
          >
            {/* 테마 */}
            <RowLabel
              icon={ICONS.theme}
              label={translate("theme")}
              color={colors.text.primary}
            />
            <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
              {(["system", "light", "dark"] as ThemePreference[]).map((opt) => {
                const selected = preference === opt;
                return (
                  <SegmentedButton
                    key={opt}
                    selected={selected}
                    onClick={() => setPreference(opt)}
                    colors={segColors}
                  >
                    <SegmentedButton.Label>
                      <Text
                        color={
                          selected ? colors.accent.default : colors.text.secondary
                        }
                        style={{ fontSize: 14 }}
                      >
                        {translate(opt)}
                      </Text>
                    </SegmentedButton.Label>
                  </SegmentedButton>
                );
              })}
            </SingleChoiceSegmentedButtonRow>

            <HorizontalDivider color={colors.border.subtle} />

            {/* 언어 */}
            <RowLabel
              icon={ICONS.language}
              label={translate("language")}
              color={colors.text.primary}
            />
            <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
              {(
                [
                  { value: "ko", label: "한국어" },
                  { value: "en", label: "English" },
                ] as { value: Locale; label: string }[]
              ).map((opt) => {
                const selected = locale === opt.value;
                return (
                  <SegmentedButton
                    key={opt.value}
                    selected={selected}
                    onClick={() => setLocale(opt.value)}
                    colors={segColors}
                  >
                    <SegmentedButton.Label>
                      <Text
                        color={
                          selected ? colors.accent.default : colors.text.secondary
                        }
                        style={{ fontSize: 14 }}
                      >
                        {opt.label}
                      </Text>
                    </SegmentedButton.Label>
                  </SegmentedButton>
                );
              })}
            </SingleChoiceSegmentedButtonRow>
          </Column>
        </Surface>

        {/* 정보 — 일반 섹션과 시각적으로 분리되도록 상단 여백 추가 */}
        <SectionHeader
          label={translate("info")}
          color={colors.text.tertiary}
          topSpacing={Spacing.four}
        />
        <Surface color={colors.surface.raised} shape={cardShape}>
          <Column modifiers={[fillMaxWidth()]}>
            {/* 버전 */}
            <Row
              verticalAlignment="center"
              horizontalArrangement="spaceBetween"
              modifiers={[fillMaxWidth(), paddingAll(Spacing.double)]}
            >
              <RowLabel
                icon={ICONS.version}
                label={translate("version")}
                color={colors.text.primary}
              />
              <Text color={colors.text.secondary} style={{ fontSize: 16 }}>
                {version}
              </Text>
            </Row>

            {/* 정보 divider도 일반 섹션처럼 좌우 인셋(12dp)으로 통일 */}
            <HorizontalDivider
              color={colors.border.subtle}
              modifiers={[padding(Spacing.double, 0, Spacing.double, 0)]}
            />

            {/* GitHub */}
            <Row
              verticalAlignment="center"
              modifiers={[
                fillMaxWidth(),
                clickable(() => openBrowserAsync(GITHUB_URL)),
                paddingAll(Spacing.double),
              ]}
            >
              <RowLabel
                icon={ICONS.github}
                label={translate("github")}
                color={colors.text.primary}
              />
            </Row>

            <HorizontalDivider
              color={colors.border.subtle}
              modifiers={[padding(Spacing.double, 0, Spacing.double, 0)]}
            />

            {/* 피드백 */}
            <Row
              verticalAlignment="center"
              modifiers={[
                fillMaxWidth(),
                clickable(() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}`)),
                paddingAll(Spacing.double),
              ]}
            >
              <RowLabel
                icon={ICONS.feedback}
                label={translate("feedback")}
                color={colors.text.primary}
              />
            </Row>
          </Column>
        </Surface>

        <Text
          color={colors.text.tertiary}
          style={{ fontSize: 12, lineHeight: 16 }}
          modifiers={[paddingAll(Spacing.three)]}
        >
          {translate("disclaimer")}
        </Text>
      </Column>
    </Host>
  );
}
