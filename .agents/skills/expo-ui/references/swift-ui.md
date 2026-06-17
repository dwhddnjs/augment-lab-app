# `@expo/ui/swift-ui` (iOS)

SwiftUI를 그대로 미러링한다 — SwiftUI 지식이 직접 전이된다. universal로 부족할 때(섹션 헤더, Form, Menu, Alert, 플랫폼 고유 최적화) **`name.ios.tsx`** 파일에서 사용한다.

- 컴포넌트: `import { Host, List, Section, Picker, Button, HStack, VStack, Spacer, Text, Image, Menu, Toggle, Label, Form } from '@expo/ui/swift-ui'`
- modifier: `import { listStyle, tint, foregroundStyle, buttonStyle, contentShape, shapes, tag, frame, glassEffect } from '@expo/ui/swift-ui/modifiers'`

실제 export: `node_modules/@expo/ui/build/swift-ui/index.d.ts`, modifier: `.../swift-ui/modifiers/index.d.ts`.

## 모든 트리는 Host로 감싼다

```tsx
import { Host, List, Section, Text } from '@expo/ui/swift-ui';
import { listStyle } from '@expo/ui/swift-ui/modifiers';

<Host style={{ flex: 1 }}>
  <List modifiers={[listStyle('insetGrouped')]}>   {/* 진짜 iOS 설정앱 룩 */}
    <Section title="일반">
      ...
    </Section>
    <Section title="정보">
      ...
    </Section>
  </List>
</Host>
```

`listStyle`: `'automatic' | 'plain' | 'inset' | 'insetGrouped' | 'grouped' | 'sidebar'`.
`Section`: `title` / `header` / `footer`.

## 행(row) 만들기

`ListItem`(universal) 대신 swift-ui에서 직접 행을 그릴 때는 `Button(plain)` + `HStack`:

```tsx
import { Button, HStack, Spacer, Text, Image } from '@expo/ui/swift-ui';
import { buttonStyle, contentShape, shapes, foregroundStyle } from '@expo/ui/swift-ui/modifiers';

<Button onPress={onPress} modifiers={[buttonStyle('plain')]}>
  <HStack spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
    <Text>테마</Text>
    <Spacer />
    <Text modifiers={[foregroundStyle({ type: 'color', color: 'secondaryLabel' })]}>다크</Text>
    <Image systemName="chevron.right" />
  </HStack>
</Button>
```

`contentShape(rectangle)`로 슬롯 사이 빈 공간까지 탭이 잡힌다.

## Picker (Section 안 인라인)

```tsx
import { Picker, Text } from '@expo/ui/swift-ui';
import { tag, tint } from '@expo/ui/swift-ui/modifiers';

<Picker label="언어" selection={locale} onSelectionChange={(v) => setLocale(v)}>
  <Text modifiers={[tag('ko')]}>한국어</Text>
  <Text modifiers={[tag('en')]}>English</Text>
</Picker>
```

List 안에서 기본 picker 스타일은 메뉴/내비게이션 링크로 자동 적용된다.

## RN 컴포넌트 섞기

`RNHostView`로 감싼다:

```tsx
import { Host, VStack, RNHostView } from '@expo/ui/swift-ui';
import { Pressable } from 'react-native';

<Host matchContents>
  <VStack>
    <RNHostView matchContents><Pressable /></RNHostView>
  </VStack>
</Host>
```

## 색

modifier에 hex 금지. `useTheme()` 토큰을 `tint(colors.accent.default)` / `foregroundStyle({ type:'color', color: colors.text.secondary })`로 주입하거나, 시스템 시맨틱 색(`'secondaryLabel'` 등)을 쓴다.
