/**
 * ItemSlotGrid — 6×1 가로 아이템 트레이 (총 6칸)
 * 좌측 그리드 하단에 absolute로 깔려 선택된 아이템을 왼쪽부터 쌓아 보여준다.
 * 채워진 슬롯: 아이템 아이콘 표시, 프레스 시 onSlotPress(index, item) → 제거
 * 빈 슬롯: 점선 placeholder (항상 6칸 노출)
 */
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { itemImageUrl } from '@/lib/ddragon';
import type { Item } from '../types';

const SLOT_COUNT = 6;
// DDragon 아이템 아이콘 원본은 64×64 — 그 이상으로 키우면 흐릿해지므로 상한
const BOX = 44;

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
    <View
      style={[
        styles.tray,
        {
          backgroundColor: colors.surface.overlay,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {slots.map((item, i) => (
        <Pressable
          key={i}
          onPress={() => onSlotPress(i, item)}
          style={({ pressed }) => [
            styles.slot,
            {
              borderColor: colors.border.subtle,
              backgroundColor: item
                ? colors.surface.raised
                : colors.surface.base,
              opacity: pressed && item ? 0.7 : 1,
            },
            !item && styles.slotEmpty,
          ]}
        >
          {item ? (
            <Image
              source={{ uri: itemImageUrl(item.imageKey) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <ThemedText type="body" color="disabled" style={styles.plus}>
              +
            </ThemedText>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignSelf: 'center',
  },
  slot: {
    width: BOX,
    height: BOX,
    borderRadius: Radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotEmpty: {
    borderStyle: 'dashed',
  },
  plus: {
    fontSize: 20,
    lineHeight: 24,
  },
});
