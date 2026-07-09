# 드롭인 교체 `@expo/ui/community/*`

RN 커뮤니티 라이브러리를 **import 경로만 바꿔** 네이티브(SwiftUI) 구현으로 교체한다. 기존 코드를 마이그레이션할 때 사용.

실제 제공 목록은 `node_modules/@expo/ui/package.json`의 `exports`에서 `./community/*` 확인.

| 원본 | 교체 |
|---|---|
| `@gorhom/bottom-sheet` | `import BottomSheet, { BottomSheetView } from '@expo/ui/community/bottom-sheet'` |
| `@react-native-community/datetimepicker` | `import DateTimePicker from '@expo/ui/community/datetime-picker'` |
| `@react-native-community/slider` | `import Slider from '@expo/ui/community/slider'` |
| `@react-native-picker/picker` | `import { Picker } from '@expo/ui/community/picker'` |
| `@react-native-segmented-control/segmented-control` | `import SegmentedControl from '@expo/ui/community/segmented-control'` |
| `@react-native-menu/menu` | `import { MenuView } from '@expo/ui/community/menu'` |
| `@react-native-masked-view/masked-view` | `import { MaskedView } from '@expo/ui/community/masked-view'` |
| `react-native-pager-view` | `import PagerView from '@expo/ui/community/pager-view'` |

## 주의

- API는 원본과 호환되지만 **named vs default import** 차이를 타입(`.d.ts`)으로 확인.
- 새 화면이라면 드롭인보다 **universal 컴포넌트를 먼저** 쓴다(`Picker`/`Slider`/`Switch`/`BottomSheet`는 universal에 이미 존재). 드롭인은 기존 커뮤니티 라이브러리에서 갈아탈 때의 길.
