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
import { Radius, Spacing } from "@/constants/theme";
import { useAugments } from "@/features/augments/hooks/use-augments";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { ItemStatPanel } from "@/features/items/components/item-stat-panel";
import { useItems } from "@/features/items/hooks/use-items";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { getBuild, removeBuild, type SavedBuild } from "@/lib/build-storage";
import { championSplashUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { BuildAugmentList } from "../components/build-augment-list";
import { BuildChampionHeader } from "../components/build-champion-header";
import { BuildItemRow } from "../components/build-item-row";

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
  },
};

// 배너가 가장 클 때 높이. 스크롤하면 0까지 줄어든다.
const BANNER_HEIGHT = 300;
// 본문 시트가 배너 하단을 살짝 덮으며 올라오는 겹침 양.
const SHEET_OVERLAP = 24;
// 배너 height가 0이 되는 스크롤 거리 (시트가 화면 상단에 닿는 지점).
const COLLAPSE_DISTANCE = BANNER_HEIGHT - SHEET_OVERLAP;
// 당겨서 이미지를 더 키울 수 있는 여유분.
const PULL_EXTRA = 140;

export function BuildDetailScreen() {
  const translate = useTranslation(t);
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
    .filter((a): a is NonNullable<typeof a> => a != null);
  const buildItems = (build?.itemIds ?? [])
    .map((itemId) => items.find((it) => it.id === itemId))
    .filter((it): it is NonNullable<typeof it> => it != null);
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
              <GlassSurface
                glassStyle="regular"
                style={StyleSheet.absoluteFill}
              />
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
          headerRight: () => (
            <Pressable
              onPress={handleDelete}
              hitSlop={Spacing.two}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              accessibilityRole="button"
              accessibilityLabel={translate("delete")}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={22}
                color={colors.status.danger.default}
              />
            </Pressable>
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
            colors.surface.base + "00",
            colors.surface.base + "14",
            colors.surface.base + "40",
            colors.surface.base + "A6",
            colors.surface.base,
          ]}
          // fade를 아래쪽에 몰되 stop을 촘촘히 깔아 부드럽게 수렴시킨다.
          // splash가 오래 또렷하게 보이고(라이트모드의 밝은 surface.base가 일찍 덮는 것 방지),
          // 불투명도가 급격히 점프하며 생기던 띠(banding)도 없앤다.
          locations={[0, 0.5, 0.68, 0.82, 0.93, 1]}
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
          {champion && <BuildChampionHeader champion={champion} date={date} />}

          {/* 증강 */}
          <BuildAugmentList
            augments={buildAugments}
            label={translate("augments")}
          />

          {/* 아이템 */}
          {buildItems.length > 0 && (
            <BuildItemRow items={buildItems} label={translate("items")} />
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
  section: {
    gap: Spacing.two,
  },
});
