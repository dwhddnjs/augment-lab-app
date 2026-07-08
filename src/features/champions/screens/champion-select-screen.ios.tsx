/**
 * ChampionSelectScreen — iOS.
 * large title 헤더에 SF Symbol 닫기(xmark)/시작(checkmark) 버튼을 박고,
 * 스크롤 시작 시 검색을 종료해 large title 모드로 되돌린다.
 * 공용 로직은 use-champion-select, 본문은 ChampionSelectGrid.
 */
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { ChampionSelectGrid } from "../components/champion-select-grid";
import { useChampionSelect } from "../hooks/use-champion-select";

export function ChampionSelectScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    translate,
    selectedId,
    selectedTag,
    searchRef,
    listData,
    setQuery,
    handleSelect,
    handleTagPress,
    handleStart,
  } = useChampionSelect();

  return (
    <>
      {/* native 헤더 — large title + iOS 네이티브 검색바 + 닫기/시작 버튼 */}
      <Stack.Screen
        options={{
          title: translate("title"),
          headerLargeTitle: true,
          headerLargeTitleStyle: { fontSize: 28 },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Image
                source="sf:xmark"
                style={styles.headerBtnIcon}
                tintColor={colors.text.secondary}
              />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleStart}
              disabled={!selectedId}
              hitSlop={12}
              style={{ opacity: selectedId ? 1 : 0.4 }}
            >
              <Image
                source="sf:checkmark"
                style={styles.headerBtnIcon}
                tintColor={
                  selectedId ? colors.accent.default : colors.text.disabled
                }
              />
            </Pressable>
          ),
          headerSearchBarOptions: {
            ref: searchRef,
            placeholder: translate("searchPlaceholder"),
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            hideWhenScrolling: true,
            // focus 시에도 헤더(취소·선택 버튼)를 유지한다
            hideNavigationBar: false,
            textColor: colors.text.primary,
            tintColor: colors.accent.default,
          },
        }}
      />

      <ChampionSelectGrid
        listData={listData}
        selectedId={selectedId}
        selectedTag={selectedTag}
        onSelect={handleSelect}
        onTagPress={handleTagPress}
        // 검색 active(취소버튼) 상태로 스크롤하면 inline 타이틀이 안 뜨므로,
        // 스크롤 시작 시 검색을 종료해 일반 large title 모드로 되돌린다.
        onScrollBeginDrag={() => searchRef.current?.cancelSearch()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerBtnIcon: {
    width: 22,
    height: 22,
  },
});
