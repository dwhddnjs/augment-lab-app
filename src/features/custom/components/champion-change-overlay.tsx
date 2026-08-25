/**
 * ChampionChangeOverlay — 화면을 나가지 않고 챔피언만 바꾸는 가로형 오버레이.
 *
 * 챔피언 선택 모달(/select-champion-modal)을 push 하지 않는 이유:
 * expo-router 에 반환값 API 가 없어 결과를 받으려면 전역 스토어가 필요하고, 가로 잠금
 * 위에 모달을 present 하면 native large-title·검색바가 뭉개지며 orientation 잠금이
 * 풀리는 알려진 구간에 들어간다. 무엇보다 돌아올 때 /custom 이 remount 되면 담아둔
 * 증강이 전부 날아간다.
 *
 * ChampionSelectGrid 도 재사용하지 않는다 — numColumns={4}·셀 width 25%·native
 * large-title 스크롤 연동 전제라 가로에서 셀이 괴물이 된다.
 */
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl } from "@/lib/ddragon";
import { matchChampionName } from "@/lib/hangul";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: { title: "챔피언 변경", search: "챔피언 검색 (초성 가능)", empty: "결과 없음" },
  en: { title: "Change champion", search: "Search champions", empty: "No results" },
};

const COLS = 8;
const GAP = Spacing.two;

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ChampionChangeOverlay({
  selectedId,
  onSelect,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const translate = useTranslation(t);
  const champions = useChampions();
  const [query, setQuery] = useState("");
  const [gridW, setGridW] = useState(0);

  const filtered = champions
    .filter((c) => matchChampionName(c.name, query))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  const cell =
    gridW > 0 ? Math.floor((gridW - GAP * (COLS - 1)) / COLS) : 48;

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.surface.overlay }]}>
      {/* 배경 탭 → 취소 */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <SafeAreaView
        style={styles.safe}
        edges={["top", "bottom", "left", "right"]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface.base,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <View style={styles.header}>
            <ThemedText type="label">{translate("title")}</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText type="label" color="accent">
                ✕
              </ThemedText>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={translate("search")}
            placeholderTextColor={colors.text.tertiary}
            autoCorrect={false}
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: colors.surface.sunken,
                borderColor: colors.border.subtle,
                color: colors.text.primary,
              },
            ]}
          />

          <View style={styles.gridArea} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <ThemedText type="caption" color="tertiary">
                  {translate("empty")}
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={filtered}
                numColumns={COLS}
                keyExtractor={(c) => c.id}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <Pressable
                      onPress={() => onSelect(item.id)}
                      style={({ pressed }) => ({
                        width: cell,
                        opacity: pressed ? 0.7 : 1,
                        alignItems: "center",
                        gap: 2,
                      })}
                    >
                      <RemoteImage
                        uri={championSquareUrl(item.imageKey)}
                        recyclingKey={item.id}
                        style={[
                          styles.icon,
                          {
                            width: cell,
                            height: cell,
                            borderWidth: isSelected ? 2.5 : 1,
                            borderColor: isSelected
                              ? colors.accent.default
                              : colors.border.subtle,
                          },
                        ]}
                        contentFit="cover"
                      />
                      <ThemedText
                        numberOfLines={1}
                        color={isSelected ? "accent" : "tertiary"}
                        style={styles.name}
                      >
                        {item.name}
                      </ThemedText>
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill },
  safe: { flex: 1, padding: Spacing.three },

  sheet: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    height: 36,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderCurve: "continuous",
    paddingHorizontal: Spacing.two,
    fontSize: 14,
  },
  gridArea: { flex: 1, minWidth: 0 },
  gridContent: { gap: GAP, paddingBottom: Spacing.two },
  gridRow: { gap: GAP },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  icon: { borderRadius: Radius.md, overflow: "hidden" },
  name: { fontSize: 9, lineHeight: 11, textAlign: "center" },
});
