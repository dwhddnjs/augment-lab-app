/**
 * CustomScreen — 커스텀 모드. 전체 증강 풀에서 직접 골라 담는 가로 화면.
 *
 * 좌 6.5 : 우 4.5. 좌측 카드를 길게 눌러 우측 패널로 끌면 담긴다(퀵모드면 탭 한 번).
 * 뽑기·라운드·리롤이 없어 useAram 같은 엔진이 없고, 상태는 useCustomDraft 하나다.
 *
 * GestureDetector 는 GestureHandlerRootView 아래여야 __DEV__ throw 를 피하는데,
 * 그 root 를 <Drawer> 가 제공한다(react-native-drawer-layout/views/Drawer.native).
 * Drawer 를 걷어내면 여기서 직접 감싸야 한다.
 */
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { ThemedView } from "@/components/themed/themed-view";
import { AugmentTile } from "@/components/ui/augment-tile";
import { GlassButton } from "@/components/ui/glass-button";
import { Radius, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useLandscapeLock } from "@/hooks/use-landscape-lock";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";
import { AugmentSearchField } from "../components/augment-search-field";
import {
  AugmentPickGrid,
  TIER_RAIL_WIDTH,
  cardWidthForGrid,
} from "../components/augment-pick-grid";
import { ChampionChangeOverlay } from "../components/champion-change-overlay";
import { CustomSettingsDrawer } from "../components/custom-settings-drawer";
import { SelectedPanel } from "../components/selected-panel";
import { useCustomDraft } from "../hooks/use-custom-draft";

const t = {
  ko: {
    exitConfirm: "커스텀을 종료할까요?",
    exitMessage: "담은 증강은 저장되지 않습니다.",
    exitOk: "종료",
    exitCancel: "계속",
  },
  en: {
    exitConfirm: "Exit Custom?",
    exitMessage: "Your picks won't be saved.",
    exitOk: "Exit",
    exitCancel: "Continue",
  },
};

/** 좌:우 = 6.5:4.5 → 합 11. 드롭 판정 경계도 이 비율에서 나온다. */
const LEFT_RATIO = 6.5 / 11;
/** 본문 좌우(그리드 contentContainer·패널 paddingHorizontal)와 같은 값. */
const HEADER_PAD = Spacing.two;
/** 손가락을 따라다니는 고스트 타일 크기. 카드 원본은 우측 패널을 통째로 가린다. */
const GHOST = 64;

// ─── 화면 진입 래퍼 (landscape 가드) ─────────────────────────────────────────
export function CustomScreen() {
  const { championId } = useLocalSearchParams<{ championId: string }>();
  useLandscapeLock();

  // 이 화면은 모달 위에 떠서 window 치수가 늦게 따라오므로 자체 onLayout으로 잰다.
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const isLandscape = dims.w > dims.h && dims.w > 0;

  return (
    <ThemedView
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setDims({ w: width, h: height });
      }}
    >
      {isLandscape && (
        <CustomContent initialChampionId={championId ?? ""} screenW={dims.w} />
      )}
    </ThemedView>
  );
}

