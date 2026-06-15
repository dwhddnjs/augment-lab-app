/**
 * BuildDetailScreen — 저장된 빌드 상세 (세로모드)
 *
 * 챔피언 배너가 스크롤에 따라 collapsing(당기면 줌, 올리면 패럴랙스+페이드)되고,
 * 본문 시트가 위로 올라오며 내용을 드러낸다. 헤더는 (home) 스택의 native 투명
 * 헤더(뒤로가기)를 사용한다 — 커스텀 헤더 없음.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { GlassSurface } from "@/components/ui/glass-surface";
import { AugmentRarityColors, Radius, Spacing } from "@/constants/theme";
import { useAugments } from "@/features/augments/hooks/use-augments";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { ItemStatPanel } from "@/features/items/components/item-stat-panel";
import { useItems } from "@/features/items/hooks/use-items";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { cleanAugmentDescription } from "@/lib/augment-text";
import { getBuild, removeBuild, type SavedBuild } from "@/lib/build-storage";
import {
  championSplashUrl,
  championSquareUrl,
  itemImageUrl,
} from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { AugmentTile } from "./augment-tile";

const t = {
  ko: {
    augments: "증강",
    items: "아이템",
    stats: "합산 스탯",
    delete: "빌드 삭제",
    deleteConfirm: "빌드를 삭제할까요?",
    deleteOk: "삭제",
    cancel: "취소",
    notFound: "빌드를 찾을 수 없어요",
    Fighter: "전사",
    Mage: "마법사",
    Assassin: "암살자",
    Tank: "탱커",
    Marksman: "원거리",
    Support: "서포터",
  },
  en: {
    augments: "Augments",
    items: "Items",
    stats: "Total Stats",
    delete: "Delete Build",
    deleteConfirm: "Delete this build?",
    deleteOk: "Delete",
    cancel: "Cancel",
    notFound: "Build not found",
    Fighter: "Fighter",
    Mage: "Mage",
    Assassin: "Assassin",
    Tank: "Tank",
    Marksman: "Marksman",
    Support: "Support",
  },
};

type Translate = (key: string) => string;

// 배너가 가장 클 때 높이. 스크롤하면 0까지 줄어든다.
const BANNER_HEIGHT = 300;
// 본문 시트가 배너 하단을 살짝 덮으며 올라오는 겹침 양.
const SHEET_OVERLAP = 24;
// 배너 height가 0이 되는 스크롤 거리 (시트가 화면 상단에 닿는 지점).
const COLLAPSE_DISTANCE = BANNER_HEIGHT - SHEET_OVERLAP;
// 당겨서 이미지를 더 키울 수 있는 여유분.
const PULL_EXTRA = 140;

export function BuildDetailScreen() {
  const translate = useTranslation(t) as Translate;
  const { colors, typography } = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // id가 없으면 조회할 것이 없으므로 곧장 not-found 상태로 시작한다.
  const [loaded, setLoaded] = useState(!id);
  const [build, setBuild] = useState<SavedBuild | null>(null);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // 배너 컨테이너 높이를 직접 줄인다: 당기면 커지고(아래로 확장), 올리면 0까지 수축.
  const bannerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [-PULL_EXTRA, 0, COLLAPSE_DISTANCE],
      [BANNER_HEIGHT + PULL_EXTRA, BANNER_HEIGHT, 0],
      Extrapolation.CLAMP,
    );
    return { height };
  });

  // 배너가 충분히 접히면 native 헤더(배경 + 챔피언 이름)가 페이드인된다.
  const headerFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [COLLAPSE_DISTANCE * 0.45, COLLAPSE_DISTANCE * 0.8],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  useEffect(() => {
    if (!id) return;
    let active = true;
    getBuild(id)
      .then((b) => {
        if (active) {
          setBuild(b);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // 홈(portrait)에서만 진입하지만, 드래프트 직후 회전 잔상에 대한 안전망.
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
    }, []),
  );

  const champions = useChampions();
  const augments = useAugments();
  const items = useItems();

  const champion = build
    ? (champions.find((c) => c.id === build.championId) ?? null)
    : null;
  const buildAugments = (build?.augmentIds ?? [])
    .map((augId) => augments.find((a) => a.id === augId))
    .filter((a) => a != null);
  const buildItems = (build?.itemIds ?? [])
    .map((itemId) => items.find((it) => it.id === itemId))
    .filter((it) => it != null);
  const itemStatsList = buildItems.map((it) => it.stats);

  const handleDelete = () => {
    if (!build) return;
    Alert.alert(translate("deleteConfirm"), "", [
      { text: translate("cancel"), style: "cancel" },
      {
        text: translate("deleteOk"),
        style: "destructive",
        onPress: () => {
          removeBuild(build.id).catch(() => {});
          router.back();
        },
      },
    ]);
  };

  if (!loaded) {
    return <ThemedView style={styles.container} />;
  }

  if (!build) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.notFound}>
          <MaterialCommunityIcons
            name="cards-outline"
            size={56}
            color={colors.text.disabled}
          />
          <ThemedText type="body" color="secondary">
            {translate("notFound")}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const date = new Date(build.createdAt).toLocaleDateString(
    locale === "ko" ? "ko-KR" : "en-US",
  );

  return (
    <ThemedView style={styles.container}>
      {/* 접히면 헤더 배경 + 챔피언 이름이 페이드인되는 native 투명 헤더 */}
      <Stack.Screen
        options={{
          headerTintColor: colors.accent.default,
          // 스크롤로 배너가 접히면 native 블러(리퀴드글라스) 헤더가 페이드인된다.
          headerBackground: () => (
            <Animated.View style={[StyleSheet.absoluteFill, headerFadeStyle]}>
              <GlassSurface glassStyle="regular" style={StyleSheet.absoluteFill} />
            </Animated.View>
          ),
          headerTitle: () => (
            <Animated.Text
              numberOfLines={1}
              style={[
                {
                  ...typography.heading,
                  fontSize: 17,
                  color: colors.text.primary,
                },
                headerFadeStyle,
              ]}
            >
              {champion?.name ?? ""}
            </Animated.Text>
          ),
        }}
      />

      {/* 챔피언 배너 — 스크롤에 따라 높이가 줄어든다 (절대 배치, 본문 뒤) */}
      <Animated.View style={[styles.banner, bannerStyle]} pointerEvents="none">
        {champion && (
          <Image
            source={{ uri: championSplashUrl(champion.id) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="center"
          />
        )}
        <LinearGradient
          colors={[
            colors.surface.base + "00",
            colors.surface.base + "99",
            colors.surface.base,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 배너가 비치는 투명 스페이서 */}
        <View style={styles.bannerSpacer} pointerEvents="none" />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface.base,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          {/* 챔피언 블록 */}
          {champion && (
            <View style={styles.champHeader}>
              <Image
                source={{ uri: championSquareUrl(champion.imageKey) }}
                style={[
                  styles.champIcon,
                  { borderColor: colors.accent.default },
                ]}
                contentFit="cover"
              />
              <View style={styles.champMeta}>
                <ThemedText type="heading" numberOfLines={1}>
                  {champion.name}
                </ThemedText>
                <ThemedText type="caption" color="tertiary" numberOfLines={1}>
                  {champion.title}
                </ThemedText>
                <View style={styles.tagRow}>
                  {champion.tags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.tagChip,
                        { backgroundColor: colors.accent.subtle },
                      ]}
                    >
                      <ThemedText
                        type="caption"
                        style={{ color: colors.accent.default }}
                      >
                        {translate(tag)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
              <ThemedText type="caption" color="tertiary">
                {date}
              </ThemedText>
            </View>
          )}

          {/* 증강 */}
          <View style={styles.section}>
            <ThemedText type="label" color="secondary">
              {translate("augments")} {buildAugments.length}
            </ThemedText>
            {buildAugments.map((aug, i) => (
              <ThemedView
                key={`${aug.id}-${i}`}
                surface="raised"
                style={[
                  styles.augmentRow,
                  {
                    borderColor: colors.border.subtle,
                    borderLeftColor: AugmentRarityColors[aug.rarity].border,
                  },
                ]}
              >
                <AugmentTile augment={aug} size={48} />
                <View style={styles.augmentBody}>
                  <ThemedText type="label">{aug.name}</ThemedText>
                  <ThemedText type="caption" color="secondary">
                    {cleanAugmentDescription(aug.description)}
                  </ThemedText>
                </View>
              </ThemedView>
            ))}
          </View>

          {/* 아이템 */}
          {buildItems.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="label" color="secondary">
                {translate("items")} {buildItems.length}
              </ThemedText>
              <View style={styles.itemsRow}>
                {buildItems.map((item, i) => (
                  <View
                    key={`${item.id}-${i}`}
                    style={[
                      styles.itemTile,
                      {
                        backgroundColor: colors.surface.raised,
                        borderColor: colors.border.subtle,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: itemImageUrl(item.imageKey) }}
                      style={styles.itemIcon}
                      contentFit="contain"
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 합산 스탯 */}
          {champion && (
            <View style={styles.section}>
              <ThemedText type="label" color="secondary">
                {translate("stats")}
              </ThemedText>
              <ItemStatPanel
                baseStats={champion.stats}
                itemStatsList={itemStatsList}
              />
            </View>
          )}

          {/* 삭제 */}
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              {
                backgroundColor: colors.status.danger.subtle,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color={colors.status.danger.default}
            />
            <ThemedText
              type="label"
              style={{ color: colors.status.danger.default }}
            >
              {translate("delete")}
            </ThemedText>
          </Pressable>
        </View>
        <View style={{ height: 240 }} />
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    overflow: "hidden",
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  bannerSpacer: {
    height: BANNER_HEIGHT - SHEET_OVERLAP,
  },
  sheet: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderCurve: "continuous",
    // 배너 위로 떠오르는 시트의 상단 모서리를 또렷하게 구분하는 rim 라인.
    // 배너 끝과 시트 배경이 같은 surface.base라 라인이 없으면 둥근 모서리가 안 보인다.
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  champHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  champIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  champMeta: {
    flex: 1,
    gap: Spacing.one,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
  },
  tagChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  section: {
    gap: Spacing.two,
  },
  augmentRow: {
    flexDirection: "row",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
  },
  augmentBody: {
    flex: 1,
    gap: Spacing.one,
  },
  itemsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  itemTile: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.double,
    borderRadius: Radius.lg,
  },
});
