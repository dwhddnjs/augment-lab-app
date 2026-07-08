/**
 * ChampionSelectScreen — Android.
 * 닫기+타이틀은 headerLeft에 통합(기본 툴바는 back 화살표와 타이틀 간격이 넓다),
 * 시작은 하단 고정 CTA 바(Material 관례).
 * (SF Symbol 헤더 버튼은 Android에서 렌더되지 않고, iOS의 스크롤 시
 * cancelSearch는 Android에선 검색어까지 지워 결과가 리셋되므로 쓰지 않는다)
 * 공용 로직은 use-champion-select, 본문은 ChampionSelectGrid.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ChampionSelectGrid } from "../components/champion-select-grid";
import { useChampionSelect } from "../hooks/use-champion-select";

export function ChampionSelectScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    translate,
    selectedId,
    selectedTag,
    listData,
    setQuery,
    handleSelect,
    handleTagPress,
    handleStart,
  } = useChampionSelect();

  return (
    <>
      <Stack.Screen
        options={{
          // 기본 툴바 title 대신 back+타이틀을 좁은 간격으로 직접 배치한다.
          headerTitle: () => null,
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={colors.text.primary}
                />
              </Pressable>
              <ThemedText type="heading">{translate("title")}</ThemedText>
            </View>
          ),
          headerSearchBarOptions: {
            placeholder: translate("searchPlaceholder"),
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            textColor: colors.text.primary,
            tintColor: colors.accent.default,
            // 돋보기/힌트 색을 테마에 맞춘다(기본값은 다크에서 안 보인다)
            headerIconColor: colors.text.primary,
            hintTextColor: colors.text.tertiary,
          },
        }}
      />

      <ChampionSelectGrid
        listData={listData}
        selectedId={selectedId}
        selectedTag={selectedTag}
        onSelect={handleSelect}
        onTagPress={handleTagPress}
      />

      {/* 하단 시작 CTA — FlatList(flex:1) 아래 일반 플로우로 놓여 리스트를 가리지 않는다. */}
      <View
        style={[
          styles.startBar,
          {
            paddingBottom: insets.bottom + Spacing.two,
            backgroundColor: colors.surface.base,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        <Pressable
          onPress={handleStart}
          disabled={!selectedId}
          style={({ pressed }) => [
            styles.startButton,
            {
              backgroundColor: selectedId
                ? colors.accent.default
                : colors.surface.raised,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <ThemedText
            type="body"
            style={{
              color: selectedId ? colors.text.onAccent : colors.text.disabled,
              fontWeight: "700",
            }}
          >
            {translate("start")}
          </ThemedText>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  startBar: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  startButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.double,
    borderRadius: Radius.lg,
  },
});
