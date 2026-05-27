# Select Champion Modal + i18n 도입 계획

## Context

현재 Plus 탭을 누르면 placeholder 모달(`src/app/modal.tsx:1-38`)이 올라오는데, 제목 "새로 만들기" + 닫기 버튼만 있는 상태. 이를 **챔피언 선택 모달**로 교체한다. 또한 글로벌 서비스를 지향하므로 UI 텍스트를 **로케일 기반**(`ko` / `en`)으로 분기한다. 현재 코드베이스에는 i18n 헬퍼가 없어 데이터 JSON 외 UI 텍스트는 한국어로 하드코딩되어 있다 (`src/app/modal.tsx:14,17`).

### 사용자 요구사항

- 파일명: `select-champion-modal`
- 상단 타이틀: "챔피언을 선택해주세요" (영문: "Select a Champion")
- 모든 챔피언 이미지 렌더링 (Riot Data Dragon CDN)
- 챔피언 탭 → 이미지 위에 보더 표시 / 같은 챔피언 다시 탭 → 보더 제거 (토글, 단일 선택)
- 하단 "시작하기" 버튼 (영문: "Start"), 선택 전에는 비활성화
- 모든 UI 텍스트는 로케일에 따라 한/영 분기
- CLAUDE.md에 i18n 규칙 추가

## 파일 변경 사항

### 1. 라우트 이름 변경: `modal` → `select-champion-modal`

**`src/app/modal.tsx` 삭제** 후 **`src/app/select-champion-modal.tsx` 신규 생성**.

라우트 이름이 바뀌므로 참조하는 두 파일도 업데이트:
- `src/app/_layout.tsx:14` — `<Stack.Screen name="modal" ... />` → `name="select-champion-modal"`
- `src/app/(tabs)/plus.tsx:5` — `router.navigate('/modal')` → `router.navigate('/select-champion-modal')`

### 2. i18n 유틸리티 신규 작성

#### `src/lib/i18n.ts` (신규)

```ts
import { useLocale } from '@/hooks/use-locale';
import type { Locale } from '@/types/locale'; // 기존 타입 사용

type Dict = Record<string, string>;
type Translations = Record<Locale, Dict>;

export function useTranslation<T extends Translations>(translations: T) {
  const { locale } = useLocale();
  return (key: keyof T['ko']) => translations[locale][key as string] ?? translations.en[key as string];
}
```

- 컴포넌트별로 사용할 `translations` 객체를 인자로 받는 hook 패턴
- 키 누락 시 `en` 폴백
- 별도 글로벌 dictionary 파일을 두지 않음 — 컴포넌트별로 자기 텍스트를 가까이 정의(LightWeight, 코드 응집도 ↑). 향후 규모 커지면 `src/locales/{ko,en}.json`으로 추출 가능

### 3. accent 컬러 토큰 추가

#### `src/constants/theme.ts` — `Colors` 객체에 추가
- `Colors.light.accent: '#3c87f7'` (기존 linkPrimary 컬러와 일치)
- `Colors.dark.accent: '#3c87f7'` (또는 다크용 보정 — 일단 동일하게)

`ThemeColor` 타입(theme.ts에 정의된 union)에 `'accent'` 추가.

### 4. `src/app/select-champion-modal.tsx` (신규)

```tsx
// 핵심 구조
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useChampions } from '@/hooks/use-champions';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';
import { Spacing } from '@/constants/theme';
import versionData from '@/data/version.json';

const t = {
  ko: { title: '챔피언을 선택해주세요', start: '시작하기' },
  en: { title: 'Select a Champion', start: 'Start' },
};

export default function SelectChampionModal() {
  const champions = useChampions();
  const theme = useTheme();
  const translate = useTranslation(t);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const version = versionData.version; // 형태 확인 필요 — 구현 시 검증
  const ddragonUrl = (imageKey: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageKey}`;

  const handleSelect = (id: string) => {
    setSelectedId((curr) => (curr === id ? null : id));
  };

  const handleStart = () => {
    // 후속: 선택된 챔피언을 어디로 넘길지 정하기 전까지 일단 닫기
    router.navigate('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          {translate('title')}
        </ThemedText>

        <FlatList
          data={champions}
          numColumns={4}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleSelect(item.id)} style={styles.cell}>
              <Image
                source={{ uri: ddragonUrl(item.imageKey) }}
                style={[
                  styles.image,
                  selectedId === item.id && { borderWidth: 3, borderColor: theme.accent },
                ]}
                contentFit="cover"
              />
              <ThemedText type="small" numberOfLines={1}>
                {item.name}
              </ThemedText>
            </Pressable>
          )}
        />

        <Pressable
          onPress={handleStart}
          disabled={!selectedId}
          style={[
            styles.startButton,
            { backgroundColor: theme.accent, opacity: selectedId ? 1 : 0.4 },
          ]}>
          <ThemedText themeColor="text">{translate('start')}</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}
