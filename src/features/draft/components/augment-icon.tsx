import { useState } from 'react';
import { Image } from 'expo-image';

import { augmentImageUrl } from '@/lib/ddragon';
import { SynergyIcon } from './synergy-icon';

// large(256px, full-color art) → vector-icon fallback. Never shows an empty box.
// The 256px asset is a colored illustration, so it renders untinted; only the
// fallback glyph takes the rarity tint.
type Step = 0 | 1;

interface Props {
  iconPath: string;
  /** Size of the (square) emblem. */
  size: number;
  /** Rarity tint applied to the fallback symbol only. */
  tint: string;
  /** MaterialCommunityIcons glyph shown when no icon resolves (e.g. "star"). */
  fallbackSymbol: string;
  /** Stable identity for the underlying image cache. */
  recyclingKey?: string;
}

export function AugmentIcon({ iconPath, size, tint, fallbackSymbol, recyclingKey }: Props) {
  const [step, setStep] = useState<Step>(iconPath ? 0 : 1);

  if (step === 1) {
    return (
      <SynergyIcon name={fallbackSymbol} size={Math.round(size * 0.62)} color={tint} />
    );
  }

  return (
    <Image
      source={{ uri: augmentImageUrl(iconPath, 'large') }}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={0}
      recyclingKey={recyclingKey ?? iconPath}
      onError={() => setStep(1)}
    />
  );
}
