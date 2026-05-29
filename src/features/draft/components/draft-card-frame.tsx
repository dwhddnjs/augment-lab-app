import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { AugmentRarityColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { augmentImageUrl } from '@/lib/ddragon';
import { cleanAugmentDescription } from '@/lib/augment-text';
import type { Augment } from '@/features/augments/types';

const RARITY_SF: Record<string, string> = {
  silver: 'sf:shield.fill',
  gold: 'sf:star.fill',
  prismatic: 'sf:sparkles',
};

interface Props {
  augment: Augment;
  cardWidth: number;
}

export function DraftCardFrame({ augment, cardWidth }: Props) {
  const { colors } = useTheme();
  const rarityColors = AugmentRarityColors[augment.rarity];
  const cardHeight = cardWidth * (14 / 9);
  const iconSize = cardWidth * 0.42;

  const iconUri = augment.iconPath ? augmentImageUrl(augment.iconPath) : null;

  const descText = cleanAugmentDescription(augment.description);

  const cardInner = (
    <View
      style={[
        styles.inner,
        {
          width: cardWidth,
          height: cardHeight,
          backgroundColor: colors.surface.sunken,
          shadowColor: rarityColors.glow,
          shadowOpacity: 1,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 12,
          elevation: 8,
        },
      ]}
    >
      {/* Icon area */}
      <View style={[styles.iconBox, { width: iconSize, height: iconSize }]}>
        {iconUri ? (
          <Image
            source={{ uri: iconUri }}
            style={{ width: iconSize, height: iconSize }}
            contentFit="contain"
          />
        ) : (
          <Image
            source={RARITY_SF[augment.rarity] ?? 'sf:sparkles'}
            style={{ width: iconSize * 0.7, height: iconSize * 0.7 }}
            tintColor={augment.rarity === 'prismatic' ? '#C6A1FF' : rarityColors.border}
          />
        )}
      </View>

      {/* Name */}
      <ThemedText
        type="label"
        numberOfLines={2}
        style={{ textAlign: 'center', color: colors.text.primary, paddingHorizontal: Spacing.two }}
      >
        {augment.name}
      </ThemedText>

      {/* Rarity badge */}
      <View style={[styles.badge, { backgroundColor: rarityColors.badge }]}>
        <ThemedText type="caption" style={{ color: rarityColors.badgeText, fontWeight: '700' }}>
          {augment.rarity.charAt(0).toUpperCase() + augment.rarity.slice(1)}
        </ThemedText>
      </View>

      {/* Description */}
      <ThemedText
        type="caption"
        numberOfLines={4}
        style={{
          color: colors.text.secondary,
          textAlign: 'center',
          paddingHorizontal: Spacing.two,
          lineHeight: 15,
          flex: 1,
        }}
      >
        {descText}
      </ThemedText>
    </View>
  );

  if (augment.rarity === 'prismatic') {
    return (
      <LinearGradient
        colors={AugmentRarityColors.prismatic.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.frame, { borderRadius: Radius.lg + 2, padding: 2 }]}
      >
        {cardInner}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.frame,
        {
          borderWidth: 2,
          borderColor: rarityColors.border,
          borderRadius: Radius.lg + 2,
        },
      ]}
    >
      {cardInner}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
});
