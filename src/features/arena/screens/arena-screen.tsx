/**
 * ArenaScreen — 아레나 게임 화면(가로). 12라운드를 평탄화한 step 흐름을 진행한다.
 * 칼바람 aram-screen 패턴(orientation lock, GlassButton 헤더, 우측 drawer)을 따르되,
 * step.kind에 따라 증강/프리즘/상점/재련 본문을 분기 렌더한다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSurface } from "@/components/ui/glass-surface";
import { CardRow } from "@/components/ui/pick-card";
import {
  CARD_GAP,
  CARD_HEIGHT_RATIO,
  cardWidthFor,
} from "@/components/ui/rarity-card-frame";
import { ArenaGold, Radius, Spacing } from "@/constants/theme";
import type { ArenaAugment } from "@/features/arena/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useAlive } from "@/hooks/use-alive";
import { useCardPickAnim } from "@/hooks/use-card-pick-anim";
import { useLandscapeLock } from "@/hooks/use-landscape-lock";
import { useTheme } from "@/hooks/use-theme";
import { saveBuild } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import { lockOrientation, lockPortraitAfterExit } from "@/lib/orientation";
import { ENHANCE_AUGMENT_ID } from "../arena-rules";
import { ArenaAugmentCard } from "../components/arena-augment-card";
import { ArenaDrawer } from "../components/arena-drawer";
import { ArenaEnhancePicker } from "../components/arena-enhance-picker";
import { ArenaPrismaticCard } from "../components/arena-prismatic-card";
import { ArenaReforgeCard } from "../components/arena-reforge-card";
import { ArenaShop } from "../components/arena-shop";
import { useArena } from "../hooks/use-arena";
import { usePrismaticItems } from "../hooks/use-arena-items";

const t = {
  ko: {
    round: "라운드",
    exitConfirm: "아레나를 종료할까요?",
    exitOk: "종료",
    exitCancel: "계속",
    saveError: "빌드 저장에 실패했어요",
    saveErrorBody: "지금 나가면 이번 판 결과가 사라집니다.",
    retry: "다시 시도",
    discard: "저장 않고 나가기",
  },
  en: {
    round: "Round",
    exitConfirm: "Exit the arena?",
    exitOk: "Exit",
    exitCancel: "Continue",
    saveError: "Failed to save the build",
    saveErrorBody: "Leaving now discards this run.",
    retry: "Retry",
    discard: "Leave without saving",
  },
};

// 헤더 버튼 좌우 여백 — 카드 영역(CARD_ROW_PAD)보다 넓게 잡아 버튼이 기기 끝에 붙지 않게 한다.
const HEADER_PAD = Spacing.five; // 32

export function ArenaScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const { championId } = useLocalSearchParams<{ championId?: string }>();
  const champions = useChampions();
  const champion = champions.find((c) => c.id === championId);
  const allPrismatics = usePrismaticItems();

  const arena = useArena();
  const anim = useCardPickAnim();
  const alive = useAlive();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // 증강 강화(재련) 오버레이 — 보유 증강 중 1장을 제물로 고른다.
  const [enhancing, setEnhancing] = useState(false);
  // 저장은 1회만 — effect 내 setState 없이 ref로 가드한다(cascading render 방지).
  const savingRef = useRef(false);
  // 저장이 실패하면 이 값을 올려 아래 effect를 한 번 더 돌린다. 실패해도 화면은
  // 그대로 두므로 사용자는 몇 번이고 다시 시도할 수 있다.
  const [retryCount, setRetryCount] = useState(0);

  const { isLandscape, screenW, screenH } = useLandscapeLock();
  const cardWidth = cardWidthFor(screenW, screenH, CARD_GAP, CARD_HEIGHT_RATIO);
  const drawerWidth = Math.min(360, screenW * 0.42);

  // 선택 시 도달할 강화 레벨(신규=1, 보유 중이면 현재+1, 최대치 clamp).
  const nextLevel = (aug: ArenaAugment) => {
    const cur = arena.pickedAugments.find((p) => p.augment.id === aug.id);
    return cur ? Math.min(cur.level + 1, aug.maxLevel) : 1;
  };

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
        // 12라운드를 돌린 결과가 아직 어디에도 없다. 여기서 그냥 물러나면 화면은
        // 마지막 step 에 멈춘 채 남고 사용자에게 남는 선택지는 나가기(=결과 소실)뿐이었다.
        // 다시 시도할 길과, 포기하겠다는 명시적 선택지를 함께 준다.
        savingRef.current = false;
        Alert.alert(translate("saveError"), translate("saveErrorBody"), [
          {
            text: translate("retry"),
            onPress: () => setRetryCount((n) => n + 1),
          },
          {
            text: translate("discard"),
            style: "destructive",
            onPress: () => {
              router.dismissTo("/");
              lockPortraitAfterExit();
            },
          },
        ]);
        return;
      }
      // 저장을 기다리는 동안 헤더의 나가기가 계속 살아 있다. 이미 나갔으면 회전도
      // navigation 도 하지 않는다 — 방향은 나가기 경로가 되돌려 놨다.
      if (!alive.current) return;
      await lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      if (!alive.current) return;
      router.dismissTo("/");
      router.push({ pathname: "/build/[id]", params: { id: build.id } });
    })();
    // arena 는 매 렌더 새로 만들어지는 객체라 통째로 deps 에 넣으면 이 effect 가 매
    // 렌더 실행된다(savingRef 는 본문 실행만 막을 뿐 effect 자체는 계속 돌았다).
    // done 이 서는 순간이 곧 최종 상태이고 그 뒤로 바뀌는 값이 없으므로, 트리거는
    // done 과 "다시 시도"뿐이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arena.done, retryCount]);

  const handleExit = useCallback(() => {
    Alert.alert(translate("exitConfirm"), "", [
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
  }, [router, translate]);

  // 회전이 끝날 때까지 본문 렌더 보류(portrait→landscape reflow 방지).
  if (!isLandscape) {
    return <ThemedView style={styles.container} />;
  }

  const isShop = arena.step.kind === "shop";
  // step이 바뀌면 카드가 재마운트되며 flip으로 등장한다.
  const cardKey = (id: string) => `${anim.roundKey}-${arena.stepIndex}-${id}`;

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
          <View style={[styles.header, { paddingHorizontal: HEADER_PAD }]}>
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
                  color={ArenaGold}
                />
                <ThemedText
                  type="label"
                  style={{ color: ArenaGold, fontWeight: "800" }}
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
            <CardRow>
              {arena.augmentCards.map((aug, i) => (
                <ArenaAugmentCard
                  key={cardKey(aug.id)}
                  augment={aug}
                  level={nextLevel(aug)}
                  maxLevel={aug.maxLevel}
                  cardWidth={cardWidth}
                  index={i}
                  exitMode={anim.exitModes[i]}
                  entryMode={anim.entryModes[i]}
                  disabled={anim.animating}
                  rerolled={arena.rerolled[i]}
                  onPick={() => anim.pick(i, () => arena.pickAugment(aug))}
                  onReroll={() => anim.reroll(i, () => arena.rerollAugment(i))}
                />
              ))}
            </CardRow>
          )}

          {arena.step.kind === "prismatic" && (
            <CardRow>
              {arena.prismaticCards.map((item, i) => (
                <ArenaPrismaticCard
                  key={cardKey(item.id)}
                  item={item}
                  cardWidth={cardWidth}
                  index={i}
                  exitMode={anim.exitModes[i]}
                  entryMode={anim.entryModes[i]}
                  disabled={anim.animating}
                  rerolled={arena.rerolled[i]}
                  onPick={() => anim.pick(i, () => arena.pickPrismatic(item))}
                  onReroll={() =>
                    anim.reroll(i, () => arena.rerollPrismatic(i))
                  }
                />
              ))}
            </CardRow>
          )}

          {arena.step.kind === "reforge" && !enhancing && (
            <CardRow>
              {arena.reforgeCards.map((special, i) => (
                <ArenaReforgeCard
                  key={cardKey(special.id)}
                  special={special}
                  cardWidth={cardWidth}
                  index={i}
                  exitMode={anim.exitModes[i]}
                  entryMode={anim.entryModes[i]}
                  disabled={anim.animating}
                  onPick={() =>
                    anim.pick(
                      i,
                      // 증강 강화만 advance 대신 보유 증강 선택 오버레이로 이어진다.
                      special.id === ENHANCE_AUGMENT_ID
                        ? () => setEnhancing(true)
                        : () => arena.pickReforge(special),
                    )
                  }
                />
              ))}
            </CardRow>
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

          {/* 증강 강화: 보유 증강 3장 선택 오버레이(고른 증강이 제물) */}
          {enhancing && (
            <ArenaEnhancePicker
              pool={arena.pickedAugments}
              onPick={(augmentId) => {
                arena.enhanceAugment(augmentId);
                setEnhancing(false);
              }}
              onClose={() => setEnhancing(false)}
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
    // aram-screen과 동일 — safe-area top inset 위에 얹히므로 상단 패딩은 작게.
    paddingTop: Spacing.double,
    paddingBottom: Spacing.two,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  roundBox: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
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
