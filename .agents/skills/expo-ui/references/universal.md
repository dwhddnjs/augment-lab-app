# universal `@expo/ui`

`import { ... } from '@expo/ui'` 에서 가져오는 크로스플랫폼 컴포넌트. **단일 파일**로 iOS=SwiftUI, Android=Jetpack Compose로 렌더된다(웹은 RN 폴백). 플랫폼 분기 파일이 필요 없는 게 핵심 장점.

실제 export 목록은 `node_modules/@expo/ui/build/universal/index.d.ts` 확인:
`Host, Column, Row, Spacer, Text, Button, ScrollView, Switch, Slider, Checkbox, BottomSheet, Collapsible, FieldGroup, Icon, List, ListItem, Picker, RNHostView, TextInput`.

## Host

모든 네이티브 트리의 root. 빠뜨리면 렌더되지 않는다.

```tsx
import { Host, Column, Text, Button } from '@expo/ui';

<Host matchContents>          {/* 내용 크기에 맞춤 */}
  <Column>
    <Text>안녕</Text>
    <Button onPress={() => {}}>눌러</Button>
  </Column>
</Host>

<Host style={{ flex: 1 }}>    {/* 화면 전체를 채울 때 */}
  <List>...</List>
</Host>
```

## List + ListItem

iOS SwiftUI `List`, Android `LazyColumn`에 위임. 설정·폼 같은 **소규모** 리스트용.

```tsx
import { Host, List, ListItem, Icon } from '@expo/ui';

<Host style={{ flex: 1 }}>
  <List>
    <ListItem
      onPress={() => router.push('/theme')}
      trailing={<Text>다크</Text>}
    >
      테마
    </ListItem>
    <ListItem leading={<Icon name="..." />} supportingText="부가 설명">
      제목
    </ListItem>
  </List>
</Host>
```

- `ListItem`의 headline은 children, 보조 슬롯은 `leading`/`trailing`/`supportingText` prop 또는 `<ListItem.Leading>`/`<ListItem.Trailing>`/`<ListItem.Supporting>` 컴파운드 자식.
- 탭은 행 전체 사각형에서 인식(`onPress`).
- **섹션 헤더(그룹 캡션)는 universal에 없다.** 필요하면 swift-ui `Section`으로 내려간다(`./swift-ui.md`).

## Picker

```tsx
import { Host, Picker } from '@expo/ui';

<Host matchContents>
  <Picker
    selectedValue={locale}
    onValueChange={(v) => setLocale(v)}
    appearance="menu"      // 'menu'(드롭다운) | 'wheel'(iOS 인라인 로터)
  >
    <Picker.Item label="한국어" value="ko" />
    <Picker.Item label="English" value="en" />
  </Picker>
</Host>
```

## Switch

```tsx
import { Host, Switch } from '@expo/ui';

<Host matchContents>
  <Switch value={on} onValueChange={setOn} label="알림" />
</Host>
```

## 주의

- SwiftUI/Compose 호스트는 bare 문자열을 못 그린다. 텍스트는 항상 `Text`(또는 `ListItem` children처럼 컴포넌트가 내부에서 감싸주는 경우)로.
- 고밀도 대량 목록은 `List` 대신 RN `FlatList`(각 `ListItem`이 JS 스레드 비용).
- 색·tint는 `useTheme()` 토큰만 주입.
