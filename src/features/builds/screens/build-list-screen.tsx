/**
 * BuildListScreen — 홈 탭. 저장된 드래프트 빌드 목록.
 * 같은 날짜끼리 묶어 날짜 태그 헤더 + 그 날짜 카드들을 SectionList로 렌더한다.
 * 반응형 스토어(useBuilds)를 구독해 드래프트 저장/삭제 직후 자동 갱신된다.
 * 화면 타이틀은 (home) 스택의 native large-title 헤더가 제공한다.
 *
 * 모드가 칼바람 하나만 남아(2026-10-30 클래식 제거) 모드 세그먼트·헤더 토글은 없다.
 */
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { Alert, Pressable, SectionList, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { BottomTabInset, Radius, Spacing } from "@/constants/theme";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { removeBuild, type SavedBuild } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import { BuildCard } from "../components/build-card";
import { useBuilds } from "../hooks/use-builds";
import { formatDate, groupByDate, type BuildSection } from "../utils/date";

const t = {
  ko: {
    emptyHint: "빌드를 완료하면 여기에 쌓여요",
    startBuild: "빌드 시작",
    deleteConfirm: "빌드를 삭제할까요?",
    deleteOk: "삭제",
    cancel: "취소",
  },
  en: {
    emptyHint: "Finish a build to see it here",
    startBuild: "Start Build",
    deleteConfirm: "Delete this build?",
    deleteOk: "Delete",
    cancel: "Cancel",
  },
};

export function BuildListScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  // null = 로딩 중 (깜빡임 없이 빈 상태와 구분). 반응형 스토어를 구독하므로
  // 다른 화면의 저장/삭제가 즉시 반영된다.
  const builds = useBuilds();

  const handleDelete = (build: SavedBuild) => {
    Alert.alert(translate("deleteConfirm"), "", [
      { text: translate("cancel"), style: "cancel" },
      {
        text: translate("deleteOk"),
        style: "destructive",
        // 스토어가 즉시 emit → 구독 중인 목록이 바로 갱신된다(수동 상태 갱신 불필요).
        onPress: () => {
          removeBuild(build.id).catch(() => {});
        },
      },
    ]);
  };

  const handleStartBuild = () => {
    router.push({
      pathname: "/select-champion-modal",
      params: { mode: "aram" },
    });
  };

  // 빈 상태도 SectionList 안에 렌더해 native large-title 아래에 위치하도록 한다.
  // 로딩 중(null)에는 깜빡임 방지로 숨김.
  const emptyState = (
    <View style={styles.empty}>
      <Pressable
        onPress={handleStartBuild}
        style={({ pressed }) => [
          styles.emptyCard,
          {
            borderColor: colors.border.default,
            backgroundColor: pressed ? colors.surface.sunken : "transparent",
          },
        ]}
      >
        <Feather name="plus-circle" size={32} color={colors.text.tertiary} />
        <ThemedText type="label" color="tertiary">
          {translate("startBuild")}
        </ThemedText>
      </Pressable>
      <ThemedText type="caption" color="tertiary" style={styles.emptyHint}>
        {translate("emptyHint")}
      </ThemedText>
    </View>
  );

  const sections = groupByDate(builds ?? [], locale);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      // 헤더 바로 아래 루트 스크롤뷰여야 native large-title이
      // 스크롤에 맞춰 inline 타이틀로 collapse 된다 (래퍼 View로 감싸지 않음).
      style={{ flex: 1, backgroundColor: colors.surface.base }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={builds == null ? null : emptyState}
      ItemSeparatorComponent={ItemGap}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.dateTag,
              {
                backgroundColor: colors.surface.raised,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <ThemedText type="label" color="secondary">
              {formatDate((section as BuildSection).title)}
            </ThemedText>
          </View>
        </View>
      )}
      renderItem={({ item }) => (
        <BuildCard
          build={item}
          onPress={() =>
            router.push({ pathname: "/build/[id]", params: { id: item.id } })
          }
          onLongPress={() => handleDelete(item)}
        />
      )}
    />
  );
}

/** 같은 날짜 섹션 안 카드 사이 간격. */
function ItemGap() {
  return <View style={styles.itemGap} />;
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  sectionHeader: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    flexDirection: "row",
    justifyContent: "center",
  },
  dateTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.double,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemGap: {
    height: Spacing.three,
  },
  // large title 바로 아래에 붙도록 flex 중앙정렬 대신 상단 여백만.
  empty: {
    alignItems: "center",
    gap: Spacing.three,
    paddingTop: Spacing.four,
  },
  // 점선 플레이스홀더 카드 — 전체가 눌리는 CTA.
  emptyCard: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  emptyHint: {
    textAlign: "center",
  },
});
