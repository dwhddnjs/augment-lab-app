import { Text, type TextProps } from 'react-native';

import { Typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ThemedTextProps = TextProps & {
  type?: keyof typeof Typography;
  color?: keyof ThemeColors['text'] | 'accent';
};

export function ThemedText({
  style,
  type = 'body',
  color = 'primary',
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();

  const resolvedColor = color === 'accent' ? colors.accent.default : colors.text[color];

  return <Text style={[{ color: resolvedColor }, Typography[type], style]} {...rest} />;
}
