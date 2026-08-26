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
import { GlassSurface } from "@/components/ui/glass-surface";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl } from "@/lib/ddragon";
import { matchName } from "@/lib/hangul";
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
    .filter((c) => matchName(c.name, query))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  // 하한을 둔다 — 시트가 좁아지면 (gridW - 56)/8 이 음수가 되어 셀이 뒤집힌다.
  const cell =
    gridW > 0 ? Math.max(32, Math.floor((gridW - GAP * (COLS - 1)) / COLS)) : 48;

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.surface.overlay }]}>
      {/* 배경 탭 → 취소 */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* 세로 inset 은 먹지 않는다 — bottom(홈 인디케이터 21pt)을 먹으면 시트가
          그만큼 위로 쏠려 화면 한가운데가 아니게 된다. 가로만 노치를 피한다. */}
      <SafeAreaView
        style={styles.safe}
        edges={["left", "right"]}
        pointerEvents="box-none"
      >
        {/* 화면 위에 떠 있는 표면이라 단색이 아니라 글라스 — design-system 규칙. */}
        <GlassSurface
          glassStyle="regular"
          style={[styles.sheet, { borderColor: colors.border.subtle }]}
        >
          <View style={styles.header}>
            <ThemedText type="label">{translate("title")}</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText type="label">✕</ThemedText>
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
        </GlassSurface>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill },
  // 시트를 화면 한가운데 띄운다 — flex:1 로 두면 안전영역만큼 위로 쏠린 풀스크린이 된다.
  safe: {
    flex: 1,
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
  },

  sheet: {
    width: "100%",
    height: "90%",
    borderWidth: 1,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    // 하단은 비운다 — 리스트가 시트 끝까지 흘러야 스크롤 중 잘린 느낌이 안 난다.
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // 검색 입력과 붙지 않게.
    marginBottom: Spacing.two,
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
  gridContent: { gap: GAP },
  gridRow: { gap: GAP },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  icon: { borderRadius: Radius.md, overflow: "hidden" },
  name: { fontSize: 9, lineHeight: 11, textAlign: "center" },
});
