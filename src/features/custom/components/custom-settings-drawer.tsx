/**
 * CustomSettingsDrawer — 커스텀 화면 우측 설정 서랍.
 *
 * 폭·좌우 인셋은 List(insetGrouped)에 맡긴다 — Host 안에서 VStack 으로 직접 짜면
 * 세그먼트가 제 글자 폭까지 쪼그라들고(제안 폭을 강제하지 않는다) RN 쪽 padding 도
 * SwiftUI 콘텐츠를 밀지 못해 드로어 밖으로 샜다.
 *
 * 대신 "제목+컨트롤"을 한 행 안의 VStack 으로 묶는다. 섹션 header 슬롯을 쓰면
 * 제목↔컨트롤 간격이 그룹 사이 간격과 같아져(둘 다 30pt 안팎) 묶음이 안 읽혔다.
 *
 * Picker 는 반드시 segmented — 기본(menu) 스타일은 popover 를 띄우는데 drawer 는
 * transform 으로 움직이는 뷰라 앵커가 어긋난다.
 */
import {
  Host,
  List,
  Picker,
  Section,
  Text,
  Toggle,
  VStack,
} from "@expo/ui/swift-ui";
import {
  background,
  font,
  foregroundStyle,
  listRowBackground,
  listRowSeparator,
  listStyle,
  pickerStyle,
  scrollContentBackground,
  scrollIndicators,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MODE_LABELS } from "@/constants/game-modes";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { DraftMode } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import type { SortKey, useCustomDraft } from "../hooks/use-custom-draft";

const t = {
  ko: {
    mode: "모드",
    control: "조작",
    quick: "퀵모드",
    sortTitle: "정렬",
    sortDefault: "기본",
    sortName: "이름순",
    sortRarity: "티어순",
    ...MODE_LABELS.ko,
  },
  en: {
    mode: "Mode",
    control: "Control",
    quick: "Quick pick",
    sortTitle: "Sort",
    sortDefault: "Default",
    sortName: "Name",
    sortRarity: "Tier",
    ...MODE_LABELS.en,
  },
};

const SORT_TAGS: SortKey[] = ["default", "name", "rarity"];
const SORT_LABEL_KEYS: Record<SortKey, string> = {
  default: "sortDefault",
  name: "sortName",
  rarity: "sortRarity",
};

/** 제목↔컨트롤은 붙이고 그룹 사이만 벌린다 — 이 차이가 묶음을 만든다. */
const TITLE_GAP = Spacing.two;

interface Props {
  draft: ReturnType<typeof useCustomDraft>;
}

export function CustomSettingsDrawer({ draft }: Props) {
  const { colors, mode: themeMode } = useTheme();
  const translate = useTranslation(t) as (key: string) => string;

  const pickerModifiers = [
    pickerStyle("segmented"),
    tint(colors.accent.default),
  ];
  /** 세그먼트 글자와 같은 13pt. 기본 body(17pt)는 이 폭에서 과하다. */
  const rowFont = font({ textStyle: "footnote" });

  /** 제목 + 컨트롤 한 묶음. 행 카드는 벗긴다 — 컨트롤이 스스로 배경을 그린다. */
  const group = (key: string, control: ReactNode) => (
    <VStack
      alignment="leading"
      spacing={TITLE_GAP}
      modifiers={[listRowBackground("clear"), listRowSeparator("hidden")]}
    >
      <Text
        modifiers={[
          font({ textStyle: "caption" }),
          foregroundStyle({ type: "color", color: colors.text.secondary }),
        ]}
      >
        {translate(key)}
      </Text>
      {control}
    </VStack>
  );

  return (
    // 우측 inset 을 빼는 이유는 picked-drawer 와 같다 — 넣으면 유령 여백이 생긴다.
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* key={themeMode} — expo-ui가 SwiftUI Picker의 tint를 런타임 테마 변경 시
          갱신하지 않아, 모드가 바뀌면 Host를 remount해 강제 반영(mypage와 동일). */}
      {/* ignoreSafeArea — 드로어가 화면 trailing 끝에 붙어 있어 Host 가 창의
          안전영역을 그대로 물고 들어와 컨트롤이 오른쪽 60pt 를 못 쓴다. */}
      <Host
        key={themeMode}
        style={styles.host}
        colorScheme={themeMode}
        ignoreSafeArea="all"
      >
        <List
          modifiers={[
            listStyle("insetGrouped"),
            scrollContentBackground("hidden"),
            scrollIndicators("hidden"),
            background(colors.surface.base),
          ]}
        >
          {/* 한 Section 안에 묶는다 — 섹션을 나누면 그룹 사이가 40pt 넘게 벌어진다. */}
          <Section>
            {/* 아레나는 증강 체계(레벨업·재련)가 달라 제외한다. */}
            {group(
              "mode",
              <Picker
                selection={draft.mode}
                onSelectionChange={(next) => draft.setMode(next as DraftMode)}
                modifiers={pickerModifiers}
              >
                <Text modifiers={[tag("aram")]}>{translate("aram")}</Text>
                <Text modifiers={[tag("classic")]}>{translate("classic")}</Text>
              </Picker>,
            )}

            {group(
              "control",
              <Toggle
                isOn={draft.quickMode}
                onIsOnChange={draft.setQuickMode}
                modifiers={[tint(colors.accent.default)]}
              >
                <Text modifiers={[rowFont]}>{translate("quick")}</Text>
              </Toggle>,
            )}

            {group(
              "sortTitle",
              <Picker
                selection={draft.sort}
                onSelectionChange={(next) => draft.setSort(next as SortKey)}
                modifiers={pickerModifiers}
              >
                {SORT_TAGS.map((key) => (
                  <Text key={key} modifiers={[tag(key)]}>
                    {translate(SORT_LABEL_KEYS[key])}
                  </Text>
                ))}
              </Picker>,
            )}
          </Section>
        </List>
      </Host>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // 첫 섹션이 드로어 천장에 붙지 않도록.
  host: { flex: 1, paddingTop: Spacing.four },
});
