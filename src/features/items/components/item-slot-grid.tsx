/**
 * ItemSlotGrid — 3×2 아이템 슬롯 그리드 (총 6칸)
 * 채워진 슬롯: 아이템 아이콘 표시, 프레스 시 onPress(index) 호출
 * 빈 슬롯: placeholder 표시
 */
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { GlassSurface } from '@/components/ui/glass-surface';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { itemImageUrl } from '@/lib/ddragon';
import type { Item } from '../types';

const SLOT_COUNT = 6;
const COLS = 3;

interface ItemSlotGridProps {
  /** 선택된 아이템 (최대 6). 순서대로 슬롯에 채워진다 */
  selectedItems: Item[];
  /** 슬롯 프레스 시 — index, item (null이면 빈 슬롯) */
  onSlotPress: (index: number, item: Item | null) => void;
}

export function ItemSlotGrid({ selectedItems, onSlotPress }: ItemSlotGridProps) {
  const { colors } = useTheme();
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => selectedItems[i] ?? null);

  return (
    <GlassSurface style={[styles.container, { borderColor: colors.border.subtle, borderWidth: 1 }]}>
      <View style={styles.grid}>
        {slots.map((item, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          const isLastCol = col === COLS - 1;
          const isLastRow = row === Math.floor((SLOT_COUNT - 1) / COLS);

          return (
            <Pressable
              key={i}
              onPress={() => onSlotPress(i, item)}
              style={({ pressed }) => [
                styles.slot,
                {
                  borderRightWidth: isLastCol ? 0 : 1,
                  borderBottomWidth: isLastRow ? 0 : 1,
                  borderColor: colors.border.subtle,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {item ? (
                <Image
                  source={{ uri: itemImageUrl(item.imageKey) }}
                  style={styles.icon}
                  contentFit="contain"
                />
              ) : (
                <View style={[styles.placeholder, { borderColor: colors.border.subtle, borderWidth: 1, borderStyle: 'dashed' }]}>
                  <ThemedText type="caption" color="disabled" style={{ fontSize: 18 }}>+</ThemedText>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slot: {
    width: '33.333%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.one,
  },
  icon: {
    width: '80%',
    height: '80%',
    borderRadius: Radius.sm,
  },
  placeholder: {
    width: '70%',
    height: '70%',
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
