import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// 시너지 글리프. `name`은 MaterialCommunityIcons 글리프 이름이다
// — data/synergies.json 의 `icon` 필드 참고.
interface Props {
  name: string;
  size: number;
  color: string;
}

export function SynergyIcon({ name, size, color }: Props) {
  return (
    <MaterialCommunityIcons
      name={name as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
      size={size}
      color={color}
    />
  );
}
