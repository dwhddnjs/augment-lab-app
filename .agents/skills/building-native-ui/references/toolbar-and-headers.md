# 툴바와 헤더

Stack 화면에 네이티브 iOS 툴바 항목을 추가합니다. 항목은 헤더 (왼쪽/오른쪽) 또는 하단 툴바 영역에 배치할 수 있습니다.

**중요:** iOS 전용. Expo SDK 55 이상에서 사용 가능.

## 메모 앱 예시

```tsx
import { Stack } from "expo-router";
import { ScrollView } from "react-native";

export default function FoldersScreen() {
  return (
    <>
      {/* ScrollView는 화면의 첫 번째 자식이어야 합니다 */}
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* 화면 콘텐츠 */}
      </ScrollView>
      <Stack.Screen.Title large>폴더</Stack.Screen.Title>
      <Stack.SearchBar placeholder="검색" onChangeText={() => {}} />
      {/* 헤더 툴바 - 오른쪽 */}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="folder.badge.plus" onPress={() => {}} />
        <Stack.Toolbar.Button onPress={() => {}}>편집</Stack.Toolbar.Button>
      </Stack.Toolbar>

      {/* 하단 툴바 */}
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.SearchBarSlot />
        <Stack.Toolbar.Button
          icon="square.and.pencil"
          onPress={() => {}}
          separateBackground
        />
      </Stack.Toolbar>
    </>
  );
}
```

## 메일 받은편지함 예시

```tsx
import { Color, Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function InboxScreen() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* 화면 콘텐츠 */}
      </ScrollView>
      <Stack.Screen options={{ headerTransparent: true }} />
      <Stack.Screen.Title>받은편지함</Stack.Screen.Title>
      <Stack.SearchBar placeholder="검색" onChangeText={() => {}} />
      {/* 헤더 툴바 - 오른쪽 */}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => {}}>선택</Stack.Toolbar.Button>
        <Stack.Toolbar.Menu icon="ellipsis">
          <Stack.Toolbar.Menu inline>
            <Stack.Toolbar.Menu inline title="정렬 기준">
              <Stack.Toolbar.MenuAction isOn>
                카테고리
              </Stack.Toolbar.MenuAction>
              <Stack.Toolbar.MenuAction>목록</Stack.Toolbar.MenuAction>
            </Stack.Toolbar.Menu>
            <Stack.Toolbar.MenuAction icon="info.circle">
              카테고리 정보
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
          <Stack.Toolbar.MenuAction icon="person.circle">
            연락처 사진 표시
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      {/* 하단 툴바 */}
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Button
          icon="line.3.horizontal.decrease"
          selected={isFilterOpen}
          onPress={() => setIsFilterOpen((prev) => !prev)}
        />
        <Stack.Toolbar.View hidden={!isFilterOpen}>
          <View style={{ width: 70, height: 32, justifyContent: "center" }}>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>필터 기준</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: Color.ios.systemBlue,
              }}
            >
              읽지 않음
            </Text>
          </View>
        </Stack.Toolbar.View>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.SearchBarSlot />
        <Stack.Toolbar.Button
          icon="square.and.pencil"
          onPress={() => {}}
          separateBackground
        />
      </Stack.Toolbar>
    </>
  );
}
```

## 배치

- `"left"` - 헤더 왼쪽
- `"right"` - 헤더 오른쪽
- `"bottom"` (기본값) - 하단 툴바

## 컴포넌트

### Button

- 아이콘 버튼: `<Stack.Toolbar.Button icon="star.fill" onPress={() => {}} />`
- 텍스트 버튼: `<Stack.Toolbar.Button onPress={() => {}}>완료</Stack.Toolbar.Button>`

**Props:** `icon`, `image`, `onPress`, `disabled`, `hidden`, `variant` (`"plain"` | `"done"` | `"prominent"`), `tintColor`

### Menu

액션을 그룹화하는 드롭다운 메뉴입니다.

```tsx
<Stack.Toolbar.Menu icon="ellipsis">
  <Stack.Toolbar.Menu inline>
    <Stack.Toolbar.MenuAction>최근 추가순 정렬</Stack.Toolbar.MenuAction>
    <Stack.Toolbar.MenuAction isOn>
      캡처 날짜순 정렬
    </Stack.Toolbar.MenuAction>
  </Stack.Toolbar.Menu>
  <Stack.Toolbar.Menu title="필터">
    <Stack.Toolbar.Menu inline>
      <Stack.Toolbar.MenuAction isOn icon="square.grid.2x2">
        모든 항목
      </Stack.Toolbar.MenuAction>
    </Stack.Toolbar.Menu>
    <Stack.Toolbar.MenuAction icon="heart">즐겨찾기</Stack.Toolbar.MenuAction>
    <Stack.Toolbar.MenuAction icon="photo">사진</Stack.Toolbar.MenuAction>
    <Stack.Toolbar.MenuAction icon="video">동영상</Stack.Toolbar.MenuAction>
  </Stack.Toolbar.Menu>
</Stack.Toolbar.Menu>
```

