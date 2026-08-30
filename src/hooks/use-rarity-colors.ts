/**
 * useRarityColors — 증강 희귀도 색을 현재 테마에 맞게 고른다.
 *
 * 희귀도 색은 인게임 고유색이라 모드와 무관해 보이지만, 실제로는 밝은 배경(카드 행·
 * surface.raised) 위 텍스트와 아이콘 tint 로 쓰인다. 다크 팔레트를 라이트에 그대로
 * 올리면 프리즘(#E0D6FF)이 흰 배경에서 대비 1.4:1 로 사라진다(한 번 해 보고 되돌렸다).
 *
 * 예외: AugmentTile 은 모드와 무관하게 어두운 타일 배경을 깔아서 다크 팔레트를 직접
 * 쓴다 — 저기서 이 훅을 쓰면 라이트에서 어두운 배경 위 어두운 테두리가 된다.
 */
import {
  AugmentRarityColors,
  AugmentRarityColorsLight,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function useRarityColors(): typeof AugmentRarityColors {
  const { mode } = useTheme();
  return mode === "dark" ? AugmentRarityColors : AugmentRarityColorsLight;
}