// ─── 본체 ────────────────────────────────────────────────────────────────────
function CustomContent({
  initialChampionId,
  screenW,
}: {
  initialChampionId: string;
  screenW: number;
}) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const champions = useChampions();
  const draft = useCustomDraft(initialChampionId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [changingChampion, setChangingChampion] = useState(false);
  // 고스트에 그릴 증강. null 이면 드래그 중이 아니다.
  const [dragged, setDragged] = useState<Augment | null>(null);
  // 손가락이 드롭 경계를 넘었는지. 경계를 넘나들 때만 JS 로 알린다 —
  // 매 프레임 넘기면 고스트가 튄다(augment-pick-grid 상단 주석의 이유와 같다).
  const [overDrop, setOverDrop] = useState(false);

  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);

  const champion =
    champions.find((c) => c.id === draft.championId) ?? null;

  // body 실측 폭 → 좌우 폭과 드롭 경계를 같은 숫자에서 낸다(flex 로 두면 어긋난다).
  const [bodyW, setBodyW] = useState(0);
  const leftW = Math.round(bodyW * LEFT_RATIO);
  const cardWidth = cardWidthForGrid(Math.max(0, leftW - TIER_RAIL_WIDTH));
  // body 는 SafeAreaView 안이므로 절대 x 는 left inset 만큼 밀려 있다.
  const dropBoundary = insets.left + leftW;

  const drawerWidth = Math.min(340, screenW * 0.38);

  useAnimatedReaction(
    () => ghostX.get() > dropBoundary,
    (over, prev) => {
      if (over !== prev) scheduleOnRN(setOverDrop, over);
    },
  );

  const ghostStyle = useAnimatedStyle(() => ({
    opacity: ghostOpacity.get(),
    transform: [
      { translateX: ghostX.get() - GHOST / 2 },
      { translateY: ghostY.get() - GHOST / 2 },
    ],
  }));

  const commit = (augment: Augment) => {
    const result = draft.add(augment);
    if (result === "added") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else {
      // 이미 담긴 증강 — "안 담겼다"는 신호만 주면 된다.
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
  };

  const handleDragStart = (augment: Augment) => {
    setDragged(augment);
    ghostOpacity.set(1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handleDragEnd = (augment: Augment, absoluteX: number) => {
    // dragged 를 곧바로 비우므로 페이드는 보이지 않는다. 즉시 끈다.
    ghostOpacity.set(0);
    setDragged(null);
    // 음수 = 제스처 취소. 좌측에서 놓으면 아무 일도 없다.
    if (absoluteX >= 0 && absoluteX > dropBoundary) commit(augment);
  };

  const handleExit = () => {
    Alert.alert(translate("exitConfirm"), translate("exitMessage"), [
      { text: translate("exitCancel"), style: "cancel" },
      {
        text: translate("exitOk"),
        style: "destructive",
        onPress: () => {
          // navigation 전에 portrait를 먼저 걸어 exit 애니메이션이 portrait로 재생된다.
          ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP,
          ).catch(() => {});
          router.dismissTo("/");
        },
      },
    ]);
  };

  return (
    <Drawer
      open={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}
      drawerPosition="right"
      drawerType="front"
      // 우측 가장자리로 카드를 끌면 drawer 가 열려버린다. 탭으로만 연다.
      swipeEnabled={false}
      drawerStyle={{ width: drawerWidth, backgroundColor: colors.surface.base }}
      renderDrawerContent={() => <CustomSettingsDrawer draft={draft} />}
    >
      <ThemedView style={styles.container}>
        {/* bottom inset 은 여기서 먹지 않는다 — 리스트가 화면 끝까지 흐르고,
            마지막 줄만 각 리스트의 contentContainer 가 홈 인디케이터만큼 띄운다. */}
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
          {/* 헤더 — 나가기 / 증강 검색 / 설정 */}
          <View style={[styles.header, { paddingHorizontal: HEADER_PAD }]}>
            <GlassButton
              systemImage="xmark"
              fallbackIcon="close"
              role="cancel"
              onPress={handleExit}
            />
            <AugmentSearchField value={draft.query} onChange={draft.setQuery} />
            {/* ponytail: 다음 턴 — 여기에 완료(checkmark) 버튼이 들어간다.
                router.replace({ pathname: "/aram-items", params: {
                  picked: JSON.stringify(draft.picked),
                  championId: draft.championId,
                  mode: draft.mode } })
                draft.mode 가 DraftMode 라 parseDraftMode·saveBuild 가 무수정으로 받는다. */}
            <GlassButton
              systemImage="slider.horizontal.3"
              fallbackIcon="tune-variant"
              onPress={() => setDrawerOpen(true)}
            />
          </View>

          <View
            style={styles.body}
            onLayout={(e) => setBodyW(e.nativeEvent.layout.width)}
          >
            {bodyW > 0 && (
              <>
                <View style={{ width: leftW }}>
                  <AugmentPickGrid
                    list={draft.list}
                    pickedIds={draft.pickedIds}
                    tier={draft.tier}
                    onTierChange={draft.setTier}
                    quickMode={draft.quickMode}
                    cardWidth={cardWidth}
                    bottomInset={insets.bottom}
                    ghostX={ghostX}
                    ghostY={ghostY}
                    onTap={commit}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                </View>

                <View style={styles.right}>
                  <SelectedPanel
                    champion={champion}
                    picked={draft.picked}
                    quickMode={draft.quickMode}
                    dropActive={dragged !== null && overDrop}
                    bottomInset={insets.bottom}
                    onRemove={draft.remove}
                    onChangeChampion={() => setChangingChampion(true)}
                    onClear={draft.clear}
                  />
                </View>
              </>
            )}
          </View>
        </SafeAreaView>

        {/* 드래그 고스트 — FlatList 가 children 을 클리핑하므로 화면 최상단에 둔다.
            셀 안에 두면 좌측 패널 경계에서 잘려 우측까지 못 간다. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.ghost, ghostStyle]}
        >
          {dragged && (
            <View style={styles.ghostInner}>
              <AugmentTile
                iconPath={dragged.iconPath}
                rarity={dragged.rarity}
                size={GHOST}
                recyclingKey={dragged.id}
              />
            </View>
          )}
        </Animated.View>

        {changingChampion && (
          <ChampionChangeOverlay
            selectedId={draft.championId}
            onSelect={(id) => {
              draft.setChampionId(id);
              setChangingChampion(false);
            }}
            onClose={() => setChangingChampion(false)}
          />
        )}
      </ThemedView>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.double,
    // safe-area top inset 위에 얹히므로 상단 패딩은 작게.
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },

  body: { flex: 1, flexDirection: "row" },
  right: { flex: 1, minWidth: 0 },

  ghost: {
    position: "absolute",
    top: 0,
    left: 0,
    width: GHOST,
    alignItems: "center",
  },
  ghostInner: {
    alignItems: "center",
    opacity: 0.9,
    transform: [{ scale: 1.05 }],
    borderRadius: Radius.md,
  },
});
