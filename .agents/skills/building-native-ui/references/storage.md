# 스토리지

## 키-값 스토리지

키-값 스토리지에는 localStorage 폴리필을 사용하세요. **AsyncStorage는 절대 사용하지 마세요.**

```tsx
import "expo-sqlite/localStorage/install";

// 단순 get/set
localStorage.setItem("key", "value");
localStorage.getItem("key");

// 객체를 JSON으로 저장
localStorage.setItem("user", JSON.stringify({ name: "홍길동", id: 1 }));
const user = JSON.parse(localStorage.getItem("user") ?? "{}");
```

## 무엇을 언제 사용할까

| 용도 | 솔루션 |
| ---------------------------------------------------- | ----------------------- |
| 단순 키-값 (설정, 환경설정, 소용량 데이터) | `localStorage` 폴리필 |
| 대용량 데이터셋, 복잡한 쿼리, 관계형 데이터 | 풀 `expo-sqlite` |
| 민감한 데이터 (토큰, 비밀번호) | `expo-secure-store` |

## React 상태와 함께 사용하기

반응형 업데이트를 위한 구독 기능이 있는 스토리지 유틸리티 만들기:

```tsx
// utils/storage.ts
import "expo-sqlite/localStorage/install";

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
    listeners.get(key)?.forEach((fn) => fn());
  },

  subscribe(key: string, listener: Listener): () => void {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(listener);
    return () => listeners.get(key)?.delete(listener);
  },
};
```

## 스토리지용 React 훅

```tsx
// hooks/use-storage.ts
import { useSyncExternalStore } from "react";
import { storage } from "@/utils/storage";

export function useStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    (cb) => storage.subscribe(key, cb),
    () => storage.get(key, defaultValue)
  );

  return [value, (newValue: T) => storage.set(key, newValue)];
}
```

사용법:

```tsx
function Settings() {
  const [theme, setTheme] = useStorage("theme", "light");

  return (
    <Switch
      value={theme === "dark"}
      onValueChange={(dark) => setTheme(dark ? "dark" : "light")}
    />
  );
}
```

## 복잡한 데이터를 위한 풀 SQLite

대용량 데이터셋이나 복잡한 쿼리에는 expo-sqlite를 직접 사용하세요:

```tsx
import * as SQLite from "expo-sqlite";

const db = await SQLite.openDatabaseAsync("app.db");

// 테이블 생성
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT
  )
`);

// 삽입
await db.runAsync("INSERT INTO events (title, date) VALUES (?, ?)", [
  "미팅",
  "2024-01-15",
]);

// 조회
const events = await db.getAllAsync("SELECT * FROM events WHERE date > ?", [
  "2024-01-01",
]);
```
