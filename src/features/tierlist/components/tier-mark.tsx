import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { TierGradientAlpha } from '@/constants/theme';
import { useTierColors } from '@/features/tierlist/hooks/use-tier-colors';
import type { Tier } from '@/features/tierlist/types';

/** 한 글자라 넓혀야 바탕 폭에 비해 덜 허전하다 — 큰 배너일수록 더 넓힌다. */
const TRACKING = { heading: 2, label: 1 } as const;

interface Props {
  tier: Tier;
  /** 글자 크기. 목록 배너는 heading, 상세 배지는 label. */
  type: keyof typeof TRACKING;
  /** 크기·모양(배너 캡슐 / 배지 사각). */
  style?: StyleProp<ViewStyle>;
}

/**
 * 티어 표시 — 등급색을 좌우로 흘려 가운데만 진하게 남긴 바탕 + 반투명 등급색 테두리 + 등급 글자.
 * 글자는 흰색(text.primary)이다 — 같은 등급색을 얹으면 대비가 1.4:1 밖에 안 나와 C·D 에서
 * 글자가 사라진다.
 */
export function TierMark({ tier, type, style }: Props) {
  const color = useTierColors()[tier];
  const { edge, center, border } = TierGradientAlpha;

  return (
    <LinearGradient
      colors={[`${color}${edge}`, `${color}${center}`, `${color}${edge}`]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.base, style, { borderColor: `${color}${border}` }]}
    >
      <ThemedText type={type} style={[styles.mark, { letterSpacing: TRACKING[type] }]}>
        {tier}
      </ThemedText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    fontWeight: '800',
  },
});
