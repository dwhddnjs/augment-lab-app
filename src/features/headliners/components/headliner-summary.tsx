import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { DetailCardRow } from "@/components/ui/detail-card-row";
import { RemoteImage } from "@/components/ui/remote-image";
import { HeroOverlay, Radius, Spacing } from "@/constants/theme";
import { useChampionSpells } from "@/features/champions/hooks/use-champion-spells";
import { useRarityColors } from "@/hooks/use-rarity-colors";
import { useTheme } from "@/hooks/use-theme";
import { cdragonIconUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { STICKER_PORTRAITS } from "../assets";
import { useHeadlinerTexts } from "../hooks/use-headliners";
import { stripMarks } from "../marked";
import { anvilCount, isHeadlinerId, STICKER_IDS } from "../rules";
import type { BuildHeadliner } from "../types";
import { HeadlinerLogo } from "./headliner-logo";
import { SkillIcon } from "./skill-icon";

const t = {
  ko: { headliner: "헤드라이너" },
  en: { headliner: "Headliner" },
};

// 좁은 가로 패널(compact)에선 40pt 아이콘이 글자 폭을 먹어 설명이 한 줄 더 내려간다.
const ICON_SIZE = { normal: 40, compact: 32 };
const STAT_ANVIL_ICON = cdragonIconUrl(
  "/lol-game-data/assets/ASSETS/Items/Icons2D/220000_StatAnvil.png",
);

interface Props {
  /** 없으면(옛 빌드·커스텀 빌드) 아무것도 그리지 않는다. */
  headliner?: BuildHeadliner;
  championId?: string;
  /** 픽 현황 Drawer·아이템 화면처럼 좁은 패널 — 카드 여백과 아이콘을 줄인다. */
  compact?: boolean;
}

/** 이번 판 헤드라이너와 그걸로 얻은 것. Drawer·아이템 패널·빌드 상세가 함께 쓴다. */
export function HeadlinerSummary({ headliner, championId, compact }: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const rarityColors = useRarityColors();
  const texts = useHeadlinerTexts();
  const spells = useChampionSpells(championId);

  if (!headliner || !isHeadlinerId(headliner.id)) return null;
  const { name, description } = texts.headliners[headliner.id];
  const accent = rarityColors.gold.border;
  const iconSize = compact ? ICON_SIZE.compact : ICON_SIZE.normal;
  const iconBox = { width: iconSize, height: iconSize };

  return (
    <View style={styles.section}>
      <ThemedText type="label" color="secondary">
        {translate("headliner")}
      </ThemedText>

      <DetailCardRow
        compact={compact}
        accentColor={colors.accent.default}
        icon={<HeadlinerLogo id={headliner.id} size={iconSize} />}
        title={name}
        description={description}
      />

      {headliner.skills.map((skill) => (
        <DetailCardRow
          key={skill}
          compact={compact}
          accentColor={accent}
          icon={<SkillIcon spell={spells?.[skill]} skill={skill} size={iconSize} />}
          title={[texts.skills[skill], spells?.[skill]?.name].filter(Boolean).join(" · ")}
          description={texts.skillBonusShort}
        />
      ))}

      {STICKER_IDS.map((id) => {
        const count = headliner.stickers.filter((s) => s === id).length;
        if (count === 0) return null;
        const sticker = texts.stickers[id];
        return (
          <DetailCardRow
            key={id}
            compact={compact}
            accentColor={accent}
            icon={
              <Image
                source={STICKER_PORTRAITS[id]}
                style={[styles.portrait, iconBox]}
                contentFit="cover"
                contentPosition="top center"
              />
            }
            title={count > 1 ? `${sticker.name} ×${count}` : sticker.name}
            meta={
              id === "aphelios" ? (
                <RemoteImage uri={STAT_ANVIL_ICON} size={16} style={styles.anvil} />
              ) : undefined
            }
            description={
              id === "aphelios"
                ? texts.anvils.replace("{n}", String(anvilCount(headliner.stickers)))
                : stripMarks(sticker.full) // 색 표기는 카드 위 문구에서만 쓴다
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  portrait: {
    borderRadius: Radius.full,
    backgroundColor: HeroOverlay.cardBase,
  },
  anvil: {
    borderRadius: Radius.sm,
  },
});
