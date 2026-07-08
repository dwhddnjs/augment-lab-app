/**
 * 챔피언 선택 그리드 아이콘 — Android: MaterialCommunityIcons.
 * (SF Symbol "sf:" 소스는 iOS 전용이라 Android에선 아무것도 렌더되지 않는다)
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

/** 전체 필터칩 아이콘 */
export function FilterAllIcon({ color }: { color: string }) {
  return <MaterialCommunityIcons name="view-grid" size={24} color={color} />;
}

/** 아레나 "용기" 박스 안 큰 물음표 */
export function BraveryMark({ color }: { color: string }) {
  return <MaterialCommunityIcons name="help" size={44} color={color} />;
}
