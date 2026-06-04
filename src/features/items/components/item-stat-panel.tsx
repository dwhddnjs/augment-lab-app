/**
 * ItemStatPanel — 챔피언 기본 스탯 + 아이템 합산 스탯을 행으로 표시.
 * 글래스 배경 패널.
 */
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { GlassSurface } from '@/components/ui/glass-surface';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';
import {
  computeStats,
  STAT_DISPLAY_ORDER,
  STAT_LABELS,
  type ComputedStats,
} from '../stats';
import type { ChampionStats } from '@/features/champions/types';
import type { ItemStats } from '../types';

const t = {
  ko: { stats: '스탯' },
  en: { stats: 'Stats' },
};

interface ItemStatPanelProps {
  baseStats: ChampionStats;
  itemStatsList: ItemStats[];
}

export function ItemStatPanel({ baseStats, itemStatsList }: ItemStatPanelProps) {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  const { locale } = useLocale();

  const computed: ComputedStats = computeStats(baseStats, itemStatsList);

  return (
    <GlassSurface style={[styles.container, { borderColor: colors.border.subtle, borderWidth: 1 }]}>
      <ThemedText type="caption" color="secondary" style={styles.heading}>
        {translate('stats')}
      </ThemedText>
      <View style={styles.rows}>
        {STAT_DISPLAY_ORDER.map((key) => {
          const label = STAT_LABELS[key];
          const value = computed[key];
          const unit = label.unit ?? '';
          // 표시 포맷: 공격속도는 소수점 3자리
          const formatted =
            key === 'attackspeed' ? value.toFixed(3) : Math.round(value as number).toString();
          // mp가 0이면 표시 안 함
          if (key === 'mp' && computed.mp === 0) return null;
          // 파생 스탯이 0이면 표시 안 함
          if ((key === 'abilitypower' || key === 'lifesteal') && (value as number) === 0)
            return null;

          return (
            <View key={key} style={styles.row}>
              <ThemedText type="caption" color="secondary" numberOfLines={1}>
                {label[locale]}
              </ThemedText>
              <ThemedText type="caption" color="primary">
                {formatted}{unit}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  heading: {
    marginBottom: Spacing.one,
  },
  rows: {
    gap: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
