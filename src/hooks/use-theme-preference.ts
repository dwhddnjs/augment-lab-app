/**
 * use-theme-preference — 사용자가 고른 테마 모드를 전역 보관·영속화한다.
 *
 * 'system'이면 기기 색상 스킴(useColorScheme)을 따르고, 'light'/'dark'면 강제 고정.
 * 전역 라이브러리가 없으므로 모듈 전역변수 + useSyncExternalStore로 구독해
 * 테마 변경 시 모든 useTheme() 소비처(앱 전체)가 즉시 리렌더된다.
 * 선택은 AsyncStorage('theme:v1')에 저장하고 앱 시작 시 loadThemePreference()로 복원한다.
 *
 * 중요: RN의 `Appearance.setColorScheme`을 함께 호출해야 expo-ui 네이티브 뷰
 * (SwiftUI `List`/`Text` 등)까지 강제 테마를 따른다. expo-router `ThemeProvider`는
 * 헤더/배경 색만 제어하고 네이티브 컴포넌트는 OS `userInterfaceStyle`을 직접 따르기 때문.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme:v1';

let _pref: ThemePreference = 'system';
const listeners = new Set<() => void>();

/**
 * 앱 전체 색상 스킴을 강제(override)한다. 'system'이면 'unspecified'로 되돌려 OS를 따른다.
 * iOS에선 window.overrideUserInterfaceStyle로 전파되어 SwiftUI/expo-ui 뷰까지 반영된다.
 */
function applyColorScheme(pref: ThemePreference) {
  Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ThemePreference {
  return _pref;
}

export function getThemePreference(): ThemePreference {
  return _pref;
}

/** 앱 시작 시 1회 호출 — 저장된 선택을 복원한다. */
export async function loadThemePreference(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === 'system' || raw === 'light' || raw === 'dark') {
      _pref = raw;
      applyColorScheme(_pref);
      emit();
    }
  } catch {
    // 읽기 실패는 기본값('system') 유지.
  }
}

export function setThemePreference(next: ThemePreference) {
  _pref = next;
  applyColorScheme(next);
  emit();
  AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
}

export function useThemePreference() {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { preference, setPreference: setThemePreference };
}
