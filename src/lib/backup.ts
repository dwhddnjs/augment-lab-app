/**
 * backup — .alab 파일로 로컬 데이터를 내보내고/되돌리고/지운다.
 *
 * 앱을 삭제하면 AsyncStorage가 통째로 사라지므로(로그인 없음) 사용자가 직접
 * 파일로 들고 다닐 수 있게 한다. 대상 키는 backup-format의 BACKUP_KEYS.
 *
 * 파일 선택은 expo-file-system의 File.pickFileAsync를 쓴다(SDK 56 내장 —
 * expo-document-picker를 따로 넣지 않는다). iOS에선 원본을 건드리지 않고
 * 임시 복사본을 돌려주므로 바로 읽을 수 있다.
 *
 * 복원/초기화 후에는 refreshStores()로 세 스토어(빌드·로케일·테마)를 디스크에서
 * 다시 읽는다. 셋 다 useSyncExternalStore 구독이라 emit만 되면 화면이 즉시 따라온다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';

import { loadLocale } from '@/hooks/use-locale';
import { loadThemePreference } from '@/hooks/use-theme-preference';
import {
  BACKUP_KEYS,
  buildFileName,
  parseBackup,
  serializeBackup,
  type BackupFile,
  type BackupKey,
} from '@/lib/backup-format';
import { reloadBuilds } from '@/lib/build-storage';

async function refreshStores(): Promise<void> {
  await Promise.all([reloadBuilds(), loadLocale(), loadThemePreference()]);
}

/** 현재 데이터를 캐시 디렉토리의 .alab 파일로 쓰고 그 uri를 반환한다(공유 시트용). */
export async function exportBackup(): Promise<string> {
  const entries = await AsyncStorage.multiGet([...BACKUP_KEYS]);
  const data: Partial<Record<BackupKey, string>> = {};
  for (const [key, value] of entries) {
    if (value != null) data[key as BackupKey] = value;
  }

  const now = new Date();
  const exportedAt = now.toISOString();
  const file = new File(Paths.cache, buildFileName(now));
  // 같은 날 두 번째 백업이면 이전 파일이 남아 있다 — 덮어쓴다.
  file.create({ overwrite: true });
  file.write(serializeBackup(data, exportedAt));
  return file.uri;
}

/**
 * 시스템 파일 선택기를 띄워 .alab을 읽고 검증한다.
 * 취소하면 null. 우리 파일이 아니거나 손상됐으면 throw(저장소는 그대로).
 */
export async function pickBackupFile(): Promise<BackupFile | null> {
  const picked = await File.pickFileAsync();
  if (picked.canceled) return null;
  return parseBackup(await picked.result.text());
}

/** 검증된 백업으로 로컬 데이터를 통째로 교체한다. */
export async function applyBackup(file: BackupFile): Promise<void> {
  const entries = Object.entries(file.data) as [BackupKey, string][];
  // 쓰기를 먼저 하고 지우기를 나중에 — 중간에 실패해도 빈 저장소로 남지 않는다.
  if (entries.length > 0) await AsyncStorage.multiSet(entries);
  // 파일에 없는 키는 지운다 — 병합이 아니라 교체다.
  const written = new Set(entries.map(([key]) => key));
  const missing = BACKUP_KEYS.filter((key) => !written.has(key));
  if (missing.length > 0) await AsyncStorage.multiRemove([...missing]);
  await refreshStores();
}

/** 백업 대상 키를 전부 지운다(빌드 + 테마/언어 설정). 이미지 캐시는 건드리지 않는다. */
export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove([...BACKUP_KEYS]);
  await refreshStores();
}
