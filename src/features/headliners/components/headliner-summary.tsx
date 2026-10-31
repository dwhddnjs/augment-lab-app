import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
import { anvilCount, isHeadlinerId, STICKER_IDS } from "../rules";
import type { BuildHeadliner } from "../types";
import { HeadlinerLogo } from "./headliner-logo";
import { SkillIcon } from "./skill-icon";

const t = {
  ko: { headliner: "헤드라이너", gold: "골드 +1,000" },
  en: { headliner: "Headliner", gold: "Gold +1,000" },
};

const ICON_SIZE = 40;
const STAT_ANVIL_ICON = cdragonIconUrl(
  "/lol-game-data/assets/ASSETS/Items/Icons2D/220000_StatAnvil.png",
);

interface Props {
  /** 없으면(옛 빌드·커스텀 빌드) 아무것도 그리지 않는다. */
  headliner?: BuildHeadliner;
  championId?: string;
}

/** 이번 판 헤드라이너와 그걸로 얻은 것. Drawer·아이템 패널·빌드 상세가 함께 쓴다. */
export function HeadlinerSummary({ headliner, championId }: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const rarityColors = useRarityColors();
  const texts = useHeadlinerTexts();
  const spells = useChampionSpells(championId);

  if (!headliner || !isHeadlinerId(headliner.id)) return null;
  const { name, description } = texts.headliners[headliner.id];
  const accent = rarityColors.gold.border;

  return (
    <View style={styles.section}>
      <ThemedText type="label" color="secondary">
        {translate("headliner")}
      </ThemedText>

      <DetailCardRow
        accentColor={colors.accent.default}
        icon={<HeadlinerLogo id={headliner.id} size={ICON_SIZE} />}
        title={name}
        description={description}
      />

      {headliner.skills.map((skill) => (
        <DetailCardRow
          key={skill}
          accentColor={accent}
          icon={<SkillIcon spell={spells?.[skill]} skill={skill} size={ICON_SIZE} />}
          title={[texts.skills[skill], spells?.[skill].name].filter(Boolean).join(" · ")}
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
            accentColor={accent}
            icon={
              <Image
                source={STICKER_PORTRAITS[id]}
                style={styles.portrait}
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
                : sticker.full
            }
          />
        );
      })}

      {headliner.id === "disco" && (
        <DetailCardRow
          accentColor={accent}
          icon={
            <View style={styles.goldIcon}>
              <MaterialCommunityIcons name="circle-multiple" size={22} color={accent} />
            </View>
          }
          title={translate("gold")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  portrait: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.full,
    backgroundColor: HeroOverlay.cardBase,
  },
  anvil: {
    borderRadius: Radius.sm,
  },
  goldIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
