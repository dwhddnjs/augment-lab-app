/**
 * GlassButton (기본/Android) — 폴백 구현으로 위임.
 *
 * iOS에서는 glass-button.ios.tsx가 네이티브 expo-ui glass 버튼을 제공한다.
 */
import { GlassButtonFallback, type GlassButtonProps } from './glass-button-fallback';

export type { GlassButtonProps };

export function GlassButton(props: GlassButtonProps) {
  return <GlassButtonFallback {...props} />;
}
