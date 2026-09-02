/**
 * 칼바람·클래식 공용 드래프트 화면. 규칙·UI 는 같고 증강 풀과 라운드 수만 다르다.
 * 모드는 라우트 파라미터로 들어와 아이템 화면(saveBuild)까지 그대로 전달된다.
 *
 * 카드 3장의 선택·리롤 연출은 useCardPickAnim 이, 실제 트랜지션은 PickCard 가 맡는다
 * (아레나 화면과 같은 조합).
 */
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
import { CardRow } from "@/components/ui/pick-card";
import {
  CARD_GAP,
  CARD_HEIGHT_RATIO,
  cardWidthFor,
} from "@/components/ui/rarity-card-frame";
import { parseDraftMode } from "@/constants/game-modes";
import { Radius, Spacing } from "@/constants/theme";
import { useCardPickAnim } from "@/hooks/use-card-pick-anim";
import { useLandscapeLock } from "@/hooks/use-landscape-lock";
import { useTheme } from "@/hooks/use-theme";
import type { DraftMode } from "@/lib/build-storage";
import { augmentImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { lockPortraitAfterExit } from "@/lib/orientation";
import { AramCard } from "../components/aram-card";
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

// 헤더 버튼 좌우 여백 — 카드 영역(CARD_ROW_PAD)보다 넓게 잡아 버튼이 기기 끝에 붙지 않게 한다.
const HEADER_PAD = Spacing.five; // 32

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
  const anim = useCardPickAnim();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // portrait 복귀는 handleExit에서 명시적으로 처리한다(중간 orientation 변경 방지).
  const { isLandscape, screenW, screenH } = useLandscapeLock();

  const cardWidth = cardWidthFor(screenW, screenH, CARD_GAP, CARD_HEIGHT_RATIO);
  const drawerWidth = Math.min(340, screenW * 0.38);

  // 현재 카드의 이미지 캐시를 데워 엠블럼이 카드와 함께 뜨게 한다.
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

  // 마지막 라운드를 고르면 아이템 선택으로 넘어간다. 픽 연출이 끝난 뒤 호출되므로
  // 도중에 화면을 나가면 훅이 타이머를 끊어 이 콜백 자체가 실행되지 않는다.
  const commitPick = (idx: number) => {
    const { done, nextPicked } = pick(idx);
    if (!done) return;
    router.replace({
      pathname: "/aram-items",
      params: {
        picked: JSON.stringify(nextPicked),
        championId: championId ?? "",
        mode,
      },
    });
  };

  const swapCard = (idx: number) => {
    const newAugment = reroll(idx);
    if (newAugment?.iconPath) {
      Image.prefetch([augmentImageUrl(newAugment.iconPath, "large")], {
        cachePolicy: "memory-disk",
      });
    }
  };

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

  // 회전은 진입 직전(use-champion-select)과 useLandscapeLock 두 곳에서 건다.
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

          <CardRow>
            {currentCards.map((aug, i) => (
              <AramCard
                key={`${anim.roundKey}-${aug.id}`}
                augment={aug}
                index={i}
                cardWidth={cardWidth}
                exitMode={anim.exitModes[i]}
                entryMode={anim.entryModes[i]}
                disabled={anim.animating}
                rerolled={rerolled[i]}
                onPick={() => anim.pick(i, () => commitPick(i))}
                onReroll={() => anim.reroll(i, () => swapCard(i))}
              />
            ))}
          </CardRow>
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
  roundBox: {
    alignItems: "center",
    gap: Spacing.half,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
});
