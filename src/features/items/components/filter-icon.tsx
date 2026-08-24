import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";

import { championClassIconUrl } from "@/lib/ddragon";
import type { FilterDef } from "../item-filters";

interface Props {
  filter: FilterDef;
  color: string;
  size: number;
}

export function FilterIcon({ filter, color, size }: Props) {
  if (filter.iconType === "cdragon") {
    const uri = championClassIconUrl(filter.classTag);
    if (uri) {
      return (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="contain"
          tintColor={color}
        />
      );
    }
    return <MaterialCommunityIcons name="sword" size={size} color={color} />;
  }
  return (
    <MaterialCommunityIcons
      name={
        filter.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]
      }
      size={size}
      color={color}
    />
  );
}
