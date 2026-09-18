import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { RemoteImage } from '@/components/ui/remote-image';
import { Radius, Spacing, TierColors } from '@/constants/theme';
import type { Champion } from '@/features/champions/types';
import { pct } from '@/features/tierlist/tiers';
import type { TierRow } from '@/features/tierlist/types';
import { useTheme } from '@/hooks/use-theme';
import { championSquareUrl } from '@/lib/ddragon';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { pickShort: '픽' },
  en: { pickShort: 'Pick' },
};

/** 챔피언 아이콘 한 변. 셀 안에 이름·승률 두 줄과 높이를 맞춘다. */
const CHAMPION_ICON = 46;

interface Props {
  champion: Champion;
  row: TierRow;
}

/** 티어표 격자 한 칸 — 아이콘(테두리는 등급색) + 이름 + 승률·픽률. 누르면 상세 모달. */
export function TierlistChampionCell({ champion, row }: Props) {
  const { colors, mode } = useTheme();
  const tierColor = TierColors[mode][row.tier];
  const translate = useTranslation(t);
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.cell, { backgroundColor: colors.surface.raised }]}
      onPress={() =>
        router.push({ pathname: '/tierlist-champion-modal', params: { key: row.key } })
      }
    >
      <RemoteImage
        uri={championSquareUrl(champion.imageKey)}
        size={CHAMPION_ICON}
        recyclingKey={champion.id}
        style={[styles.image, { borderColor: tierColor }]}
      />
      <View style={styles.body}>
        <ThemedText type="label" numberOfLines={1}>
          {champion.name}
        </ThemedText>
        <ThemedText type="caption" color="tertiary" numberOfLines={1}>
          <ThemedText type="caption" color="accent">
            {pct(row.score)}
          </ThemedText>
          {` · ${translate('pickShort')} ${pct(row.sub)}`}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  image: {
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
});
