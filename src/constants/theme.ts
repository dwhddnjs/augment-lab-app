import '@/styles/global.css';
import { Platform } from 'react-native';

export const Theme = {
  dark: {
    surface: {
      base: '#0E0F12',
      raised: '#16181C',
      sunken: '#0A0B0D',
      overlay: 'rgba(0,0,0,0.6)',
    },
    text: {
      primary: '#F2F4F7',
      secondary: '#B0B4BA',
      tertiary: '#7A7F87',
      disabled: '#4A4E55',
      inverse: '#0E0F12',
      onAccent: '#04231A',
    },
    border: {
      default: '#26292F',
      subtle: '#1B1E22',
      strong: '#3A3F47',
    },
    accent: {
      default: '#1ED7A0',
      hover: '#2FE3AE',
      pressed: '#17B689',
      subtle: 'rgba(30,215,160,0.14)',
      onAccent: '#04231A',
    },
    status: {
      success: { default: '#1ED7A0', subtle: 'rgba(30,215,160,0.14)' },
      warning: { default: '#F2B33D', subtle: 'rgba(242,179,61,0.16)' },
      danger:  { default: '#F26D6D', subtle: 'rgba(242,109,109,0.16)' },
      info:    { default: '#5BA8FF', subtle: 'rgba(91,168,255,0.16)' },
    },
  },
  light: {
    surface: {
      base: '#FAFBFC',
      raised: '#F0F2F5',
      sunken: '#E6E8EC',
      overlay: 'rgba(15,17,21,0.45)',
    },
    text: {
      primary: '#0E0F12',
      secondary: '#5A6068',
      tertiary: '#878D96',
      disabled: '#B4B8BE',
      inverse: '#FAFBFC',
      onAccent: '#04231A',
    },
    border: {
      default: '#D7DAE0',
      subtle: '#E6E8EC',
      strong: '#B4B8BE',
    },
    accent: {
      default: '#10B187',
      hover: '#0E9F79',
      pressed: '#0A8466',
      subtle: 'rgba(16,177,135,0.12)',
      onAccent: '#FFFFFF',
    },
    status: {
      success: { default: '#0E9F79', subtle: 'rgba(14,159,121,0.12)' },
      warning: { default: '#C98712', subtle: 'rgba(201,135,18,0.16)' },
      danger:  { default: '#D0463F', subtle: 'rgba(208,70,63,0.16)' },
      info:    { default: '#2E78D6', subtle: 'rgba(46,120,214,0.16)' },
    },
  },
} as const;

export type ThemeColors = typeof Theme.dark;

export const Typography = {
  display: { fontSize: 48, lineHeight: 52, fontWeight: '700' as const },
  title:   { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  body:    { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  label:   { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  code:    { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
} as const;

export const Radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

type ElevationLevel = {
  shadowColor?: string;
  shadowOpacity?: number;
  shadowOffset?: { width: number; height: number };
  shadowRadius?: number;
  elevation?: number;
};

const makeElevation = (
  ios: Omit<ElevationLevel, 'elevation'>,
  androidElevation: number,
): ElevationLevel =>
  Platform.select({ ios, android: { elevation: androidElevation }, default: {} })!;

export const Elevation = {
  level0: {} as ElevationLevel,
  level1: makeElevation({ shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4 }, 1),
  level2: makeElevation({ shadowColor: '#000', shadowOpacity: 0.14, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10 }, 4),
  level3: makeElevation({ shadowColor: '#000', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 18 }, 8),
};

export const Brand = {
  splashBg: '#208AEF',
  logoBgFrom: '#3C9FFE',
  logoBgTo: '#0274DF',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