```

핵심 스타일:
- `cell`: flex 비율로 4열 균등 분배, 패딩 `Spacing.one`
- `image`: aspectRatio 1, borderRadius, 기본은 보더 없음
- `startButton`: 하단 고정, paddingVertical `Spacing.three`, borderRadius `Spacing.three`

### 5. CLAUDE.md — i18n 규칙 추가

`### 플랫폼 분리 원칙` 섹션 다음에 `### i18n / 로케일 원칙` 신규 섹션 추가:

```markdown
### i18n / 로케일 원칙

글로벌 서비스이므로 **모든 사용자 노출 텍스트는 로케일 분기**할 것. 텍스트를 하드코딩하지 말고 `src/lib/i18n.ts`의 `useTranslation()` 훅을 사용:

- 컴포넌트 파일 상단에 `const t = { ko: {...}, en: {...} }` 형태의 dictionary 정의
- 컴포넌트 안에서 `const translate = useTranslation(t)` → `translate('key')`로 사용
- 키 누락 시 자동으로 `en` 폴백
- 데이터(챔피언/아이템/증강 이름 등)는 `useChampions()`처럼 이미 로케일 분기되어 있으므로 그대로 사용
```

## 재사용 컴포넌트/유틸

- `useChampions()` (`src/hooks/use-champions.ts:1-13`) — 현재 로케일의 챔피언 배열 반환
- `useLocale()` (`src/hooks/use-locale.ts:1-22`) — 현재 로케일 반환 (참고: 모듈-스코프 state 버그 있음, 본 작업 범위 밖)
- `useTheme()` (`src/hooks/use-theme.ts`) — 색상 팔레트 (accent 추가 후 자동 노출)
- `ThemedText`, `ThemedView` — 모달 컨테이너/제목/버튼 텍스트
- `Spacing` (`src/constants/theme.ts:54-62`) — 간격
- `expo-image`의 `Image` — `{ uri }` 패턴은 현재 코드베이스에 없음, 본 작업에서 처음 도입
- `src/data/version.json` — Data Dragon 버전 (형태는 구현 시 확인하여 `.version` 또는 전체 문자열 사용)

## 의존성

추가 설치 없음. 모두 기존 패키지로 가능:
- `expo-image`, `expo-router`, `react-native` (FlatList, Pressable)
- `react-native-safe-area-context`

## 검증 방법

1. **개발 빌드 실행** (Expo Go 미지원 — `@expo/ui`/`unstable-native-tabs` 때문):
   `npx expo run:ios` 또는 `eas build --profile development --platform ios`
2. **로케일 분기 확인** — `useLocale()`의 default가 `'ko'`이므로 한국어 텍스트("챔피언을 선택해주세요", "시작하기") 확인
3. **영어 확인** — 일시적으로 `src/hooks/use-locale.ts:5`의 `_locale`을 `'en'`으로 바꿔서 "Select a Champion", "Start" 확인 후 원복
4. **Plus 탭** → 모달이 시트로 올라오는지, 챔피언 그리드(4열)가 스크롤되는지
5. **이미지 로딩** — Data Dragon URL이 실제로 이미지를 반환하는지 (`version.json`의 버전이 유효한지)
6. **선택 토글** — 챔피언 탭 시 accent 색 보더 표시, 같은 챔피언 재탭 시 보더 제거
7. **시작하기 버튼** — 선택 전 비활성(opacity 0.4 + disabled), 선택 후 활성화 → 탭 시 `router.navigate('/')`로 닫힘

## 미확정 / 후속 결정

- **`version.json` 형태**: 구현 첫 단계에서 파일을 읽어 `{ version: "..." }` 객체인지 단순 문자열인지 확인 후 import 방식 결정
- **시작하기 후 동작**: 현재는 모달만 닫음 — 선택된 챔피언을 어디로 넘길지(전역 state, 라우트 params, AsyncStorage) 결정 필요. 본 작업 범위 밖
- **`useLocale` 버그**: listeners가 wire-up 안 되어 있고 persistence 없음 — 본 작업과 별도로 수정 필요
- **다크 모드 accent**: 라이트와 동일한 `#3c87f7` 사용. 디자인 확정되면 다크용 보정
