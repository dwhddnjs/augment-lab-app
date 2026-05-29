# Select Champion Modal — UI 개선 플랜

## Context

`src/app/select-champion-modal.tsx`의 챔피언 선택 모달 UX를 개선한다. 현재는 단순 4열 그리드 + 시작 버튼 구조라 챔피언이 많아질수록 탐색이 어렵다. 검색(이름/초성), 역할 필터, 가나다 정렬, 모달 grabber, 제스쳐 닫힘을 추가해 한국어 사용자가 빠르게 챔피언을 찾을 수 있게 한다.

## 변경 요약

1. **타이틀**: `type="title"`(32) → `type="heading"`(22), `textAlign: 'center'` → `flex-start`(좌측 정렬).
2. **검색 바**: 챔피언 이름 + **한글 초성** 검색 지원 (`ㅇㅈ` → "이즈리얼" 등).
3. **정렬**: 챔피언 목록을 현재 로케일 기준 가나다순(`localeCompare`)으로 정렬.
4. **역할 필터 탭**: 전체 / 전사 / 암살자 / 마법사 / 탱커 / 원거리 / 서포터 (가로 스크롤 칩).
5. **모달 grabber**: 상단에 흰색 둥근 바(grabber) 시각 표시 + 제스쳐 닫힘 활성화.

## 파일 수정 목록

### 새 파일
- `src/lib/hangul.ts` — 초성 추출/매칭 유틸 (의존성 없이 codepoint 계산).

### 수정 파일
- `src/app/select-champion-modal.tsx` — 메인 UI 재구성.
- `src/app/_layout.tsx` — `select-champion-modal` Stack.Screen 옵션에 `gestureEnabled: true` 명시(기본값이지만 명시), iOS 제스쳐 보장.

## 구현 디테일

### 1. 한글 초성 유틸 (`src/lib/hangul.ts`)

```ts
const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function toChoseong(str: string): string {
  let out = '';
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      out += CHOSEONG[Math.floor((code - 0xAC00) / 588)];
    } else {
      out += ch;
    }
  }
  return out;
}

// query가 전부 초성이면 초성 매칭, 아니면 일반 부분 문자열 매칭(둘 다 lowercase)
export function matchChampionName(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const lowerName = name.toLowerCase();
  if (lowerName.includes(q)) return true;
  // 초성 쿼리 처리: 쿼리에 한글 초성만 들어있을 때
  const isChoseongOnly = /^[ㄱ-ㅎ\s]+$/.test(query.trim());
  if (isChoseongOnly) {
    return toChoseong(name).includes(query.trim());
  }
  return false;
}
```

### 2. 모달 화면 (`src/app/select-champion-modal.tsx`)

상태:
- `query: string` — 검색어
- `selectedTag: string | null` — `null`이면 '전체'
- `selectedId: string | null` — 기존 유지

데이터 파이프라인:
```ts
const filtered = useMemo(() => {
  return champions
    .filter((c) => !selectedTag || c.tags.includes(selectedTag))
    .filter((c) => matchChampionName(c.name, query))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}, [champions, selectedTag, query, locale]);
```
(React Compiler가 활성화돼 있으므로 `useMemo` 생략 가능 — 단순히 인라인 계산해도 무방.)

레이아웃 구조(위에서 아래로):
1. **Grabber** — `<View>` 폭 40, 높이 5, `Radius.full`, `colors.text.tertiary` 또는 `#ffffff80`, 상단 중앙 정렬.
2. **타이틀** — `<ThemedText type="heading">` 좌측 정렬.
3. **검색 바** — `<TextInput>` + 검색 아이콘. `colors.surface.raised` 배경, `Radius.md`, placeholder는 i18n.
4. **역할 필터** — 가로 `FlatList`(또는 `ScrollView horizontal`), 칩 컴포넌트는 인라인 `Pressable`. 선택 시 `colors.accent.default` 배경 + `onAccent` 텍스트, 미선택은 `colors.surface.raised` + `text.secondary`.
5. **챔피언 그리드** — 기존 `FlatList numColumns={4}` 유지. `data={filtered}`.
6. **시작 버튼** — 기존 유지.

