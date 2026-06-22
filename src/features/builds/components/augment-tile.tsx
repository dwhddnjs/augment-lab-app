/**
 * AugmentTile — 빌드 카드/상세에서 쓰는 증강 아이콘 타일.
 * 희귀도 테두리 + CDragon 아이콘(AugmentImage가 large→small→글리프 폴백 처리).
 */
import { StyleSheet, View } from 'react-native';

import { AugmentImage } from '@/components/ui/augment-image';
import { AugmentRarityColors, AugmentRarityGlyphs, HeroOverlay, Radius } from '@/constants/theme';
import type { Augment } from '@/features/augments/types';

interface Props {
  augment: Augment;
  size: number;
  /**
   * 타일 배경. 기본은 splash 히어로 카드용 반투명 scrim(어두운 이미지 위 전제).
   * 밝은 시트(빌드 상세 등) 위에선 불투명 어두운 톤을 넘겨 아이콘 대비를 확보한다.
   */
  background?: string;
}

export function AugmentTile({ augment, size, background = HeroOverlay.tileBg }: Props) {
  const tint = AugmentRarityColors[augment.rarity].border;

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          // 증강 아이콘은 어두운 배경 자산 — 모드 무관 어두운 타일로 아이콘/rarity 테두리 대비 확보.
          backgroundColor: background,
          borderColor: tint,
        },
      ]}
    >
      <AugmentImage
        iconPath={augment.iconPath}
        size={Math.round(size * 0.75)}
        tint={tint}
        fallbackGlyph={AugmentRarityGlyphs[augment.rarity]}
        // 글리프는 이미지(0.75)의 0.8배 = 기존 size*0.6 유지.
        fallbackRatio={0.8}
        recyclingKey={augment.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
