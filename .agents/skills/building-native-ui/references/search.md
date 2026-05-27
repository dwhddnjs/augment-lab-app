# 검색

## 헤더 검색 바

`headerSearchBarOptions`로 스택 헤더에 검색 바 추가하기:

```tsx
<Stack.Screen
  name="index"
  options={{
    headerSearchBarOptions: {
      placeholder: "검색",
      onChangeText: (event) => console.log(event.nativeEvent.text),
    },
  }}
/>
```

### 옵션

```tsx
headerSearchBarOptions: {
  // 플레이스홀더 텍스트
  placeholder: "항목 검색...",

  // 자동 대문자 변환 동작
  autoCapitalize: "none",

  // 입력 타입
  inputType: "text", // "text" | "phone" | "number" | "email"

  // 취소 버튼 텍스트 (iOS)
  cancelButtonText: "취소",

  // 스크롤 시 숨기기 (iOS)
  hideWhenScrolling: true,

  // 검색 중 네비게이션 바 숨기기 (iOS)
  hideNavigationBar: true,

  // 검색 중 배경 흐리기 (iOS)
  obscureBackground: true,

  // 위치
  placement: "automatic", // "automatic" | "inline" | "stacked"

  // 콜백
  onChangeText: (event) => {},
  onSearchButtonPress: (event) => {},
  onCancelButtonPress: (event) => {},
  onFocus: () => {},
  onBlur: () => {},
}
```

## useSearch 훅

검색 상태 관리를 위한 재사용 가능한 훅:

```tsx
import { useEffect, useState } from "react";
import { useNavigation } from "expo-router";

export function useSearch(options: any = {}) {
  const [search, setSearch] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerSearchBarOptions: {
        ...options,
        onChangeText(e: any) {
          setSearch(e.nativeEvent.text);
          options.onChangeText?.(e);
        },
        onSearchButtonPress(e: any) {
          setSearch(e.nativeEvent.text);
          options.onSearchButtonPress?.(e);
        },
        onCancelButtonPress(e: any) {
          setSearch("");
          options.onCancelButtonPress?.(e);
        },
      },
    });
  }, [options, navigation]);

  return search;
}
```

### 사용법

```tsx
function SearchScreen() {
  const search = useSearch({ placeholder: "항목 검색..." });

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FlatList
      data={filteredItems}
      renderItem={({ item }) => <ItemRow item={item} />}
    />
  );
}
```

## 필터링 패턴

### 단순 텍스트 필터

```tsx
const filtered = items.filter(item =>
  item.name.toLowerCase().includes(search.toLowerCase())
);
```

### 여러 필드 검색

```tsx
const filtered = items.filter(item => {
  const query = search.toLowerCase();
  return (
    item.name.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query) ||
    item.tags.some(tag => tag.toLowerCase().includes(query))
  );
});
```

### 디바운스 검색

비용이 많이 드는 필터링이나 API 호출의 경우:

```tsx
import { useState, useEffect, useMemo } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function SearchScreen() {
  const search = useSearch();
  const debouncedSearch = useDebounce(search, 300);

  const filteredItems = useMemo(() =>
    items.filter(item =>
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [debouncedSearch]
  );

  return <FlatList data={filteredItems} />;
}
```

## NativeTabs에서의 검색

검색 역할을 가진 NativeTabs를 사용하면 검색 바가 탭 바와 통합됩니다:

```tsx
// app/_layout.tsx
<NativeTabs>
  <NativeTabs.Trigger name="(home)">
    <Label>홈</Label>
    <Icon sf="house.fill" />
  </NativeTabs.Trigger>
  <NativeTabs.Trigger name="(search)" role="search">
    <Label>검색</Label>
  </NativeTabs.Trigger>
</NativeTabs>
```

```tsx
// app/(search)/_layout.tsx
<Stack>
  <Stack.Screen
    name="index"
    options={{
      headerSearchBarOptions: {
        placeholder: "검색...",
        onChangeText: (e) => setSearch(e.nativeEvent.text),
      },
    }}
  />
</Stack>
```

## 빈 상태

검색 결과가 없을 때 적절한 UI 표시하기:

```tsx
function SearchResults({ search, items }) {
  const filtered = items.filter(/* ... */);

  if (search && filtered.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: PlatformColor("secondaryLabel") }}>
          "{search}"에 대한 결과가 없습니다
        </Text>
      </View>
    );
  }

  return <FlatList data={filtered} />;
}
```

## 검색 제안

최근 검색어나 제안 표시하기:

```tsx
function SearchScreen() {
  const search = useSearch();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  if (!search && recentSearches.length > 0) {
    return (
      <View>
        <Text style={{ color: PlatformColor("secondaryLabel") }}>
          최근 검색
        </Text>
        {recentSearches.map((term) => (
          <Pressable key={term} onPress={() => /* 검색 적용 */}>
            <Text>{term}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return <SearchResults search={search} />;
}
```
