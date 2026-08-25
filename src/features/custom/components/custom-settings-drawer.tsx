/**
 * CustomSettingsDrawer — 커스텀 화면 우측 설정 서랍.
 *
 * 내용이 정확히 "설정 폼"이라 RN 으로 그리지 않고 swift-ui List(insetGrouped)를 쓴다.
 * drawer content 는 평범한 RN View 이고 SwiftUI Host 는 그 안에서 UIView 서브트리로
 * 사니 가로/세로와 무관하다(고정 폭 컨테이너라 Host 가 구체 크기를 받는다).
 *
 * Picker 는 반드시 segmented — 기본(menu) 스타일은 popover 를 띄우는데 drawer 는
 * transform 으로 움직이는 뷰라 앵커가 어긋난다.
 */
import { Host, List, Picker, Section, Text, Toggle } from "@expo/ui/swift-ui";
import {
  background,
  listRowBackground,
  listStyle,
  pickerStyle,
  scrollContentBackground,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SettingsRow } from "@/components/ui/settings-row";
import { MODE_LABELS } from "@/constants/game-modes";
import { useTheme } from "@/hooks/use-theme";
import type { DraftMode } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import type {
  PickLimit,
  SortKey,
  useCustomDraft,
} from "../hooks/use-custom-draft";

const t = {
  ko: {
    mode: "모드",
    control: "조작",
    quick: "퀵모드",
    limitTitle: "증강 개수",
    unlimited: "무제한",
    sortTitle: "정렬",
    sortDefault: "기본",
    sortName: "이름순",
    sortRarity: "티어순",
    reset: "선택 초기화",
    changeChampion: "챔피언 변경",
    ...MODE_LABELS.ko,
  },
  en: {
    mode: "Mode",
    control: "Control",
    quick: "Quick pick",
    limitTitle: "Augment limit",
    unlimited: "None",
    sortTitle: "Sort",
    sortDefault: "Default",
    sortName: "Name",
    sortRarity: "Tier",
    reset: "Clear picks",
    changeChampion: "Change champion",
    ...MODE_LABELS.en,
  },
};

/** Picker tag 는 문자열만 쓴다 — limit 의 null 을 태그로 실어 보내지 않기 위해. */
const LIMIT_TAGS = ["4", "5", "6", "none"] as const;
const SORT_TAGS: SortKey[] = ["default", "name", "rarity"];
const SORT_LABEL_KEYS: Record<SortKey, string> = {
  default: "sortDefault",
  name: "sortName",
  rarity: "sortRarity",
};

interface Props {
  draft: ReturnType<typeof useCustomDraft>;
  onChangeChampion: () => void;
}

export function CustomSettingsDrawer({ draft, onChangeChampion }: Props) {
  const { colors, mode: themeMode } = useTheme();
  const translate = useTranslation(t) as (key: string) => string;

  const rowBg = colors.surface.raised;
  const pickerModifiers = [
    pickerStyle("segmented"),
    tint(colors.accent.default),
    listRowBackground(rowBg),
  ];

  return (
    // 우측 inset 을 빼는 이유는 picked-drawer 와 같다 — 넣으면 유령 여백이 생긴다.
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* key={themeMode} — expo-ui가 SwiftUI Picker의 tint를 런타임 테마 변경 시
          갱신하지 않아, 모드가 바뀌면 Host를 remount해 강제 반영(mypage와 동일). */}
      <Host key={themeMode} style={styles.host} colorScheme={themeMode}>
        <List
          modifiers={[
            listStyle("insetGrouped"),
            scrollContentBackground("hidden"),
            background(colors.surface.base),
          ]}
        >
          {/* 아레나는 증강 체계(레벨업·재련)가 달라 제외한다. */}
          <Section title={translate("mode")}>
            <Picker
              selection={draft.mode}
              onSelectionChange={(next) => draft.setMode(next as DraftMode)}
              modifiers={pickerModifiers}
            >
              <Text modifiers={[tag("aram")]}>{translate("aram")}</Text>
              <Text modifiers={[tag("classic")]}>{translate("classic")}</Text>
            </Picker>
          </Section>

          <Section title={translate("control")}>
            <Toggle
              label={translate("quick")}
              isOn={draft.quickMode}
              onIsOnChange={draft.setQuickMode}
              modifiers={[tint(colors.accent.default), listRowBackground(rowBg)]}
            />
          </Section>

          {/* 클래식 5는 "바론 간식 10개" 룰에 근거가 있지만, 커스텀은 자유도가 취지라
              모드로 옵션을 잠그지 않고 항상 4/5/6/무제한을 노출한다. */}
          <Section title={translate("limitTitle")}>
            <Picker
              selection={draft.limit === null ? "none" : String(draft.limit)}
              onSelectionChange={(next) =>
                draft.setLimit(
                  next === "none" ? null : (Number(next) as PickLimit),
                )
              }
              modifiers={pickerModifiers}
            >
              {LIMIT_TAGS.map((key) => (
                <Text key={key} modifiers={[tag(key)]}>
                  {key === "none" ? translate("unlimited") : key}
                </Text>
              ))}
            </Picker>
          </Section>

          <Section title={translate("sortTitle")}>
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
            </Picker>
          </Section>

          <Section>
            <SettingsRow
              label={translate("changeChampion")}
              icon="person.crop.circle"
              iconColor={colors.text.primary}
              onPress={onChangeChampion}
              rowBackgroundColor={rowBg}
            />
            <SettingsRow
              label={translate("reset")}
              icon="trash"
              iconColor={colors.status.danger.default}
              labelColor={colors.status.danger.default}
              onPress={draft.clear}
              rowBackgroundColor={rowBg}
            />
          </Section>
        </List>
      </Host>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  host: { flex: 1 },
});
