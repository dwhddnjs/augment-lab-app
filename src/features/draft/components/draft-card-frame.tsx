import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { AugmentRarityColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { augmentImageUrl } from '@/lib/ddragon';
import { cleanAugmentDescription } from '@/lib/augment-text';
import { useTranslation } from '@/lib/i18n';
import type { Augment, AugmentRarity } from '@/features/augments/types';

const RARITY_SF: Record<string, string> = {
  silver: 'sf:shield.fill',
  gold: 'sf:star.fill',
  prismatic: 'sf:sparkles',
};

// Metallic frame palettes (diagonal sheen) + bright tone for corner brackets.
const FRAME: Record<AugmentRarity, { gradient: [string, string, ...string[]]; corner: string; tint: string }> = {
  silver: { gradient: ['#454b54', '#c4cad2', '#777e87', '#eef1f5'], corner: '#f2f5f8', tint: '#9BA3AE' },
  gold: { gradient: ['#6b5024', '#e7c477', '#a07d2c', '#f4e3a8'], corner: '#f6e8b2', tint: '#E8B339' },
  prismatic: { gradient: AugmentRarityColors.prismatic.gradient, corner: '#ffffff', tint: '#C6A1FF' },
};

const t = {
  ko: { silver: '실버', gold: '골드', prismatic: '프리즘' },
  en: { silver: 'Silver', gold: 'Gold', prismatic: 'Prismatic' },
};

interface Props {
  augment: Augment;
  cardWidth: number;
}

function CornerBracket({ pos, size, color }: { pos: 'tl' | 'tr' | 'bl' | 'br'; size: number; color: string }) {
  const v = Math.max(1.5, size * 0.16);
  const corners = {
    tl: { top: 0, left: 0, borderTopWidth: v, borderLeftWidth: v },
    tr: { top: 0, right: 0, borderTopWidth: v, borderRightWidth: v },
    bl: { bottom: 0, left: 0, borderBottomWidth: v, borderLeftWidth: v },
    br: { bottom: 0, right: 0, borderBottomWidth: v, borderRightWidth: v },
  }[pos];
  return <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderColor: color }, corners]} />;
}

export function DraftCardFrame({ augment, cardWidth }: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  const rarityColors = AugmentRarityColors[augment.rarity];
  const frame = FRAME[augment.rarity];
  const accent = frame.tint;

  const cardHeight = cardWidth * (14 / 9);
  const plateSize = Math.round(cardWidth * 0.44);
  // Source icons are only 64×64 — never upscale past native size.
  const iconSize = Math.min(64, Math.round(plateSize * 0.74));
  const glowSize = Math.round(plateSize * 1.7);
  const nameSize = Math.max(13, Math.round(cardWidth * 0.105));
  const bracket = Math.max(14, Math.round(cardWidth * 0.16));
  const framePad = Math.max(2.5, Math.round(cardWidth * 0.018));

  const iconUri = augment.iconPath ? augmentImageUrl(augment.iconPath) : null;
  const descText = cleanAugmentDescription(augment.description);

  return (
    <LinearGradient
      colors={frame.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.frame,
        {
          width: cardWidth,
          height: cardHeight,
          padding: framePad,
          borderRadius: Radius.lg + 2,
          boxShadow: `0 0 16px ${rarityColors.glow}`,
        },
      ]}
    >
      {/* Dark body */}
      <View style={[styles.body, { backgroundColor: colors.surface.sunken, borderColor: accent + '33' }]}>
        {/* Top rarity tint + bottom darkening */}
        <LinearGradient
          colors={[accent + '20', 'transparent', '#00000055']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {/* Icon plate with glow */}
          <View style={styles.iconArea}>
            <View
              style={[
                styles.glow,
                { width: glowSize, height: glowSize, borderRadius: Radius.full, backgroundColor: rarityColors.glow },
              ]}
            />
            <View
              style={[
                styles.plate,
                {
                  width: plateSize,
                  height: plateSize,
                  borderRadius: Radius.md,
                  borderColor: accent,
                  backgroundColor: colors.surface.base + 'CC',
                  boxShadow: `0 0 10px ${rarityColors.glow}`,
                },
              ]}
            >
              {iconUri ? (
                <Image source={{ uri: iconUri }} style={{ width: iconSize, height: iconSize }} contentFit="contain" />
              ) : (
                <Image
                  source={RARITY_SF[augment.rarity] ?? 'sf:sparkles'}
                  style={{ width: iconSize * 0.7, height: iconSize * 0.7 }}
                  tintColor={accent}
                />
              )}
            </View>
          </View>

          {/* Name */}
          <ThemedText
            numberOfLines={2}
            style={[styles.name, { color: colors.text.primary, fontSize: nameSize, lineHeight: Math.round(nameSize * 1.2) }]}
          >
            {augment.name}
          </ThemedText>

          {/* Rarity pill */}
          <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <ThemedText style={[styles.pillText, { color: colors.text.secondary }]}>
              {translate(augment.rarity)}
            </ThemedText>
          </View>

          {/* Description */}
          <ThemedText
            type="caption"
            numberOfLines={4}
            style={[styles.desc, { color: colors.text.secondary }]}
          >
            {descText}
          </ThemedText>
        </View>

        {/* Ornate corner brackets */}
        <CornerBracket pos="tl" size={bracket} color={frame.corner} />
        <CornerBracket pos="tr" size={bracket} color={frame.corner} />
        <CornerBracket pos="bl" size={bracket} color={frame.corner} />
        <CornerBracket pos="br" size={bracket} color={frame.corner} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  body: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  glow: {
    position: 'absolute',
    opacity: 0.5,
  },
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  name: {
    textAlign: 'center',
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  desc: {
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: Spacing.one,
    flexShrink: 1,
  },
});
