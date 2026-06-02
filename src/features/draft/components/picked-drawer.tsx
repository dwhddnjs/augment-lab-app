import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed/themed-text';
import { AugmentRarityColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Augment } from '@/features/augments/types';
import { useTranslation } from '@/lib/i18n';
import { AugmentIcon } from './augment-icon';

const t = {
  ko: { title: '뽑은 증강', empty: '비어있음' },
  en: { title: 'Picked Augments', empty: 'Empty' },
};

const RARITY_SF: Record<string, string> = {
  silver: 'sf:shield.fill',
  gold: 'sf:star.fill',
  prismatic: 'sf:sparkles',
};

// Base slots (= rounds). "Transmute: Chaos" can push picks past this.
const BASE_SLOTS = 4;

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
    <View style={[styles.cell, { width: size, height: size + 32 }]}>
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

interface Props {
  picked: Augment[];
}

export function PickedDrawer({ picked }: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const drawerW = Math.min(360, width * 0.4);
  const cellSize = (drawerW - Spacing.three * 2 - Spacing.two) / 2;

  // Grid grows past the 4 base slots when Transmute: Chaos adds bonus augments.
  const total = Math.max(BASE_SLOTS, picked.length);
  const slots: (Augment | null)[] = Array.from({ length: total }, (_, i) => picked[i] ?? null);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface.base }]} edges={['top', 'bottom', 'right']}>
      <ThemedText type="heading" style={{ paddingHorizontal: Spacing.three, paddingTop: Spacing.three }}>
        {translate('title')}
      </ThemedText>
      <ThemedText type="caption" color="tertiary" style={{ paddingHorizontal: Spacing.three, paddingBottom: Spacing.three }}>
        {picked.length} / {total}
      </ThemedText>
      <FlatList
        data={slots}
        numColumns={2}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}
        columnWrapperStyle={{ gap: Spacing.two }}
        renderItem={({ item }) => <AugmentCell augment={item} size={cellSize} />}
        scrollEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
