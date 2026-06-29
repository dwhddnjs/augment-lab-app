import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useState } from 'react';

import { augmentImageUrl } from '@/lib/ddragon';

/**
 * 증강 아이콘 로더 — large(256px) → small(64px) → 글리프 폴백.
 * 일부 신규(Kiwi) 아이콘은 CDragon에 large 자산이 없어 small로 한 번 더 시도하며,
 * 끝내 실패하면 희귀도 글리프를 그려 빈 박스를 만들지 않는다.
 * 희귀도 테두리/이름 등 장식은 호출측 wrapper가 담당하고, 이 컴포넌트는 이미지+폴백만 책임진다.
 */
type Step = 0 | 1 | 2;

interface Props {
  iconPath: string;
  /** 이미지(정사각) 변. */
  size: number;
  /** 폴백 글리프 색 — 보통 희귀도 tint. */
  tint: string;
  /** 아이콘 미해결 시 표시할 MaterialCommunityIcons 글리프 이름. */
  fallbackGlyph: string;
  /** 폴백 글리프 크기 = size * ratio (기본 0.62). */
  fallbackRatio?: number;
  /** 이미지 캐시 식별자. 미지정 시 iconPath 사용. */
  recyclingKey?: string;
  /**
   * 이미지 자체에 입힐 단색 틴트. 흐릿한 단색 라인아트 아이콘(재련 crafting_* 등)을
   * 선명한 솔리드 색으로 강제할 때 사용한다. 미지정 시 원본 색을 그대로 쓴다.
   */
  imageTint?: string;
}

export function AugmentImage({
  iconPath,
  size,
  tint,
  fallbackGlyph,
  fallbackRatio = 0.62,
  recyclingKey,
  imageTint,
}: Props) {
  const [step, setStep] = useState<Step>(iconPath ? 0 : 2);

  if (step === 2) {
    return (
      <MaterialCommunityIcons
        name={fallbackGlyph as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
        size={Math.round(size * fallbackRatio)}
        color={tint}
      />
    );
  }

  return (
    <Image
      source={{ uri: augmentImageUrl(iconPath, step === 0 ? 'large' : 'small') }}
      style={{ width: size, height: size }}
      contentFit="contain"
      tintColor={imageTint}
      cachePolicy="memory-disk"
      transition={0}
      recyclingKey={`${recyclingKey ?? iconPath}-${step}`}
      onError={() => setStep((s) => (s + 1) as Step)}
    />
  );
}
