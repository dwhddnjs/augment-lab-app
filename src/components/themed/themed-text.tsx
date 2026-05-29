import { Platform, Text, type TextProps } from 'react-native';

import { Fonts, Typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'code' | 'link';
export type TextColor = keyof ThemeColors['text'] | 'accent';

export type ThemedTextProps = TextProps & {
  type?: TextVariant;
  color?: TextColor;
};

const VARIANT_STYLES: Record<TextVariant, typeof Typography.body> = {
  display: Typography.display,
  title:   Typography.title,
  heading: Typography.heading,
  body:    Typography.body,
  label:   Typography.label,
  caption: Typography.caption,
  code:    Typography.code,
  link:    Typography.body,
};

export function ThemedText({ style, type = 'body', color, ...rest }: ThemedTextProps) {
  const { colors } = useTheme();

  const resolvedColor = (() => {
    if (color === 'accent') return colors.accent.default;
    if (color) return colors.text[color];
    if (type === 'link') return colors.accent.default;
    return colors.text.primary;
  })();

  return (
    <Text
      style={[
        { color: resolvedColor },
        VARIANT_STYLES[type],
        type === 'code' && {
          fontFamily: Fonts.mono,
          fontWeight: Platform.select({ android: '700' as const }) ?? '500',
        },
        style,
      ]}
      {...rest}
    />
  );
}
