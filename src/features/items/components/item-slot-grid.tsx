/**
 * ItemSlotGrid — 6×1 가로 아이템 트레이 (총 6칸)
 * 좌측 그리드 하단에 absolute로 깔려 선택된 아이템을 왼쪽부터 쌓아 보여준다.
 * 채워진 슬롯: 아이템 아이콘 표시, 프레스 시 onSlotPress(index, item) → 제거
 * 빈 슬롯: 점선 placeholder (항상 6칸 노출)
 */
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { GlassSurface } from '@/components/ui/glass-surface';
import { RemoteImage } from '@/components/ui/remote-image';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { itemImageUrl } from '@/lib/ddragon';
import type { Item } from '../types';

const SLOT_COUNT = 6;
// 트레이 박스(정사각) 한 변 크기 — DDragon 원본(64×64) 이하라 확대 없이 또렷하게 표시
const BOX = 44;
// 트레이 전체 높이 = 박스 + 상하 패딩(Spacing.two×2) + 상하 보더(1×2).
// 그리드가 트레이에 가려지지 않도록 item-select-screen의 paddingBottom 계산에 사용.
export const TRAY_HEIGHT = BOX + Spacing.two * 2 + 2;

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
    <GlassSurface style={[styles.tray, { borderColor: colors.border.subtle }]}>
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
            <RemoteImage
              uri={itemImageUrl(item.imageKey)}
              recyclingKey={item.id}
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
    </GlassSurface>
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