i18n dictionary 확장:
```ts
const t = {
  ko: {
    title: '챔피언 선택',
    start: '시작하기',
    searchPlaceholder: '챔피언 검색 (초성 가능)',
    all: '전체',
    Fighter: '전사', Assassin: '암살자', Mage: '마법사',
    Tank: '탱커', Marksman: '원거리', Support: '서포터',
  },
  en: {
    title: 'Select Champion',
    start: 'Start',
    searchPlaceholder: 'Search champions',
    all: 'All',
    Fighter: 'Fighter', Assassin: 'Assassin', Mage: 'Mage',
    Tank: 'Tank', Marksman: 'Marksman', Support: 'Support',
  },
};
```

역할 탭 정의:
```ts
const TAGS = ['Fighter', 'Assassin', 'Mage', 'Tank', 'Marksman', 'Support'] as const;
```
'전체' 칩은 `selectedTag === null`일 때 활성. 다른 칩 탭하면 해당 태그 설정, 같은 칩 다시 탭하면 `null`로 복귀(또는 항상 selectedTag로 교체 — 더 명확). 같은 칩 재탭 → '전체'로 토글하는 동작 채택.

### 3. 제스쳐 닫힘 (`src/app/_layout.tsx`)

iOS에서 `presentation: 'modal'`의 swipe-to-dismiss는 기본 활성이지만, FlatList가 제스쳐를 가로채는 케이스가 있다. 옵션에 명시:
```tsx
<Stack.Screen
  name="select-champion-modal"
  options={{
    presentation: 'modal',
    headerShown: false,
    gestureEnabled: true,
  }}
/>
```
그리드 자체는 세로 스크롤이라 상단에서 아래로 끄는 제스쳐와 충돌하지 않으므로 충분. 만약 안 닫히면 그리드 상단 여백(grabber 영역)에서 시작하는 제스쳐로 충분히 동작한다.

### 4. 스타일 토큰 준수

- 모든 색상은 `useTheme().colors`에서 가져와 인라인 스타일로 적용.
- `borderRadius`는 `Radius.*`, 여백은 `Spacing.*`.
- TextInput placeholder 색상은 `colors.text.tertiary`.
- 다크/라이트 모두 자연스럽게 보이도록 `Theme` 토큰만 사용.

## Verification

1. `npm run ios` — iOS 시뮬레이터에서:
   - 모달 열고 상단 흰 grabber 바 표시 확인.
   - 모달 상단에서 아래로 스와이프 → 닫힘.
   - 타이틀이 작아지고 좌측 정렬 확인.
   - 검색창에 "ㅇㅈ" 입력 → "이즈리얼" 등 매칭 확인.
   - 검색창에 "이즈" 입력 → 부분 문자열 매칭 확인.
   - 영문 로케일에서 "ez" 입력 → "Ezreal" 매칭 확인.
   - 역할 칩 탭 → 해당 역할 챔피언만 노출.
   - 정렬이 가나다순(ko) / A-Z(en) 확인.
2. `npm run android` — Android에서 grabber 표시 및 기능 동작 확인.
3. `npm run lint` — 린트 통과.

## 참고

- 챔피언 데이터 `tags`는 양 로케일 모두 영문(`Fighter`, `Assassin`...)으로 저장됨 (`src/data/champions.ko.json` 확인). 따라서 내부 키는 영문, 표시 라벨은 i18n으로 변환.
- `useChampions()` → `Champion[]` (`src/hooks/use-champions.ts`).
- `useLocale()` → `{ locale: 'ko' | 'en' }` (`src/hooks/use-locale.ts`).
- 디자인 토큰: `src/constants/theme.ts`.
- React Compiler 활성 — `useMemo`/`useCallback` 수동 추가 자제.
