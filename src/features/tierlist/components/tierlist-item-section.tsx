import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { Spacing } from '@/constants/theme';
import { TierlistItemGrid } from '@/features/tierlist/components/tierlist-item-grid';
import { TierlistSpellPill } from '@/features/tierlist/components/tierlist-spell-pill';
import type { TierRow } from '@/features/tierlist/types';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { items: '아이템', buildOrder: '빌드 순서', situational: '상황별 아이템' },
  en: { items: 'Items', buildOrder: 'Build Order', situational: 'Situational' },
};

/** 아이템 섹션 — 제목(오른쪽 끝에 추천 스펠) + 빌드 순서 + 상황별 아이템. */
export function TierlistItemSection({ row }: { row: TierRow }) {
  const translate = useTranslation(t);

  // 격자·스펠 pill 은 비면 스스로 숨는다 — 셋 다 비면 제목만 남지 않게 섹션째 뺀다.
  if (!row.build.length && !row.situational.length && !row.spells.length) return null;

  return (
    <>
      <View style={styles.title}>
        <ThemedText type="heading">{translate('items')}</ThemedText>
        <TierlistSpellPill spells={row.spells} pick={row.spellPick} />
      </View>
      <TierlistItemGrid label={translate('buildOrder')} ids={row.build} />
      <TierlistItemGrid label={translate('situational')} ids={row.situational} />
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    // 증강 섹션(버튼)과 한 단계 더 띄워 두 섹션이 갈려 보이게.
    paddingTop: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
