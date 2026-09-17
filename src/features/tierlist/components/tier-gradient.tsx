import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { TierGradientAlpha } from '@/constants/theme';

interface Props {
  /** `TierColors[mode][tier]` — 6자리 hex 여야 알파를 붙일 수 있다. */
  color: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * 티어 배너(목록)·티어 배지(모달) 공용 바탕. 등급색을 좌우로 흘려 가운데만 진하게 남기고
 * 테두리는 반투명 등급색이다. 글자는 호출측이 흰색(text.primary)으로 얹는다 — 같은 등급색을
 * 얹으면 대비가 1.4:1 밖에 안 나와 C·D 에서 글자가 사라진다.
 */
export function TierGradient({ color, style, children }: PropsWithChildren<Props>) {
  const { edge, center, border } = TierGradientAlpha;
  return (
    <LinearGradient
      colors={[`${color}${edge}`, `${color}${center}`, `${color}${edge}`]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[style, { borderColor: `${color}${border}` }]}
    >
      {children}
    </LinearGradient>
  );
}
