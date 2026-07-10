/**
 * GlassButton — `@expo/ui/swift-ui`의 네이티브 SwiftUI glass 버튼.
 *
 * iOS 26+ & Xcode 26 dev build에서 `buttonStyle('glass')` 모디파이어로 진짜
 * 리퀴드글래스 버튼을 렌더한다. 강조(tint)가 지정되면 `tint(색)`을 더한다.
 * 글래스가 불가능한 iOS 26 미만에서는 GlassChip 폴백으로 떨어진다.
 */
import { Button, Host, Image } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  font,
  frame,
  glassEffect,
  padding,
  tint as tintModifier,
} from "@expo/ui/swift-ui/modifiers";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { PlatformColor } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { Spacing } from "@/constants/theme";
import {
  GlassButtonFallback,
  type GlassButtonProps,
} from "./glass-button-fallback";

export type { GlassButtonProps };

export function GlassButton({
  label,
  systemImage,
  tint,
  role,
  onPress,
  fallbackIcon,
}: GlassButtonProps) {
  if (!isLiquidGlassAvailable()) {
    return (
      <GlassButtonFallback
        label={label}
        fallbackIcon={fallbackIcon}
        tint={tint}
        role={role}
        onPress={onPress}
      />
    );
  }

  // 아이콘 전용 — 원형 글래스 컨테이너 안에 SF 심볼 아이콘.
  // systemImage는 label이 있을 때만 표시되므로 Image에 glassEffect(circle)를 직접 적용한다.
  // 배경은 중성 glass를 유지하고, 강조(primary)는 아이콘 색(tint=민트)으로만 표현한다.
  if (!label && systemImage) {
    return (
      <Host matchContents>
        <Image
          systemName={systemImage as SFSymbol}
          size={18}
          color={tint ?? PlatformColor("label")}
          onPress={onPress}
          modifiers={[
            frame({ width: 44, height: 44 }),
            glassEffect({
              glass: {
                variant: "regular",
                interactive: true,
              },
              shape: "circle",
            }),
          ]}
        />
      </Host>
    );
  }

  // padding을 buttonStyle 앞에 두어 glass 배경 안쪽 여백으로 작동시킨다
  // (텍스트가 컨테이너에 꽉 차 보이지 않도록 좌우 여백 확보).
  const innerPadding = padding({
    // horizontal: Spacing.three,
    vertical: Spacing.two,
    leading: Spacing.three,
  });
  // tint(완료=primary)는 glassProminent로 채워 위계를 만들고,
  // 그 외(건너뛰기=보조)는 중성 glass.
  const modifiers = tint
    ? [
        innerPadding,
        buttonStyle("glass"),
        controlSize("regular"),
        tintModifier(tint),
        font({
          weight: "medium",
          size: 16,
        }),
      ]
    : [
        innerPadding,
        buttonStyle("glass"),
        controlSize("regular"),
        font({
          weight: "medium",
          size: 16,
        }),
      ];

  return (
    <Host matchContents>
      <Button
        label={label}
        systemImage={systemImage as SFSymbol | undefined}
        role={role}
        onPress={onPress}
        modifiers={modifiers}
      />
    </Host>
  );
}
