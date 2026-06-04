/**
 * ItemTooltip — LoL 스타일 아이템 툴팁
 * 선택된 아이템을 프레스하면 이름/가격/스탯/설명을 오버레이로 표시한다.
 */
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { GlassSurface } from '@/components/ui/glass-surface';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';
import { itemImageUrl } from '@/lib/ddragon';
import { cleanItemDescription, parseItemStatBlock } from '../item-text';
import type { Item } from '../types';

const t = {
  ko: { cost: '구매 가격', sell: '판매', gold: '골드', dismiss: '닫기' },
  en: { cost: 'Cost', sell: 'Sell', gold: 'Gold', dismiss: 'Dismiss' },
};

interface ItemTooltipProps {
  item: Item;
  onClose: () => void;
}

export function ItemTooltip({ item, onClose }: ItemTooltipProps) {
  const translate = useTranslation(t);
  const { colors } = useTheme();

  const statSegments = parseItemStatBlock(item.description);
  const flavorText = cleanItemDescription(
    item.description.replace(/<stats>[\s\S]*?<\/stats>/i, ''),
  );

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.center} pointerEvents="box-none">
          {/* Tooltip card */}
          <Pressable onPress={() => {}} style={styles.cardWrapper}>
            <GlassSurface style={[styles.card, { borderColor: colors.border.default, borderWidth: 1 }]}>
              {/* Header: 아이콘 + 이름 + 가격 */}
              <View style={styles.header}>
                <Image
                  source={{ uri: itemImageUrl(item.imageKey) }}
                  style={styles.itemIcon}
                  contentFit="contain"
                />
                <View style={{ flex: 1 }}>
                  <ThemedText type="label" color="primary">{item.name}</ThemedText>
                  <ThemedText type="caption" color="secondary">
                    {translate('cost')}: {item.gold.total} {translate('gold')}
                    {'  '}
                    {translate('sell')}: {item.gold.sell}
                  </ThemedText>
                </View>
              </View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {/* 스탯 목록 */}
                {statSegments.length > 0 && (
                  <View style={styles.statsBlock}>
                    {statSegments.map((seg, i) => (
                      <ThemedText key={i} type="caption" style={{ color: colors.status.success.default }}>
                        {seg.text}
                      </ThemedText>
                    ))}
                  </View>
                )}

                {/* 설명 텍스트 */}
                {!!flavorText && (
                  <ThemedText type="caption" color="secondary" style={{ marginTop: Spacing.two }}>
                    {flavorText}
                  </ThemedText>
                )}
              </ScrollView>
            </GlassSurface>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    width: '100%',
    alignItems: 'center',
  },
  cardWrapper: {
    width: 280,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  divider: {
    height: 1,
  },
  statsBlock: {
    gap: Spacing.one,
  },
});
