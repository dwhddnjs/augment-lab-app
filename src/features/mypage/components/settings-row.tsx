/**
 * SettingsRow — iOS 설정앱 스타일 리스트 행(좌측 아이콘 + 라벨 + 우측 값/chevron).
 * `@expo/ui/swift-ui` List의 Section 안에서 쓴다. onPress 없으면 비활성(정적 값 표시).
 * `description`을 주면 라벨 아래 한 줄 설명이 붙는다(2줄 행).
 */
import { Button, HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  shapes,
} from "@expo/ui/swift-ui/modifiers";
import type { SFSymbol } from "sf-symbols-typescript";

export function SettingsRow({
  label,
  value,
  description,
  icon,
  iconColor,
  labelColor,
  onPress,
  rowBackgroundColor,
}: {
  label: string;
  value?: string;
  /** 라벨 아래 보조 설명. 무엇이 일어나는지 한 줄로. */
  description?: string;
  icon: SFSymbol;
  iconColor: string;
  /** 위험 동작(초기화)용. 지정하지 않으면 기본 라벨 색. */
  labelColor?: string;
  onPress?: () => void;
  rowBackgroundColor: string;
}) {
  return (
    <Button
      onPress={onPress}
      modifiers={[buttonStyle("plain"), listRowBackground(rowBackgroundColor)]}
    >
      <HStack spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
        <Image
          systemName={icon}
          size={17}
          modifiers={[
            foregroundStyle({ type: "color", color: iconColor }),
            frame({ width: 26 }),
          ]}
        />
        <VStack alignment="leading" spacing={2}>
          <Text
            modifiers={
              labelColor
                ? [foregroundStyle({ type: "color", color: labelColor })]
                : []
            }
          >
            {label}
          </Text>
          {description ? (
            <Text
              modifiers={[
                font({ textStyle: "footnote" }),
                foregroundStyle({ type: "color", color: "secondaryLabel" }),
              ]}
            >
              {description}
            </Text>
          ) : null}
        </VStack>
        <Spacer />
        {value ? (
          <Text
            modifiers={[
              foregroundStyle({ type: "color", color: "secondaryLabel" }),
            ]}
          >
            {value}
          </Text>
        ) : null}
        {onPress ? (
          <Image
            systemName="chevron.right"
            size={13}
            modifiers={[
              foregroundStyle({ type: "color", color: "tertiaryLabel" }),
            ]}
          />
        ) : null}
      </HStack>
    </Button>
  );
}
