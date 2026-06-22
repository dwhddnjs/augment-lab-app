/**
 * use-locale — 현재 로케일을 전역 보관·영속화한다.
 *
 * 모듈 전역변수 + useSyncExternalStore로 구독해 setLocale 시 useTranslation을
 * 쓰는 모든 화면이 즉시 리렌더된다. 선택은 AsyncStorage('locale:v1')에 저장하고
 * 앱 시작 시 loadLocale()로 복원한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type Locale = 'ko' | 'en';

const STORAGE_KEY = 'locale:v1';

let _locale: Locale = 'ko';
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Locale {
  return _locale;
}

export function getLocale(): Locale {
  return _locale;
}

/** 앱 시작 시 1회 호출 — 저장된 로케일을 복원한다. */
export async function loadLocale(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === 'ko' || raw === 'en') {
      _locale = raw;
      emit();
    }
  } catch {
    // 읽기 실패는 기본값('ko') 유지.
  }
}

export function setLocale(next: Locale) {
  _locale = next;
  emit();
  AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { locale, setLocale };
}