**Menu Props:** Button의 모든 props + `title`, `inline`, `palette`, `elementSize` (`"small"` | `"medium"` | `"large"`)

**MenuAction Props:** `icon`, `onPress`, `isOn`, `destructive`, `disabled`, `subtitle`

구분선이 있는 palette를 만들 때는 `inline`과 `elementSize="small"`을 함께 사용하세요. `palette`는 iOS 26에서 구분선을 적용하지 않습니다.

### Spacer

```tsx
<Stack.Toolbar.Spacer />           // 하단 툴바 - 유연한 크기
<Stack.Toolbar.Spacer width={16} /> // 헤더 - 명시적 너비 필요
```

### View

커스텀 React Native 컴포넌트를 삽입합니다. 커스텀 뷰를 추가할 때는 **명시적인 width와 height가 있는 자식이 하나**만 있어야 합니다.

```tsx
<Stack.Toolbar.View>
  <View style={{ width: 70, height: 32, justifyContent: "center" }}>
    <Text style={{ fontSize: 12, fontWeight: 700 }}>필터 기준</Text>
  </View>
</Stack.Toolbar.View>
```

커스텀 컴포넌트도 뷰에 전달할 수 있습니다:

```tsx
function CustomFilterView() {
  return (
    <View style={{ width: 70, height: 32, justifyContent: "center" }}>
      <Text style={{ fontSize: 12, fontWeight: 700 }}>필터 기준</Text>
    </View>
  );
}
...
<Stack.Toolbar.View>
  <CustomFilterView />
</Stack.Toolbar.View>
```

## 권장사항

- 복잡한 헤더를 만들 때는 단일 컴포넌트로 추출하세요.

```tsx
export default function Page() {
  return (
    <>
      <ScrollView>{/* 화면 콘텐츠 */}</ScrollView>
      <InboxHeader />
    </>
  );
}

function InboxHeader() {
  return (
    <>
      <Stack.Screen.Title>받은편지함</Stack.Screen.Title>
      <Stack.SearchBar placeholder="검색" onChangeText={() => {}} />
      <Stack.Toolbar placement="right">{/* 툴바 버튼들 */}</Stack.Toolbar>
    </>
  );
}
```

- `Stack.Toolbar`를 사용할 때는 모든 `Stack.Toolbar.*` 컴포넌트가 `Stack.Toolbar` 컴포넌트 안에 있어야 합니다.

이것은 **작동하지 않습니다**:

```tsx
function Buttons() {
  return (
    <>
      <Stack.Toolbar.Button icon="star.fill" onPress={() => {}} />
      <Stack.Toolbar.Button onPress={() => {}}>완료</Stack.Toolbar.Button>
    </>
  );
}

function Page() {
  return (
    <>
      <ScrollView>{/* 화면 콘텐츠 */}</ScrollView>
      <Stack.Toolbar placement="right">
        <Buttons /> {/* ❌ 이것은 작동하지 않습니다 */}
      </Stack.Toolbar>
    </>
  );
}
```

이것은 **작동합니다**:

```tsx
function ToolbarWithButtons() {
  return (
    <Stack.Toolbar>
      <Stack.Toolbar.Button icon="star.fill" onPress={() => {}} />
      <Stack.Toolbar.Button onPress={() => {}}>완료</Stack.Toolbar.Button>
    </Stack.Toolbar>
  );
}

function Page() {
  return (
    <>
      <ScrollView>{/* 화면 콘텐츠 */}</ScrollView>
      <ToolbarWithButtons /> {/* ✅ 이것은 작동합니다 */}
    </>
  );
}
```

## 제한사항

- iOS 전용
- `placement="bottom"`은 레이아웃 파일이 아닌 화면 컴포넌트 안에서만 사용 가능
- `Stack.Toolbar.Badge`는 `placement="left"` 또는 `"right"`에서만 작동
- 헤더 Spacer에는 명시적 `width` 필요

## 참고

문서 https://docs.expo.dev/versions/unversioned/sdk/router - 전체 API 확인용
