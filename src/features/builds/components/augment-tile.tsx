/**
 * AugmentTile — 빌드 카드/상세에서 쓰는 증강 아이콘 타일.
 * 희귀도 테두리 + CDragon 아이콘, 로드 실패 시 MCI 글리프 폴백.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AugmentRarityColors, Radius } from '@/constants/theme';
import type { Augment, AugmentRarity } from '@/features/augments/types';
import { useTheme } from '@/hooks/use-theme';
import { augmentImageUrl } from '@/lib/ddragon';

const RARITY_GLYPH: Record<AugmentRarity, string> = {
  silver: 'shield',
  gold: 'star',
  prismatic: 'shimmer',
};

interface Props {
  augment: Augment;
  size: number;
}

export function AugmentTile({ augment, size }: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const tint = AugmentRarityColors[augment.rarity].border;
  const showFallback = failed || !augment.iconPath;

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: colors.surface.sunken,
          borderColor: tint,
        },
      ]}
    >
      {showFallback ? (
        <MaterialCommunityIcons
          name={RARITY_GLYPH[augment.rarity] as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
          size={Math.round(size * 0.6)}
          color={tint}
        />
      ) : (
        <Image
          source={{ uri: augmentImageUrl(augment.iconPath, 'large') }}
          style={{ width: Math.round(size * 0.75), height: Math.round(size * 0.75) }}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={augment.id}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
