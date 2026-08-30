import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSurface } from "@/components/ui/glass-surface";
import { CARD_ROW_PAD, cardWidthFor } from "@/components/ui/rarity-card-frame";
import { parseDraftMode } from "@/constants/game-modes";
import { Radius, Spacing } from "@/constants/theme";

import { useLandscapeLock } from "@/hooks/use-landscape-lock";
import { lockPortraitAfterExit } from "@/lib/orientation";
import { useTheme } from "@/hooks/use-theme";
import { augmentImageUrl } from "@/lib/ddragon";
import type { DraftMode } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import {
  AramCard,
  type CardEntryMode,
  type CardExitMode,
} from "../components/aram-card";
import { PickedDrawer } from "../components/picked-drawer";
import { RoundIndicator } from "../components/round-indicator";
import { useAram } from "../hooks/use-aram";

const t = {
  ko: {
    round: "라운드",
    picks: "픽 현황",
    exit: "나가기",
    exitConfirmAram: "칼바람을 종료할까요?",
    exitConfirmClassic: "클래식을 종료할까요?",
    exitOk: "종료",
    exitCancel: "계속",
  },
  en: {
    round: "Round",
    picks: "Picks",
    exit: "Exit",
    exitConfirmAram: "Exit ARAM?",
    exitConfirmClassic: "Exit Classic?",
    exitOk: "Exit",
    exitCancel: "Continue",
  },
};

type ExitModes = [CardExitMode, CardExitMode, CardExitMode];
type EntryModes = [CardEntryMode, CardEntryMode, CardEntryMode];

const IDLE: ExitModes = ["none", "none", "none"];
const ALL_FLIP: EntryModes = ["flip", "flip", "flip"];

// 헤더 버튼 좌우 여백 — 카드 영역(CARD_ROW_PAD)보다 넓게 잡아 버튼이 기기 끝에 붙지 않게 한다.
const HEADER_PAD = Spacing.five; // 32
const CARD_GAP = Spacing.four; // 24
// 카드가 세로를 꽉 채우지 않게 56%로 잡아 헤더·하단 리롤 버튼 자리를 남긴다.
const CARD_HEIGHT_RATIO = 0.56;

/**
 * 칼바람·클래식 공용 드래프트 화면. 규칙·UI 는 같고 증강 풀과 라운드 수만 다르다.
 * 모드는 라우트 파라미터로 들어와 아이템 화면(saveBuild)까지 그대로 전달된다.
 */
export function AramScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const {
    championId,
    mode: modeParam,
    rounds: roundsParam,
  } = useLocalSearchParams<{
    championId: string;
    mode?: string;
    rounds?: string;
  }>();
  const mode: DraftMode = parseDraftMode(modeParam);
  // 라운드 수는 챔피언 선택에서 확정해 넘어온다(클래식은 바론 간식 질문으로 4 또는 5).
  // 여기서 묻지 않는 이유는 orientation — 가로 잠금 상태에서 Alert 을 띄우면 잠금이 풀린다.
  const rounds = Number(roundsParam) || 4;

  const { round, currentCards, picked, rerolled, reroll, pick } = useAram(
    mode,
    rounds,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // portrait 복귀는 handleExit에서 명시적으로 처리한다(중간 orientation 변경 방지).
  const { isLandscape, screenW, screenH } = useLandscapeLock();

  const cardWidth = cardWidthFor(screenW, screenH, CARD_GAP, CARD_HEIGHT_RATIO);

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
    // large가 없는 신규(Kiwi) 아이콘은 small로 폴백하므로 두 사이즈 모두 워밍한다.
    const urls = currentCards
      .filter((a) => a.iconPath)
      .flatMap((a) => [
        augmentImageUrl(a.iconPath, "large"),
        augmentImageUrl(a.iconPath, "small"),
      ]);
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
            mode,
          };
          router.replace({ pathname: "/aram-items", params });
        }
      }, 380);
    },
    [animating, championId, mode, pick, router],
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
    Alert.alert(
      translate(mode === "classic" ? "exitConfirmClassic" : "exitConfirmAram"),
      "",
      [
        { text: translate("exitCancel"), style: "cancel" },
        {
          text: translate("exitOk"),
          style: "destructive",
          onPress: () => {
            router.dismissTo("/");
            lockPortraitAfterExit();
          },
        },
      ],
    );
  }, [mode, router, translate]);

  // 회전은 진입 직전(use-champion-select)과 위 useFocusEffect 두 곳에서 건다.
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
      drawerType="front"
      drawerStyle={{ width: drawerWidth, backgroundColor: colors.surface.base }}
      renderDrawerContent={() => (
        <PickedDrawer
          picked={picked}
          width={drawerWidth}
          championId={championId}
          slots={rounds + 1}
        />
      )}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView
          style={styles.safe}
          edges={["top", "bottom", "left", "right"]}
        >
          {/* Header — 네이티브 expo-ui glass 버튼 (iOS 26 미만은 GlassButton 내부 폴백) */}
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
                {translate("round")}
              </ThemedText>
              <RoundIndicator round={round} total={rounds} />
            </GlassSurface>

            <GlassButton
              systemImage="list.bullet"
              fallbackIcon="format-list-bulleted"
              onPress={() => setDrawerOpen(true)}
            />
          </View>

          {/* Cards row */}
          <View style={styles.cardsRow}>
            {currentCards.map((aug, i) => (
              <AramCard
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
    // safe-area top inset 위에 얹히므로 상단 패딩은 작게 — 헤더가 너무 내려오지 않도록.
    paddingTop: Spacing.double,
    paddingBottom: Spacing.two,
  },
  cardsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: CARD_ROW_PAD,
    gap: CARD_GAP,
  },
  roundBox: {
    alignItems: "center",
    gap: Spacing.half,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    // borderCurve: "continuous",
  },
});
