import { useState } from 'react';
import { Image } from 'expo-image';

import { augmentImageUrl } from '@/lib/ddragon';

// large(256px, full-color art) → SF symbol fallback. Never shows an empty box.
// The 256px asset is a colored illustration, so it renders untinted; only the
// SF-symbol fallback (a flat glyph) takes the rarity tint.
type Step = 0 | 1;

interface Props {
  iconPath: string;
  /** Size of the (square) emblem. */
  size: number;
  /** Rarity tint applied to the fallback symbol only. */
  tint: string;
  /** SF symbol shown when no icon resolves (e.g. "sf:sparkles"). */
  fallbackSymbol: string;
  /** Stable identity for the underlying image cache. */
  recyclingKey?: string;
}

export function AugmentIcon({ iconPath, size, tint, fallbackSymbol, recyclingKey }: Props) {
  const [step, setStep] = useState<Step>(iconPath ? 0 : 1);

  if (step === 1) {
    return (
      <Image
        source={fallbackSymbol}
        style={{ width: Math.round(size * 0.62), height: Math.round(size * 0.62) }}
        tintColor={tint}
        contentFit="contain"
      />
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
