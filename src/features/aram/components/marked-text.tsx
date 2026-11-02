import { Text } from "react-native";

import { parseMarked } from "@/features/headliners/marked";

/**
 * "[s]스킬[/s] [e]강화[/e]!" 처럼 표시한 구간만 colors[표시] 색을 입힌다. 표시 밖은 감싼 Text 의 색을 따른다.
 * 펜타킬 스킬 카드와 HEARTSTEEL 스티커 문구가 함께 쓴다.
 */
export function renderMarked(text: string, colors: Record<string, string>) {
  return parseMarked(text).map(({ text: part, mark }, i) =>
    mark ? (
      <Text key={i} style={{ color: colors[mark] }}>
        {part}
      </Text>
    ) : (
      part
    ),
  );
}
