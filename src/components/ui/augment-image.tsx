import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useState } from 'react';

import { augmentImageUrl } from '@/lib/ddragon';

/**
 * 증강 아이콘 로더 — large(256px) → base(컬러 원본) → small(64px) → 글리프 폴백.
 * 일부 증강은 CDragon에 `_large` 자산이 없고(404) 라이엇의 실제 컬러 아이콘이 접미사
 * 없는 베이스 파일(silver_spoon.png 등)에만 있다. 그래서 large 실패 시 base를 시도해
 * 컬러를 살리고, 그래도 없으면 small(흰 라인아트)·끝내 실패하면 희귀도 글리프를 그린다.
 * 희귀도 테두리/이름 등 장식은 호출측 wrapper가 담당하고, 이 컴포넌트는 이미지+폴백만 책임진다.
 */
type Step = 0 | 1 | 2 | 3;

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
  const [step, setStep] = useState<Step>(iconPath ? 0 : 3);

  if (step === 3) {
    return (
      <MaterialCommunityIcons
        name={fallbackGlyph as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
        size={Math.round(size * fallbackRatio)}
        color={tint}
      />
    );
  }

  const variant = step === 0 ? 'large' : step === 1 ? 'base' : 'small';

  return (
    <Image
      source={{ uri: augmentImageUrl(iconPath, variant) }}
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
