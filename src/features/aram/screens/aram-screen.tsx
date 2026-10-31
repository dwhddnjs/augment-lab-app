/**
 * 칼바람 드래프트 화면.
 * 모드는 라우트 파라미터로 들어와 아이템 화면(saveBuild)까지 그대로 전달된다.
 *
 * 카드 3장의 선택·리롤 연출은 useCardPickAnim 이, 실제 트랜지션은 PickCard 가 맡는다.
 * 헤드라이너 등장 연출이 화면을 덮고, 끝난 뒤에 카드를 그린다 — flip 등장은 카드가 마운트될 때 재생된다.
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
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
import { useChampionSpells } from "@/features/champions/hooks/use-champion-spells";
import { HeadlinerLogo } from "@/features/headliners/components/headliner-logo";
import { useHeadlinerTexts } from "@/features/headliners/hooks/use-headliners";
import {
  ARAM_ROUNDS,
  isHeadlinerId,
  skillChoices,
} from "@/features/headliners/rules";
import { useCardPickAnim } from "@/hooks/use-card-pick-anim";
import { AFTER_MODAL_MS, useLandscapeLock } from "@/hooks/use-landscape-lock";
import { useTheme } from "@/hooks/use-theme";
import type { GameMode } from "@/lib/build-storage";
import { augmentImageUrls, spellImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { prefetchOne } from "@/lib/image-prewarm";
import { lockPortraitAfterExit } from "@/lib/orientation";
import { AramCard } from "../components/aram-card";
import { KdaBadge, StickerBadge, StickerTip } from "../components/card-marks";
import { HeadlinerReveal } from "../components/headliner-reveal";
import { PickedDrawer } from "../components/picked-drawer";
import { RoundIndicator } from "../components/round-indicator";
import { SkillCard } from "../components/skill-card";
import { useAram, type PickResult } from "../hooks/use-aram";

const t = {
  ko: {
    round: "라운드",
    skillRound: "스킬 강화",
    exit: "나가기",
    picks: "픽 현황",
    exitConfirmAram: "칼바람을 종료할까요?",
    exitOk: "종료",
    exitCancel: "계속",
  },
  en: {
    round: "Round",
    skillRound: "Empower",
    exit: "Exit",
    picks: "Picks",
    exitConfirmAram: "Exit ARAM?",
    exitOk: "Exit",
    exitCancel: "Continue",
  },
};

// 헤더 버튼 좌우 여백 — 카드 영역(CARD_ROW_PAD)보다 넓게 잡아 버튼이 기기 끝에 붙지 않게 한다.
const HEADER_PAD = Spacing.five; // 32
const HEADER_LOGO_SIZE = 40;
// 헤더 밑에서 카드까지 내리는 거리(화면 높이 대비). 모든 헤드라이너가 같은 자리를 쓴다.
// 카드 위 K/DA 마크가 헤더에서 떨어지면서도, 가장 긴 HEARTSTEEL 줄이 낮은 기기에서 넘치지 않는 값이다.
const CARD_TOP_RATIO = 0.07;

export function AramScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const {
    championId,
    mode: modeParam,
    headliner: headlinerParam,
  } = useLocalSearchParams<{
    championId: string;
    mode?: string;
    /** 개발 빌드에서 헤드라이너를 고정해 검증한다(augmentlab://aram?...&headliner=kda). */
    headliner?: string;
  }>();
  const mode: GameMode = parseGameMode(modeParam);
  const forcedHeadliner =
    __DEV__ && isHeadlinerId(headlinerParam) ? headlinerParam : undefined;

  const {
    round,
    currentCards,
    picked,
    rerolled,
    progress,
    slotStickers,
    hacked,
    needsSkillPick,
    reroll,
    pick,
    pickSkill,
  } = useAram(mode, forcedHeadliner);
  const anim = useCardPickAnim();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  const headlinerTexts = useHeadlinerTexts();
  const spells = useChampionSpells(championId);
  // K/DA 의 5번째 선택은 라운드가 아니라 4라운드를 마친 뒤의 보너스다.
  const isKdaBonusRound = progress.id === "kda" && round >= ARAM_ROUNDS;

  // portrait 복귀는 handleExit에서 명시적으로 처리한다(중간 orientation 변경 방지).
  const { isLandscape, screenW, screenH } = useLandscapeLock(AFTER_MODAL_MS);

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

  // 펜타킬 스킬 아이콘은 첫 설치 프리웜에 없어 카드가 뜨기 전에 받아 둔다.
  useEffect(() => {
    if (progress.id !== "pentakill" || !spells) return;
    Object.values(spells).forEach((s) => prefetchOne([spellImageUrl(s.image)]));
  }, [progress.id, spells]);

  // 마지막 라운드를 고르면 아이템 선택으로 넘어간다. 픽 연출이 끝난 뒤 호출되므로
  // 도중에 화면을 나가면 훅이 타이머를 끊어 이 콜백 자체가 실행되지 않는다.
  const leaveIfDone = ({ done, nextPicked, nextProgress }: PickResult) => {
    if (!done) return;
    router.replace({
      pathname: "/aram-items",
      params: {
        picked: JSON.stringify(nextPicked),
        headliner: JSON.stringify(nextProgress),
        championId: championId ?? "",
        mode,
      },
    });
  };

  const handleExit = () => {
    Alert.alert(
      translate("exitConfirmAram"),
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

  // 회전은 useLandscapeLock 이 건다. 시트가 걷히면 바로 무대로 이어지도록 라이트 모드에서도 어둡게 둔다.
  // 회전이 끝날 때까지 카드 렌더를 보류해, 카드가 portrait 레이아웃으로 먼저
  // 떴다가 reflow되는 일을 막는다.
  if (!isLandscape) {
    return <View style={styles.rotating} />;
  }

  return (
    <Drawer
      open={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}
      swipeEnabled={introDone}
      drawerPosition="right"
      drawerType="front"
      drawerStyle={{ width: drawerWidth, backgroundColor: colors.surface.base }}
      renderDrawerContent={() => (
        <PickedDrawer
          picked={picked}
          width={drawerWidth}
          championId={championId}
          headliner={progress}
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
            <View>
              {isHeadlinerId(progress.id) && (
                <View
                  accessible
                  accessibilityLabel={
                    headlinerTexts.headliners[progress.id].name
                  }
                  style={styles.headlinerIcon}
                >
                  <HeadlinerLogo id={progress.id} size={HEADER_LOGO_SIZE} plain />
                </View>
              )}
              <GlassSurface style={styles.roundBox}>
                <ThemedText
                  type="label"
                  color="primary"
                  style={{ fontWeight: "800" }}
                >
                  {translate(needsSkillPick ? "skillRound" : "round")}
                </ThemedText>
                <RoundIndicator
                  round={Math.min(round, ARAM_ROUNDS)}
                  total={ARAM_ROUNDS}
                />
              </GlassSurface>
            </View>

            <GlassButton
              systemImage="list.bullet"
              fallbackIcon="format-list-bulleted"
              accessibilityLabel={translate("picks")}
              onPress={() => setDrawerOpen(true)}
            />
          </View>

          {introDone && (
            <CardRow topOffset={Math.round(screenH * CARD_TOP_RATIO)}>
              {needsSkillPick
                ? skillChoices(progress.skills).map((skill, i) => (
                    <SkillCard
                      key={`${anim.roundKey}-${skill}`}
                      skill={skill}
                      championId={championId}
                      spells={spells}
                      index={i}
                      cardWidth={cardWidth}
                      exitMode={anim.exitModes[i]}
                      entryMode={anim.entryModes[i]}
                      disabled={anim.animating}
                      onPick={() =>
                        anim.pick(i, () => leaveIfDone(pickSkill(skill)))
                      }
                    />
                  ))
                : currentCards.map((aug, i) => {
                    const sticker = slotStickers[i];
                    return (
                      <AramCard
                        key={`${anim.roundKey}-${aug.id}`}
                        augment={aug}
                        index={i}
                        cardWidth={cardWidth}
                        exitMode={anim.exitModes[i]}
                        entryMode={anim.entryModes[i]}
                        disabled={anim.animating}
                        rerolled={rerolled[i]}
                        hacked={hacked}
                        variant={isKdaBonusRound ? "kda" : undefined}
                        badge={
                          isKdaBonusRound ? (
                            <KdaBadge />
                          ) : (
                            sticker && <StickerBadge sticker={sticker} />
                          )
                        }
                        footer={
                          progress.id === "heartsteel" ? (
                            <StickerTip sticker={sticker} />
                          ) : undefined
                        }
                        onPick={() => anim.pick(i, () => leaveIfDone(pick(i)))}
                        onReroll={() => anim.reroll(i, () => reroll(i))}
                      />
                    );
                  })}
            </CardRow>
          )}
        </SafeAreaView>

        {!introDone && isHeadlinerId(progress.id) && (
          <HeadlinerReveal id={progress.id} onDone={() => setIntroDone(true)} />
        )}
      </ThemedView>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rotating: {
    flex: 1,
    backgroundColor: HeroOverlay.cardBase,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // safe-area top inset 위에 얹히므로 상단 패딩은 작게 — 헤더가 너무 내려오지 않도록.
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  roundBox: {
    alignItems: "center",
    gap: Spacing.half,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  // 라운드 표시가 헤더 한가운데 남도록 바깥에 띄운다.
  headlinerIcon: {
    position: "absolute",
    right: "100%",
    top: 0,
    bottom: 0,
    marginRight: Spacing.double,
    justifyContent: "center",
  },
});
