import { TierColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 현재 테마의 티어(S~D) 색. 라이트 짝을 따로 두는 이유는 TierColors 주석 참고. */
export function useTierColors() {
  const { mode } = useTheme();
  return TierColors[mode];
}
