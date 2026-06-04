import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { augmentImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { useDraft } from "../hooks/use-draft";
import { DraftCard, type CardEntryMode, type CardExitMode } from "./draft-card";
import { PickedDrawer } from "./picked-drawer";
import { RoundIndicator } from "./round-indicator";
import { SynergyIcon } from "./synergy-icon";

const t = {
  ko: {
    round: "라운드",
    picks: "픽 현황",
    exit: "나가기",
    exitConfirm: "드래프트를 종료할까요?",
    exitOk: "종료",
    exitCancel: "계속",
  },
  en: {
    round: "Round",
    picks: "Picks",
    exit: "Exit",
    exitConfirm: "Exit the draft?",
    exitOk: "Exit",
    exitCancel: "Continue",
  },
};

type ExitModes = [CardExitMode, CardExitMode, CardExitMode];
type EntryModes = [CardEntryMode, CardEntryMode, CardEntryMode];

const IDLE: ExitModes = ["none", "none", "none"];
const ALL_FLIP: EntryModes = ["flip", "flip", "flip"];

export function DraftScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const { championId } = useLocalSearchParams<{ championId: string }>();

  const { round, currentCards, picked, rerolled, reroll, pick } = useDraft();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 이 화면이 포커스를 얻을 때 landscape로 전환한다. cleanup 없이 — portrait 복귀는
  // handleExit에서 명시적으로 처리해 중간 orientation 변경이 생기지 않도록 한다.
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }, [])
  );

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenW = isLandscape ? width : height;
  const screenH = isLandscape ? height : width;

  const hPad = Spacing.four; // 24
  const cardGap = Spacing.three; // 16

  // Width-constrained: fill 3 columns across
  const cardWidthByW = Math.floor((screenW - hPad * 2 - cardGap * 2) / 3);
  // Height-constrained: card should occupy at most 62% of screen height,
  // leaving room for safe-area insets, header, and reroll button.
  const cardWidthByH = Math.floor(screenH * 0.62 * (9 / 14));
  const cardWidth = Math.min(cardWidthByW, cardWidthByH);

  // Drawer width in landscape
  const drawerWidth = Math.min(340, screenW * 0.38);

  // Animation state
  const [exitModes, setExitModes] = useState<ExitModes>(IDLE);
  // Per-card entry: flip on a new round, fade for a single rerolled card.
  const [entryModes, setEntryModes] = useState<EntryModes>(ALL_FLIP);
  const [animating, setAnimating] = useState(false);
  // roundKey forces card remount (new entry animation) each round
  const [roundKey, setRoundKey] = useState(0);

  // Warm the image cache for the current cards so emblems appear with the card.
  useEffect(() => {
    const urls = currentCards
      .filter((a) => a.iconPath)
      .map((a) => augmentImageUrl(a.iconPath, "large"));
    if (urls.length) Image.prefetch(urls, { cachePolicy: "memory-disk" });
  }, [currentCards]);

  const handlePick = useCallback(
    (idx: number) => {
      if (animating) return;
      setAnimating(true);

      const modes: ExitModes = ["unchosen", "unchosen", "unchosen"];
      modes[idx] = "picked";
      setExitModes(modes);

      // Wait for unchosen exit anim (~350ms), then commit state
      setTimeout(() => {
        const { done, nextPicked } = pick(idx);
        setExitModes(IDLE);
        setEntryModes(ALL_FLIP); // next round flips in
        setRoundKey((k) => k + 1);
        setAnimating(false);

        if (done) {
          const params = {
            picked: JSON.stringify(nextPicked),
            championId: championId ?? "",
          };
          router.replace({ pathname: "/draft-items", params });
        }
      }, 380);
    },
    [animating, championId, pick, router],
  );

  const handleReroll = useCallback(
    (idx: number) => {
      if (animating) return;
      setAnimating(true);

      const modes: ExitModes = ["none", "none", "none"];
      modes[idx] = "reroll";
      setExitModes(modes);

      // Wait for the fade-out (~200ms), then swap the augment so it fades back in.
      setTimeout(() => {
        // The rerolled card remounts (new id) — mark it to fade in, not flip.
        setEntryModes((prev) => {
          const next = [...prev] as EntryModes;
          next[idx] = "fade";
          return next;
        });
        const newAugment = reroll(idx);
        if (newAugment?.iconPath) {
          Image.prefetch([augmentImageUrl(newAugment.iconPath, "large")], {
            cachePolicy: "memory-disk",
          });
        }
        setExitModes(["none", "none", "none"]);
        setAnimating(false);
      }, 220);
    },
    [animating, reroll],
  );

  const handleExit = useCallback(() => {
    Alert.alert(translate("exitConfirm"), "", [
      { text: translate("exitCancel"), style: "cancel" },
      {
        text: translate("exitOk"),
        style: "destructive",
        onPress: () => {
          // navigation 전에 portrait를 먼저 걸어 exit 애니메이션이 portrait로 재생된다.
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
          router.dismissTo("/");
        },
      },
    ]);
  }, [router, translate]);

  // 화면은 portrait로 mount되고 _layout의 pathname lock이 landscape로 회전시킨다.
  // 회전이 끝날 때까지 카드 렌더를 보류해, 카드가 portrait 레이아웃으로 먼저
  // 떴다가 reflow되는 일을 막는다.
  if (!isLandscape) {
    return <ThemedView style={styles.container} />;
  }

  return (
    <Drawer
      open={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}
      drawerPosition="right"
      drawerType="slide"
      drawerStyle={{ width: drawerWidth, backgroundColor: colors.surface.base }}
      renderDrawerContent={() => (
        <PickedDrawer
          picked={picked}
          width={drawerWidth}
          championId={championId}
        />
      )}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView
          style={styles.safe}
          edges={["top", "bottom", "left", "right"]}
        >
          {/* Header */}
          <View style={[styles.header, { paddingHorizontal: hPad }]}>
            <Pressable onPress={handleExit} style={styles.headerBtn}>
              <SynergyIcon
                name="close"
                size={18}
                color={colors.text.secondary}
              />
              <ThemedText type="label" color="secondary">
                {translate("exit")}
              </ThemedText>
            </Pressable>

            <View style={styles.headerCenter}>
              <ThemedText type="label" color="tertiary">
                {translate("round")}
              </ThemedText>
              <RoundIndicator round={round} />
            </View>

            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={styles.headerBtn}
            >
              <SynergyIcon
                name="format-list-bulleted"
                size={18}
                color={colors.accent.default}
              />
              <ThemedText type="label" style={{ color: colors.accent.default }}>
                {translate("picks")} {picked.length}/4
              </ThemedText>
            </Pressable>
          </View>

          {/* Cards row */}
          <View
            style={[
              styles.cardsRow,
              {
                paddingHorizontal: hPad,
                gap: cardGap,
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            {currentCards.map((aug, i) => (
              <DraftCard
                key={`${roundKey}-${aug.id}`}
                augment={aug}
                index={i}
                cardWidth={cardWidth}
                exitMode={exitModes[i]}
                entryMode={entryModes[i]}
                disabled={animating}
                rerolled={rerolled[i]}
                onPick={() => handlePick(i)}
                onReroll={() => handleReroll(i)}
              />
            ))}
          </View>
        </SafeAreaView>
      </ThemedView>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.two,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    padding: Spacing.two,
  },
  headerCenter: {
    alignItems: "center",
    gap: Spacing.one,
  },
  cardsRow: {
    flexDirection: "row",
  },
});
