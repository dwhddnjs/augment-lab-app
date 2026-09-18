import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { RemoteImage } from '@/components/ui/remote-image';
import { Radius, Spacing } from '@/constants/theme';
import type { Champion } from '@/features/champions/types';
import { TierMark } from '@/features/tierlist/components/tier-mark';
import { useTierColors } from '@/features/tierlist/hooks/use-tier-colors';
import { pct } from '@/features/tierlist/tiers';
import type { TierRow } from '@/features/tierlist/types';
import { championSquareUrl } from '@/lib/ddragon';
import { CHAMPION_TAG_LABELS, useTranslation } from '@/lib/i18n';

const t = {
  ko: { winRate: '승률', pickRate: '픽률' },
  en: { winRate: 'Win', pickRate: 'Pick' },
};

/** 챔피언 이름 옆 티어 배지 한 변. heading(20/28) 한 줄 안에 들어간다. */
const TIER_BADGE = 26;

interface Props {
  champion: Champion;
  row: TierRow;
}

/** 상세 모달 맨 위 — 초상화(테두리는 등급색) + 티어 배지·이름 + 역할 + 승률·픽률. */
export function TierlistChampionHeader({ champion, row }: Props) {
  const translate = useTranslation(t);
  const translateTag = useTranslation(CHAMPION_TAG_LABELS);
  const tierColor = useTierColors()[row.tier];

  return (
    <View style={styles.header}>
      <RemoteImage
        uri={championSquareUrl(champion.imageKey)}
        style={[styles.portrait, { borderColor: tierColor }]}
        recyclingKey={champion.id}
      />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          {/* 티어리스트 배너와 같은 결 — 등급색을 좌우로 흘리고 글자는 흰색. */}
          <TierMark tier={row.tier} type="label" style={styles.tierBadge} />
          <ThemedText type="heading">{champion.name}</ThemedText>
        </View>
        <ThemedText type="caption" color="secondary">
          {champion.tags.map((tag) => translateTag(tag) || tag).join(' · ')}
        </ThemedText>
        <ThemedText type="label" color="accent">
          {`${translate('winRate')} ${pct(row.score)}`}
          <ThemedText type="label" color="secondary">
            {` · ${translate('pickRate')} ${pct(row.sub)}`}
          </ThemedText>
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  portrait: {
    // 옆 body 높이에 맞춰 늘어난다(부모 alignItems: 'center' 를 덮는다).
    alignSelf: 'stretch',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tierBadge: {
    width: TIER_BADGE,
    height: TIER_BADGE,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
});
