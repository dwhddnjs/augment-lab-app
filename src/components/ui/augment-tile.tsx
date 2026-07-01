/**
 * AugmentTile — 빌드 카드/상세에서 쓰는 증강 아이콘 타일.
 * 희귀도 테두리 + CDragon 아이콘(AugmentImage가 large→base→small→글리프 폴백 처리).
 *
 * 도메인 타입(Augment)에 의존하지 않도록 iconPath·rarity 등 원시값만 받는다
 * (칼바람·아레나 양쪽 feature에서 공유). 희귀도는 테마 토큰 키로 타이핑한다.
 */
import { StyleSheet, View } from 'react-native';

import { AugmentImage } from '@/components/ui/augment-image';
import {
  AugmentRarityColors,
  AugmentRarityGlyphs,
  HeroOverlay,
  Radius,
} from '@/constants/theme';

interface Props {
  iconPath: string;
  rarity: keyof typeof AugmentRarityColors;
  size: number;
  /**
   * 타일 배경. 기본은 splash 히어로 카드용 반투명 scrim(어두운 이미지 위 전제).
   * 밝은 시트(빌드 상세 등) 위에선 불투명 어두운 톤을 넘겨 아이콘 대비를 확보한다.
   */
  background?: string;
  /** 이미지 캐시 식별자(리스트 재활용 잔상 방지). */
  recyclingKey?: string;
}

export function AugmentTile({
  iconPath,
  rarity,
  size,
  background = HeroOverlay.tileBg,
  recyclingKey,
}: Props) {
  const tint = AugmentRarityColors[rarity].border;

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
        iconPath={iconPath}
        size={Math.round(size * 0.75)}
        tint={tint}
        fallbackGlyph={AugmentRarityGlyphs[rarity]}
        // 글리프는 이미지(0.75)의 0.8배 = 기존 size*0.6 유지.
        fallbackRatio={0.8}
        recyclingKey={recyclingKey}
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
