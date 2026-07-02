/**
 * ArenaScreen — 아레나 게임 화면(가로). 12라운드를 평탄화한 step 흐름을 진행한다.
 * 칼바람 draft-screen 패턴(orientation lock, GlassButton 헤더, 우측 drawer)을 따르되,
 * step.kind에 따라 증강/프리즘/상점/재련 본문을 분기 렌더한다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, useWindowDimensions, View } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSurface } from "@/components/ui/glass-surface";
import { Radius, Spacing } from "@/constants/theme";
import {
  type ArenaAugment,
  type ArenaPickedAugment,
} from "@/features/arena/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useTheme } from "@/hooks/use-theme";
import { saveBuild } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import { ArenaAugmentCard } from "../components/arena-augment-card";
import { ArenaDrawer } from "../components/arena-drawer";
import { ArenaEnhancePicker } from "../components/arena-enhance-picker";
import type {
  ArenaCardEntryMode,
  ArenaCardExitMode,
} from "../components/arena-pick-card";
import { ArenaPrismaticCard } from "../components/arena-prismatic-card";
import { ArenaReforgeCard } from "../components/arena-reforge-card";
import { ArenaShop } from "../components/arena-shop";
import { ENHANCE_AUGMENT_ID, useArena } from "../hooks/use-arena";
import { usePrismaticItems } from "../hooks/use-arena-items";

const t = {
  ko: {
    round: "라운드",
    exitConfirm: "아레나를 종료할까요?",
    exitOk: "종료",
    exitCancel: "계속",
    saveError: "빌드 저장에 실패했어요",
  },
  en: {
    round: "Round",
    exitConfirm: "Exit the arena?",
    exitOk: "Exit",
    exitCancel: "Continue",
    saveError: "Failed to save the build",
  },
};

export function ArenaScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const { championId } = useLocalSearchParams<{ championId?: string }>();
  const champions = useChampions();
  const champion = champions.find((c) => c.id === championId);
  const allPrismatics = usePrismaticItems();

  const arena = useArena();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // 저장은 1회만 — effect 내 setState 없이 ref로 가드한다(cascading render 방지).
  const savingRef = useRef(false);

  // 카드 선택 애니메이션 상태(칼바람 draft 패턴). exit/entry는 카드 3장 기준 길이 3.
  const [exitModes, setExitModes] = useState<ArenaCardExitMode[]>([
    "none",
    "none",
    "none",
  ]);
  const [entryModes, setEntryModes] = useState<ArenaCardEntryMode[]>([
    "flip",
    "flip",
    "flip",
  ]);
  const [animating, setAnimating] = useState(false);
  // step 전환 시 카드 재마운트(flip 등장)를 강제하는 키.
  const [roundKey, setRoundKey] = useState(0);

  // 증강 강화(재련) 보유 증강 선택 오버레이 — null이면 닫힘.
  const [enhanceCards, setEnhanceCards] = useState<ArenaPickedAugment[] | null>(
    null,
  );
  const [enhanceRerolled, setEnhanceRerolled] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  // 선택: 고른 카드 바운스 + 나머지 fade-out → 380ms 후 실제 진행(commit) + 다음 step flip.
  const handlePick = (idx: number, commit: () => void) => {
    if (animating) return;
    setAnimating(true);
    const modes: ArenaCardExitMode[] = ["unchosen", "unchosen", "unchosen"];
    modes[idx] = "picked";
    setExitModes(modes);
    setTimeout(() => {
      commit();
      setExitModes(["none", "none", "none"]);
      setEntryModes(["flip", "flip", "flip"]);
      setRoundKey((k) => k + 1);
      setAnimating(false);
    }, 380);
  };

  // 리롤: 대상 카드 fade-out → 220ms 후 교체(해당 슬롯은 fade로 재등장).
  const handleReroll = (idx: number, rerollFn: () => void) => {
    if (animating) return;
    setAnimating(true);
    const modes: ArenaCardExitMode[] = ["none", "none", "none"];
    modes[idx] = "reroll";
    setExitModes(modes);
    setTimeout(() => {
      setEntryModes((prev) => {
        const next = [...prev];
        next[idx] = "fade";
        return next;
      });
      rerollFn();
      setExitModes(["none", "none", "none"]);
      setAnimating(false);
    }, 220);
  };

  // 증강 강화: 보유 증강 셔플 후 앞 3장으로 오버레이 오픈.
  const openEnhance = () => {
    const shuffled = [...arena.pickedAugments].sort(() => Math.random() - 0.5);
    setEnhanceCards(shuffled.slice(0, 3));
    setEnhanceRerolled([false, false, false]);
  };

  // 리롤: 현재 카드에 없는 보유 증강 중 랜덤 1장으로 교체(후보 없으면 무효).
  const handleEnhanceReroll = (idx: number) => {
    const shown = new Set((enhanceCards ?? []).map((c) => c.augment.id));
    const candidates = arena.pickedAugments.filter(
      (p) => !shown.has(p.augment.id),
    );
    if (candidates.length === 0) return;
    const replacement =
      candidates[Math.floor(Math.random() * candidates.length)];
    setEnhanceCards((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[idx] = replacement;
      return next;
    });
    setEnhanceRerolled((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  };

  // 선택: 고른 증강 제거 + 레벨 분배(use-arena가 advance까지 처리) 후 오버레이 닫기.
  const handleEnhancePick = (idx: number) => {
    const card = enhanceCards?.[idx];
    if (card) arena.enhanceAugment(card.augment.id);
    setEnhanceCards(null);
  };

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE,
      ).catch(() => {});
    }, []),
  );

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenW = isLandscape ? width : height;
  const screenH = isLandscape ? height : width;

  const hPad = Spacing.four;
  const cardGap = Spacing.three;
  const cardWidthByW = Math.floor((screenW - hPad * 2 - cardGap * 2) / 3);
  const cardWidthByH = Math.floor(screenH * 0.62 * (9 / 14));
  const cardWidth = Math.min(cardWidthByW, cardWidthByH);
  const drawerWidth = Math.min(360, screenW * 0.42);

  // 선택 시 도달할 강화 레벨(신규=1, 보유 중이면 현재+1, 최대치 clamp).
  const nextLevel = useCallback(
    (aug: ArenaAugment) => {
      const cur = arena.pickedAugments.find((p) => p.augment.id === aug.id);
      return cur ? Math.min(cur.level + 1, aug.maxLevel) : 1;
    },
    [arena.pickedAugments],
  );

  // 12라운드 종료 → 빌드 저장 후 세로 복귀 + 결과 상세로 이동.
  useEffect(() => {
    if (!arena.done || savingRef.current) return;
    savingRef.current = true;
    (async () => {
      const augmentLevels: Record<string, number> = {};
      arena.pickedAugments.forEach((p) => {
        augmentLevels[p.augment.id] = p.level;
      });
      let build;
      try {
        build = await saveBuild({
          mode: "arena",
          championId: championId ?? "",
          augmentIds: arena.pickedAugments.map((p) => p.augment.id),
          itemIds: arena.itemIds,
          augmentLevels,
          prismaticIds: arena.prismaticIds,
          shardIds: arena.shardIds,
          reforgeIds: arena.reforgeIds,
        });
      } catch {
        savingRef.current = false;
        Alert.alert(translate("saveError"));
        return;
      }
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
      router.dismissTo("/");
      router.push({ pathname: "/build/[id]", params: { id: build.id } });
    })();
  }, [arena, championId, router, translate]);

  const handleExit = useCallback(() => {
    Alert.alert(translate("exitConfirm"), "", [
      { text: translate("exitCancel"), style: "cancel" },
      {
        text: translate("exitOk"),
        style: "destructive",
        onPress: () => {
          ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP,
          ).catch(() => {});
          router.dismissTo("/");
        },
      },
    ]);
  }, [router, translate]);

  // 회전이 끝날 때까지 본문 렌더 보류(portrait→landscape reflow 방지).
  if (!isLandscape) {
    return <ThemedView style={styles.container} />;
  }

  const isShop = arena.step.kind === "shop";

  return (
    <Drawer
      open={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}
      drawerPosition="right"
      drawerType="front"
      drawerStyle={{ width: drawerWidth, backgroundColor: colors.surface.base }}
      renderDrawerContent={() => (
        <ArenaDrawer
          width={drawerWidth}
          champion={champion}
          pickedAugments={arena.pickedAugments}
          itemIds={arena.itemIds}
          prismaticIds={arena.prismaticIds}
          shardIds={arena.shardIds}
          reforgeIds={arena.reforgeIds}
          gold={arena.gold}
        />
      )}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView
          style={styles.safe}
          edges={["top", "bottom", "left", "right"]}
        >
          {/* 공통 헤더 */}
          <View style={[styles.header, { paddingLeft: Spacing.three }]}>
            <GlassButton
              systemImage="xmark"
              fallbackIcon="close"
              role="cancel"
              onPress={handleExit}
            />

            <GlassSurface glassStyle="regular" style={styles.roundBox}>
              <ThemedText
                type="label"
                color="primary"
                style={{ fontWeight: "800" }}
              >
                {translate("round")} {arena.round}/{arena.totalRounds}
              </ThemedText>
              <View style={styles.goldRow}>
                <MaterialCommunityIcons
                  name="circle-multiple"
                  size={14}
                  color="#F2C766"
                />
                <ThemedText
                  type="label"
                  style={{ color: "#F2C766", fontWeight: "800" }}
                >
                  {arena.gold.toLocaleString()}
                </ThemedText>
              </View>
            </GlassSurface>

            <View style={styles.headerRight}>
              {isShop && (
                <GlassButton
                  systemImage="checkmark"
                  fallbackIcon="check"
                  tint={colors.accent.default}
                  onPress={arena.endShop}
                />
              )}
              <GlassButton
                systemImage="list.bullet"
                fallbackIcon="format-list-bulleted"
                onPress={() => setDrawerOpen(true)}
              />
            </View>
          </View>

          {/* 본문 — step.kind 분기 */}
          {arena.step.kind === "augment" && (
            <View
              style={[
                styles.cardsRow,
                { paddingHorizontal: hPad, gap: cardGap },
              ]}
            >
              {arena.augmentCards.map((aug, i) => (
                <ArenaAugmentCard
                  key={`${roundKey}-${arena.stepIndex}-${aug.id}`}
                  augment={aug}
                  level={nextLevel(aug)}
                  maxLevel={aug.maxLevel}
                  cardWidth={cardWidth}
                  index={i}
                  exitMode={exitModes[i]}
                  entryMode={entryModes[i]}
                  disabled={animating}
                  rerolled={arena.rerolled[i]}
                  onPick={() => handlePick(i, () => arena.pickAugment(aug))}
                  onReroll={() => handleReroll(i, () => arena.rerollAugment(i))}
                />
              ))}
            </View>
          )}

          {arena.step.kind === "prismatic" && (
            <View
              style={[
                styles.cardsRow,
                { paddingHorizontal: hPad, gap: cardGap },
              ]}
            >
              {arena.prismaticCards.map((item, i) => (
                <ArenaPrismaticCard
                  key={`${roundKey}-${arena.stepIndex}-${item.id}`}
                  item={item}
                  cardWidth={cardWidth}
                  index={i}
                  exitMode={exitModes[i]}
                  entryMode={entryModes[i]}
                  disabled={animating}
                  rerolled={arena.rerolled[i]}
                  onPick={() => handlePick(i, () => arena.pickPrismatic(item))}
                  onReroll={() =>
                    handleReroll(i, () => arena.rerollPrismatic(i))
                  }
                />
              ))}
            </View>
          )}

          {arena.step.kind === "reforge" && enhanceCards == null && (
            <View
              style={[
                styles.cardsRow,
                { paddingHorizontal: hPad, gap: cardGap },
              ]}
            >
              {arena.reforgeCards.map((special, i) => (
                <ArenaReforgeCard
                  key={`${roundKey}-${arena.stepIndex}-${special.id}`}
                  special={special}
                  cardWidth={cardWidth}
                  index={i}
                  exitMode={exitModes[i]}
                  entryMode={entryModes[i]}
                  disabled={animating}
                  onPick={() =>
                    handlePick(
                      i,
                      special.id === ENHANCE_AUGMENT_ID
                        ? openEnhance
                        : () => arena.pickReforge(special),
                    )
                  }
                />
              ))}
            </View>
          )}

          {isShop && (
            <ArenaShop
              gold={arena.gold}
              champion={champion}
              prismaticOptions={allPrismatics}
              ownedItemIds={arena.itemIds}
              ownedPrismaticIds={arena.prismaticIds}
              onBuyItem={arena.buyItem}
              onUndoItem={arena.undoItem}
              onSellItem={arena.sellItem}
              onBuyPrismatic={arena.buyPrismaticItem}
              onSellPrismatic={arena.sellPrismatic}
            />
          )}

          {/* 증강 강화: 보유 증강 3장 선택 오버레이 */}
          {enhanceCards != null && (
            <ArenaEnhancePicker
              cards={enhanceCards}
              rerolled={enhanceRerolled}
              onPick={handleEnhancePick}
              onReroll={handleEnhanceReroll}
              onClose={() => setEnhanceCards(null)}
            />
          )}
        </SafeAreaView>
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
    paddingVertical: Spacing.two,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  cardsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  roundBox: {
    flexDirection: "column",
    alignItems: "center",
    // gap: Spacing.half,
    paddingHorizontal: Spacing.four,
    // paddingVertical: Spacing.one,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.half,
    borderRadius: Radius.full,
  },
  goldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
  },
});
