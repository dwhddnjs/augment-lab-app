/**
 * SkillCard — 펜타킬 스킬 강화 카드. 게임의 카드 원본(배경·프레임·문양)을 그대로 쌓아 인게임과 같게 그린다.
 *
 * 스킬 아이콘은 DDragon 원본이 64px 이라 크게 키우면 깨진다. 게임처럼 문양 안에 작게 둔다.
 */
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import {
  PickCard,
  type CardEntryMode,
  type CardExitMode,
} from "@/components/ui/pick-card";
import { CARD_ASPECT } from "@/components/ui/rarity-card-frame";
import { RemoteImage } from "@/components/ui/remote-image";
import { HeroOverlay, Radius, SkillCardColors, Spacing } from "@/constants/theme";
import { useChampions } from "@/features/champions/hooks/use-champions";
import type { ChampionSpells } from "@/features/champions/types";
import { HEADLINER_LOGOS, SKILL_CARD_ART } from "@/features/headliners/assets";
import { useHeadlinerTexts } from "@/features/headliners/hooks/use-headliners";
import type { SkillKey } from "@/features/headliners/types";
import { championSquareUrl, spellImageUrl } from "@/lib/ddragon";

const LOGO_SIZE = 40;
const PORTRAIT_SIZE = 32;
const SWIRL_SIZE = 74;
const ICON_SIZE = 34;

const MARK_COLORS: Record<string, string> = {
  e: SkillCardColors.empower,
  s: SkillCardColors.spell,
  h: SkillCardColors.heal,
  b: SkillCardColors.shield,
};

/** "[s]스킬[/s] [e]강화[/e]!" 처럼 표시한 구간만 색을 입힌다. */
function renderMarked(text: string) {
  return text.split(/(\[[esbh]\].*?\[\/[esbh]\])/).map((part, i) => {
    const mark = part.match(/^\[([esbh])\](.*)\[\/[esbh]\]$/);
    if (!mark) return part;
    return (
      <Text key={i} style={{ color: MARK_COLORS[mark[1]] }}>
        {mark[2]}
      </Text>
    );
  });
}

interface Props {
  skill: SkillKey;
  championId?: string;
  spells?: ChampionSpells;
  index: number;
  cardWidth: number;
  exitMode: CardExitMode;
  entryMode: CardEntryMode;
  disabled: boolean;
  onPick: () => void;
}

export function SkillCard({
  skill,
  championId,
  spells,
  index,
  cardWidth,
  exitMode,
  entryMode,
  disabled,
  onPick,
}: Props) {
  const texts = useHeadlinerTexts();
  const champion = useChampions().find((c) => c.id === championId);
  const spell = spells?.[skill];
  const keyLabel = skill.toUpperCase();
  const spellName = spell?.name ?? keyLabel;

  return (
    <PickCard
      index={index}
      exitMode={exitMode}
      entryMode={entryMode}
      disabled={disabled}
      onPress={onPick}
    >
      <View
        style={[
          styles.card,
          { width: cardWidth, height: Math.round(cardWidth * CARD_ASPECT) },
        ]}
      >
        <Image
          source={SKILL_CARD_ART.background}
          style={StyleSheet.absoluteFill}
          contentFit="fill"
        />
        <Image
          source={SKILL_CARD_ART.frame}
          style={StyleSheet.absoluteFill}
          contentFit="fill"
        />

        <View style={styles.content}>
          <View style={styles.emblem}>
            <Image
              source={SKILL_CARD_ART.swirl}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              tintColor={SkillCardColors.swirl}
            />
            <View style={styles.icon}>
              {spell && (
                <RemoteImage
                  uri={spellImageUrl(spell.image)}
                  size={ICON_SIZE}
                  accessibilityLabel={spell.name}
                />
              )}
              <Image
                source={SKILL_CARD_ART.iconFrame}
                style={StyleSheet.absoluteFill}
                contentFit="fill"
              />
            </View>
            <ThemedText allowFontScaling={false} style={styles.key}>
              [{keyLabel}]
            </ThemedText>
          </View>

          <ThemedText
            allowFontScaling={false}
            numberOfLines={1}
            style={styles.name}
          >
            {texts.skills[skill]}
          </ThemedText>

          <View style={styles.description}>
            <ThemedText
              allowFontScaling={false}
              numberOfLines={2}
              lineBreakStrategyIOS="hangul-word"
              style={styles.body}
            >
              {renderMarked(texts.skillTitle.replaceAll("{spell}", spellName))}
            </ThemedText>
            <ThemedText
              allowFontScaling={false}
              lineBreakStrategyIOS="hangul-word"
              style={styles.body}
            >
              {renderMarked(texts.skillBonus.replaceAll("{spell}", spellName))}
            </ThemedText>
          </View>
        </View>

        {champion && (
          <RemoteImage
            uri={championSquareUrl(champion.imageKey)}
            size={PORTRAIT_SIZE}
            recyclingKey={champion.id}
            style={styles.portrait}
          />
        )}
        <Image
          source={HEADLINER_LOGOS.pentakill}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
    </PickCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    boxShadow: SkillCardColors.glow,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three + Spacing.half,
  },
  emblem: {
    width: SWIRL_SIZE,
    height: SWIRL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginTop: Spacing.one,
  },
  key: {
    fontSize: 9,
    lineHeight: 11,
    color: SkillCardColors.key,
  },
  // 이름·설명 크기는 증강 카드(RarityCardFrame)와 같다.
  name: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    color: HeroOverlay.textPrimary,
    marginTop: Spacing.one,
  },
  description: {
    marginTop: Spacing.one,
    gap: Spacing.half,
  },
  body: {
    fontSize: 8,
    lineHeight: 12,
    textAlign: "center",
    color: SkillCardColors.body,
  },
  portrait: {
    position: "absolute",
    top: -Spacing.one,
    left: -Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: SkillCardColors.portraitRing,
  },
  logo: {
    position: "absolute",
    top: -LOGO_SIZE / 2,
    alignSelf: "center",
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
