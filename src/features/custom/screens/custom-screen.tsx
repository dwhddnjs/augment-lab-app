/**
 * CustomScreen — 커스텀 모드. 전체 증강·아이템 풀에서 직접 골라 담는 가로 화면.
 *
 * 좌 6.5 : 우 4.5. 좌측 카드를 길게 눌러 우측 패널로 끌면 담긴다(퀵모드면 탭 한 번).
 * 헤더 토글이 좌측 판(증강 그리드 ↔ 아이템 그리드)과 담기는 칸을 함께 바꾼다.
 * 뽑기·라운드·리롤이 없어 useAram 같은 엔진이 없고, 상태는 useCustomDraft 하나다.
 *
 * GestureDetector 는 GestureHandlerRootView 아래여야 __DEV__ throw 를 피하는데,
 * 그 root 를 <Drawer> 가 제공한다(react-native-drawer-layout/views/Drawer.native).
 * Drawer 를 걷어내면 여기서 직접 감싸야 한다.
 */
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { ThemedView } from "@/components/themed/themed-view";
import { AugmentTile } from "@/components/ui/augment-tile";
import { GlassButton } from "@/components/ui/glass-button";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import { useLandscapeLock } from "@/hooks/use-landscape-lock";
import { useTheme } from "@/hooks/use-theme";
import { itemImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { lockPortraitAfterExit } from "@/lib/orientation";
import { AugmentSearchField } from "../components/augment-search-field";
import {
  AugmentPickGrid,
  TIER_RAIL_WIDTH,
  cardWidthForGrid,
} from "../components/augment-pick-grid";
import { ChampionChangeOverlay } from "../components/champion-change-overlay";
import { ChampionStatOverlay } from "../components/champion-stat-overlay";
import { CustomSettingsDrawer } from "../components/custom-settings-drawer";
import type { DragPayload } from "../components/drag-cell";
import { ItemPickGrid } from "../components/item-pick-grid";
import { PickTargetToggle } from "../components/pick-target-toggle";
import { SelectedPanel } from "../components/selected-panel";
import { useCustomDraft } from "../hooks/use-custom-draft";

const t = {
  ko: {
    exitConfirm: "커스텀을 종료할까요?",
    exitMessage: "담은 증강과 아이템은 저장되지 않습니다.",
    exitOk: "종료",
    exitCancel: "계속",
    saveError: "빌드 저장에 실패했어요",
    saveEmpty: "저장할 내용이 없어요",
  },
  en: {
    exitConfirm: "Exit Custom?",
    exitMessage: "Your picks won't be saved.",
    exitOk: "Exit",
    exitCancel: "Continue",
    saveError: "Failed to save the build",
    saveEmpty: "Nothing to save yet",
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
  // 세로 값은 아예 담지 않는다 — 회전 잠금 중에도 앱 전환 복귀 같은 순간에 세로
  // 레이아웃이 한 프레임 들어올 수 있고, 그때 CustomContent 가 unmount 되면 담아둔
  // 증강·아이템이 통째로 사라진다(상태가 전부 그 안의 useCustomDraft 에 있다).
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const isLandscape = dims.w > 0;

  return (
    <ThemedView
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > height) setDims({ w: width, h: height });
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
  const draft = useCustomDraft(initialChampionId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [changingChampion, setChangingChampion] = useState(false);
  const [showingStats, setShowingStats] = useState(false);
  // 고스트에 그릴 것. null 이면 드래그 중이 아니다.
  const [dragged, setDragged] = useState<DragPayload | null>(null);
  // 손가락이 드롭 경계를 넘었는지. 경계를 넘나들 때만 JS 로 알린다 —
  // 매 프레임 넘기면 고스트가 튄다(augment-pick-grid 상단 주석의 이유와 같다).
  const [overDrop, setOverDrop] = useState(false);

  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);

  // 저장 가능 여부(챔피언을 못 찾았는지)를 훅이 함께 판정하므로 조회도 거기 있다.
  const champion = draft.champion;

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

  const commit = (payload: DragPayload) => {
    const result =
      payload.kind === "augment"
        ? draft.add(payload.augment)
        : draft.addItem(payload.item);
    if (result === "added") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else {
      // 이미 담겼거나(중복) 정원이 찼다(증강 5 · 아이템 6) — "안 담겼다"는 신호면 족하다.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
    }
  };

  const handleDragStart = (payload: DragPayload) => {
    setDragged(payload);
    ghostOpacity.set(1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handleDragEnd = (payload: DragPayload, absoluteX: number) => {
    // dragged 를 곧바로 비우므로 페이드는 보이지 않는다. 즉시 끈다.
    ghostOpacity.set(0);
    setDragged(null);
    // 취소는 -1 로 온다. dropBoundary 는 그리드가 그려진 뒤라 항상 양수이므로
    // 이 비교 하나가 취소와 "좌측에서 놓음"을 함께 걸러낸다.
    if (absoluteX > dropBoundary) commit(payload);
  };

  const handleExit = () => {
    Alert.alert(translate("exitConfirm"), translate("exitMessage"), [
      { text: translate("exitCancel"), style: "cancel" },
      {
        text: translate("exitOk"),
        style: "destructive",
        onPress: () => {
          router.dismissTo("/");
          lockPortraitAfterExit();
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
          {/* 헤더 — 나가기 / 검색 / 증강·아이템 토글 / 저장 / 설정 */}
          <View style={[styles.header, { paddingHorizontal: HEADER_PAD }]}>
            <GlassButton
              systemImage="xmark"
              fallbackIcon="close"
              role="cancel"
              onPress={handleExit}
            />
            <View style={styles.headerSpacer} />
            <GlassButton
              systemImage="checkmark"
              fallbackIcon="check"
              tint={colors.accent.default}
              onPress={() =>
                draft.save((reason) =>
                  Alert.alert(
                    translate(reason === "invalid" ? "saveEmpty" : "saveError"),
                  ),
                )
              }
            />
            <GlassButton
              systemImage="slider.horizontal.3"
              fallbackIcon="tune-variant"
              onPress={() => setDrawerOpen(true)}
            />

            {/* 검색 + 토글은 헤더 정중앙. 좌(1개)·우(2개) 버튼 수가 달라 flex 로
                나누면 그만큼 왼쪽으로 밀린다 — 헤더 폭 기준으로 띄운다.
                빈 자리는 box-none 이라 아래 버튼 탭이 그대로 통과한다. */}
            <View style={styles.headerCenter} pointerEvents="box-none">
              <AugmentSearchField
                value={draft.query}
                target={draft.target}
                onChange={draft.setQuery}
              />
              <PickTargetToggle
                target={draft.target}
                onToggle={draft.toggleTarget}
              />
            </View>
          </View>

          <View
            style={styles.body}
            onLayout={(e) => setBodyW(e.nativeEvent.layout.width)}
          >
            {bodyW > 0 && (
              <>
                <View style={{ width: leftW }}>
                  {draft.target === "augment" ? (
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
                      onTap={(augment) => commit({ kind: "augment", augment })}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ) : (
                    <ItemPickGrid
                      list={draft.itemList}
                      selectedIds={draft.itemIds}
                      filter={draft.itemFilter}
                      onFilterChange={draft.setItemFilter}
                      quickMode={draft.quickMode}
                      bottomInset={insets.bottom}
                      ghostX={ghostX}
                      ghostY={ghostY}
                      onTap={(item) => commit({ kind: "item", item })}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  )}
                </View>

                <View style={styles.right}>
                  <SelectedPanel
                    champion={champion}
                    picked={draft.picked}
                    items={draft.items}
                    target={draft.target}
                    dropping={dragged !== null && overDrop}
                    bottomInset={insets.bottom}
                    onSwitchTarget={draft.toggleTarget}
                    onRemove={draft.remove}
                    onRemoveItem={draft.removeItem}
                    onShowStats={() => setShowingStats(true)}
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
        <Animated.View pointerEvents="none" style={[styles.ghost, ghostStyle]}>
          {dragged?.kind === "augment" && (
            <View style={styles.ghostInner}>
              <AugmentTile
                iconPath={dragged.augment.iconPath}
                rarity={dragged.augment.rarity}
                size={GHOST}
                recyclingKey={dragged.augment.id}
              />
            </View>
          )}
          {dragged?.kind === "item" && (
            <View style={styles.ghostInner}>
              <RemoteImage
                uri={itemImageUrl(dragged.item.imageKey)}
                recyclingKey={dragged.item.id}
                style={styles.ghostItem}
                contentFit="contain"
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

        {showingStats && champion && (
          <ChampionStatOverlay
            champion={champion}
            items={draft.items}
            onClose={() => setShowingStats(false)}
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
    gap: Spacing.two,
    // safe-area top inset 위에 얹히므로 상단 패딩은 작게.
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  // 나가기 | (중앙 묶음) | 저장·설정 — 중앙 묶음이 절대배치라 이 하나로 갈린다.
  headerSpacer: { flex: 1 },
  headerCenter: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
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
  ghostItem: { width: GHOST, height: GHOST, borderRadius: Radius.sm },
});
