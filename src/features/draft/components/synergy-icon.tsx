import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Cross-platform synergy / draft glyph (renders on both iOS and Android, unlike
// the previous expo-image "sf:" SF Symbols which were iOS-only). The `name` is a
// MaterialCommunityIcons glyph name — see data/synergies.json `icon` fields.
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
