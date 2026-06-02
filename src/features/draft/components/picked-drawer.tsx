import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed/themed-text';
import { AugmentRarityColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import type { Augment } from '@/features/augments/types';
import { useSynergies } from '@/features/augments/hooks/use-synergies';
import { useChampions } from '@/features/champions/hooks/use-champions';
import type { Champion } from '@/features/champions/types';
import { championSquareUrl } from '@/lib/ddragon';
import { useTranslation } from '@/lib/i18n';
import { AugmentIcon } from './augment-icon';

const t = {
  ko: {
    title: '내 빌드',
    augments: '증강',
    synergy: '시너지',
    hp: '체력',
    ad: '공격력',
    armor: '방어력',
    mr: '마저',
    ms: '이속',
    Fighter: '전사',
    Mage: '마법사',
    Assassin: '암살자',
    Tank: '탱커',
    Marksman: '원거리',
    Support: '서포터',
  },
  en: {
    title: 'My Build',
    augments: 'Augments',
    synergy: 'Synergies',
    hp: 'HP',
    ad: 'AD',
    armor: 'Armor',
    mr: 'MR',
    ms: 'MS',
    Fighter: 'Fighter',
    Mage: 'Mage',
    Assassin: 'Assassin',
    Tank: 'Tank',
    Marksman: 'Marksman',
    Support: 'Support',
  },
};

const RARITY_SF: Record<string, string> = {
  silver: 'sf:shield.fill',
  gold: 'sf:star.fill',
  prismatic: 'sf:sparkles',
};

// UI shows 5 slots; the draft logic itself still resolves in 4 picks.
const BASE_SLOTS = 5;

type Translate = (key: string) => string;

interface AugmentCellProps {
  augment: Augment | null;
  size: number;
}

function AugmentCell({ augment, size }: AugmentCellProps) {
  const { colors } = useTheme();

  if (!augment) {
    return (
      <View
        style={[
          styles.emptyCell,
          {
            width: size,
            height: size,
            borderColor: colors.border.subtle,
            backgroundColor: colors.surface.sunken,
          },
        ]}
      />
    );
  }

  const rarityColors = AugmentRarityColors[augment.rarity];
  const tint = rarityColors.border;

  return (
    <View style={[styles.cell, { width: size }]}>
      <View
        style={[
          styles.iconWrapper,
          {
            width: size,
            height: size,
            backgroundColor: colors.surface.raised,
            borderColor: rarityColors.border,
            shadowColor: rarityColors.glow,
            shadowOpacity: 1,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8,
          },
        ]}
      >
        <AugmentIcon
          key={augment.id}
          iconPath={augment.iconPath}
          size={Math.round(size * 0.66)}
          tint={tint}
          fallbackSymbol={RARITY_SF[augment.rarity] ?? 'sf:sparkles'}
          recyclingKey={augment.id}
        />
      </View>
      <ThemedText
        numberOfLines={2}
        ellipsizeMode="tail"
        color="secondary"
        style={[styles.cellName, { width: size }]}
      >
        {augment.name}
      </ThemedText>
    </View>
  );
}

interface ChampionSummaryProps {
  champion: Champion;
  translate: Translate;
}

function ChampionSummary({ champion, translate }: ChampionSummaryProps) {
  const { colors } = useTheme();

  const stats: { key: string; value: number }[] = [
    { key: 'hp', value: Math.round(champion.stats.hp) },
    { key: 'ad', value: Math.round(champion.stats.attackdamage) },
    { key: 'armor', value: Math.round(champion.stats.armor) },
    { key: 'mr', value: Math.round(champion.stats.spellblock) },
    { key: 'ms', value: Math.round(champion.stats.movespeed) },
  ];

  return (
    <View style={styles.champBlock}>
      <View style={styles.champHeader}>
        <Image
          source={{ uri: championSquareUrl(champion.imageKey) }}
          style={[styles.champIcon, { borderColor: colors.accent.default }]}
          contentFit="cover"
        />
        <View style={styles.champMeta}>
          <ThemedText type="heading" numberOfLines={1}>
            {champion.name}
          </ThemedText>
          <View style={styles.tagRow}>
            {champion.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tagChip, { backgroundColor: colors.accent.subtle }]}
              >
                <ThemedText type="caption" style={{ color: colors.accent.default }}>
                  {translate(tag)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.statRow}>
        {stats.map((s) => (
          <View
            key={s.key}
            style={[
              styles.statChip,
              { backgroundColor: colors.surface.raised, borderColor: colors.border.subtle },
            ]}
          >
            <ThemedText type="caption" color="tertiary">
              {translate(s.key)}
            </ThemedText>
            <ThemedText type="label">{s.value}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

interface Props {
  picked: Augment[];
  /** Actual drawer container width (from the parent <Drawer>). */
  width: number;
  championId?: string;
}

export function PickedDrawer({ picked, width, championId }: Props) {
  const translate = useTranslation(t) as Translate;
  const { locale } = useLocale();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const champions = useChampions();
  const champion = championId
    ? champions.find((c) => c.id === championId)
    : undefined;

  const synergies = useSynergies(picked.map((a) => a.id));
  const activeSynergies = synergies.filter((s) => s.active);

  // Content padding: left is fixed, right also absorbs the safe-area inset so
  // the background stays full-bleed while text/cells never hit the notch/home bar.
  const padLeft = Spacing.three;
  const padRight = Spacing.three + insets.right;
  // Two-column grid filling the available width (no leftover gap on the right).
  const cellSize = (width - padLeft - padRight - Spacing.two) / 2;

  // Grid grows past the 5 base slots if Transmute: Chaos adds bonus augments.
  const total = Math.max(BASE_SLOTS, picked.length);
  const slots: (Augment | null)[] = Array.from(
    { length: total },
    (_, i) => picked[i] ?? null,
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface.base }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={{
          paddingLeft: padLeft,
          paddingRight: padRight,
          paddingVertical: Spacing.three,
          gap: Spacing.four,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="heading">{translate('title')}</ThemedText>

        {champion && <ChampionSummary champion={champion} translate={translate} />}

        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate('augments')} {picked.length}/{BASE_SLOTS}
          </ThemedText>
          <View style={styles.grid}>
            {slots.map((item, i) => (
              <AugmentCell key={i} augment={item} size={cellSize} />
            ))}
          </View>
        </View>

        {activeSynergies.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="label" color="secondary">
              {translate('synergy')}
            </ThemedText>
            {activeSynergies.map(({ synergy, count }) => (
              <View
                key={synergy.id}
                style={[
                  styles.synergyRow,
                  { backgroundColor: colors.accent.subtle, borderColor: colors.accent.default },
                ]}
              >
                <Image
                  source={synergy.icon}
                  style={styles.synergyIcon}
                  tintColor={colors.accent.default}
                />
                <View style={styles.synergyMeta}>
                  <ThemedText type="label" style={{ color: colors.accent.default }}>
                    {synergy.name[locale] ?? synergy.name.en}
                  </ThemedText>
                  <ThemedText type="caption" color="secondary" numberOfLines={2}>
                    {synergy.description[locale] ?? synergy.description.en}
                  </ThemedText>
                </View>
                <ThemedText type="caption" color="tertiary">
                  {count}/{synergy.minCount}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  emptyCell: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  cellName: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  iconWrapper: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  champBlock: {
    gap: Spacing.three,
  },
  champHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  champIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  champMeta: {
    flex: 1,
    gap: Spacing.one,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tagChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statChip: {
    minWidth: 56,
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  synergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  synergyIcon: {
    width: 18,
    height: 18,
  },
  synergyMeta: {
    flex: 1,
    gap: Spacing.half,
  },
});
