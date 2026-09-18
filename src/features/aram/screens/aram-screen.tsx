/**
 * 칼바람·클래식 공용 드래프트 화면. 규칙·UI 는 같고 증강 풀과 라운드 수만 다르다.
 * 모드는 라우트 파라미터로 들어와 아이템 화면(saveBuild)까지 그대로 전달된다.
 *
 * 카드 3장의 선택·리롤 연출은 useCardPickAnim 이, 실제 트랜지션은 PickCard 가 맡는다.
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { parseGameMode } from "@/constants/game-modes";
import { Radius, Spacing } from "@/constants/theme";
import { useCardPickAnim } from "@/hooks/use-card-pick-anim";
import { useLandscapeLock } from "@/hooks/use-landscape-lock";
import { useTheme } from "@/hooks/use-theme";
import type { GameMode } from "@/lib/build-storage";
import { augmentImageUrls } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { prefetchOne } from "@/lib/image-prewarm";
import { lockPortraitAfterExit } from "@/lib/orientation";
import { AramCard } from "../components/aram-card";
import { PickedDrawer } from "../components/picked-drawer";
import { RoundIndicator } from "../components/round-indicator";
import { useAram } from "../hooks/use-aram";

const t = {
  ko: {
    round: "라운드",
    exit: "나가기",
    picks: "픽 현황",
    exitConfirmAram: "칼바람을 종료할까요?",
    exitConfirmClassic: "클래식을 종료할까요?",
    exitOk: "종료",
    exitCancel: "계속",
  },
  en: {
    round: "Round",
    exit: "Exit",
    picks: "Picks",
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
  const mode: GameMode = parseGameMode(modeParam);
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

  // 현재 카드의 이미지 캐시를 데워 엠블럼이 카드와 함께 뜨게 한다. 리롤로 한 장이 바뀌어도
  // currentCards 가 바뀌어 여기서 받는다(이미 받은 장은 캐시라 바로 끝난다).
  useEffect(() => {
    // 폴백 주소를 앞에서부터 받다가 성공한 데서 멈춘다 — 실제로 그려질 한 장만 받는다.
    currentCards
      .filter((a) => a.iconPath)
      .forEach((a) => prefetchOne(augmentImageUrls(a.iconPath)));
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

  const handleExit = () => {
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
  };

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
              accessibilityLabel={translate("exit")}
              onPress={handleExit}
            />
            <GlassSurface style={styles.roundBox}>
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
              accessibilityLabel={translate("picks")}
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
                onReroll={() => anim.reroll(i, () => reroll(i))}
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
