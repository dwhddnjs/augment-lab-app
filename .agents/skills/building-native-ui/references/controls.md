# 네이티브 컨트롤

네이티브 iOS 컨트롤은 내장 햅틱, 접근성, 플랫폼에 맞는 스타일링을 제공합니다.

## Switch

이진 on/off 설정에 사용합니다. 내장 햅틱이 있습니다.

```tsx
import { Switch } from "react-native";
import { useState } from "react";

const [enabled, setEnabled] = useState(false);

<Switch value={enabled} onValueChange={setEnabled} />;
```

### 커스터마이징

```tsx
<Switch
  value={enabled}
  onValueChange={setEnabled}
  trackColor={{ false: "#767577", true: "#81b0ff" }}
  thumbColor={enabled ? "#f5dd4b" : "#f4f3f4"}
  ios_backgroundColor="#3e3e3e"
/>
```

## Segmented Control

비탐색용 탭이나 모드 선택에 사용합니다. 기본 색상은 변경하지 마세요.

```tsx
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useState } from "react";

const [index, setIndex] = useState(0);

<SegmentedControl
  values={["전체", "진행중", "완료"]}
  selectedIndex={index}
  onChange={({ nativeEvent }) => setIndex(nativeEvent.selectedSegmentIndex)}
/>;
```

### 규칙

- 최대 4개 옵션 — 더 많은 경우 picker 사용
- 레이블은 짧게 (1-2단어)
- 커스텀 색상 사용 금지 — 네이티브 스타일링이 다크모드에 자동 적응

### 아이콘 포함 (iOS 14+)

```tsx
<SegmentedControl
  values={[
    { label: "목록", icon: "list.bullet" },
    { label: "그리드", icon: "square.grid.2x2" },
  ]}
  selectedIndex={index}
  onChange={({ nativeEvent }) => setIndex(nativeEvent.selectedSegmentIndex)}
/>
```

## Slider

연속 값 선택에 사용합니다.

```tsx
import Slider from "@react-native-community/slider";
import { useState } from "react";

const [value, setValue] = useState(0.5);

<Slider
  value={value}
  onValueChange={setValue}
  minimumValue={0}
  maximumValue={1}
/>;
```

### 커스터마이징

```tsx
<Slider
  value={value}
  onValueChange={setValue}
  minimumValue={0}
  maximumValue={100}
  step={1}
  minimumTrackTintColor="#007AFF"
  maximumTrackTintColor="#E5E5EA"
  thumbTintColor="#007AFF"
/>
```

### 단계 설정

```tsx
<Slider
  value={value}
  onValueChange={setValue}
  minimumValue={0}
  maximumValue={10}
  step={1}
/>
```

## 날짜/시간 Picker

팝오버가 있는 컴팩트 picker입니다. 내장 햅틱이 있습니다.

```tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";

const [date, setDate] = useState(new Date());

<DateTimePicker
  value={date}
  onChange={(event, selectedDate) => {
    if (selectedDate) setDate(selectedDate);
  }}
  mode="datetime"
/>;
```

### 모드

- `date` — 날짜만
- `time` — 시간만
- `datetime` — 날짜와 시간

### 표시 스타일

```tsx
// 컴팩트 인라인 (기본값)
<DateTimePicker value={date} mode="date" />

// 스피너 휠
<DateTimePicker
  value={date}
  mode="date"
  display="spinner"
  style={{ width: 200, height: 150 }}
/>

// 전체 캘린더
<DateTimePicker value={date} mode="date" display="inline" />
```

### 시간 간격

```tsx
<DateTimePicker
  value={date}
  mode="time"
  minuteInterval={15}
/>
```

### 최소/최대 날짜

```tsx
<DateTimePicker
  value={date}
  mode="date"
  minimumDate={new Date(2020, 0, 1)}
  maximumDate={new Date(2030, 11, 31)}
/>
```

## Stepper

숫자 값을 증가/감소시킵니다.

```tsx
import { Stepper } from "react-native";
import { useState } from "react";

const [count, setCount] = useState(0);

<Stepper
  value={count}
  onValueChange={setCount}
  minimumValue={0}
  maximumValue={10}
/>;
```

## TextInput

다양한 키보드 타입을 지원하는 네이티브 텍스트 입력입니다.

```tsx
import { TextInput } from "react-native";

<TextInput
  placeholder="텍스트를 입력하세요..."
  placeholderTextColor="#999"
  style={{
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  }}
/>
```

### 키보드 타입

```tsx
// 이메일
<TextInput keyboardType="email-address" autoCapitalize="none" />

// 전화번호
<TextInput keyboardType="phone-pad" />

// 숫자
<TextInput keyboardType="numeric" />

// 비밀번호
<TextInput secureTextEntry />

// 검색
<TextInput
  returnKeyType="search"
  enablesReturnKeyAutomatically
/>
```

### 여러 줄

```tsx
<TextInput
  multiline
  numberOfLines={4}
  textAlignVertical="top"
  style={{ minHeight: 100 }}
/>
```

## Picker (휠)

많은 옵션(5개 이상) 중 선택할 때 사용합니다.

```tsx
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";

const [selected, setSelected] = useState("js");

<Picker selectedValue={selected} onValueChange={setSelected}>
  <Picker.Item label="JavaScript" value="js" />
  <Picker.Item label="TypeScript" value="ts" />
  <Picker.Item label="Python" value="py" />
  <Picker.Item label="Go" value="go" />
</Picker>;
```

## 모범 사례

- **햅틱**: Switch와 DateTimePicker에는 내장 햅틱이 있으므로 추가하지 마세요.
- **접근성**: 네이티브 컨트롤은 기본적으로 적절한 접근성 레이블을 가집니다.
- **다크 모드**: 커스텀 색상 사용 금지 — 네이티브 스타일링이 자동 적응합니다.
- **간격**: 컨트롤 주위에 일관된 패딩을 사용하세요 (12-16pt).
- **레이블**: 컨트롤 위나 왼쪽에 레이블을 배치하세요.
- **그룹화**: 관련 컨트롤을 헤더가 있는 섹션으로 그룹화하세요.
