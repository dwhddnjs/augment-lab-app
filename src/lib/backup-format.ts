/**
 * backup-format — .alab 백업 파일의 포맷 정의와 순수 직렬화/파싱.
 *
 * IO를 하지 않으므로 node에서 그대로 실행해 검증할 수 있다(scripts/check-backup.ts).
 * 값은 AsyncStorage에 저장된 문자열 원문을 그대로 담는다 — 빌드 스키마를 다시
 * 정의하지 않아 build-storage가 바뀌어도 이 파일은 손댈 필요가 없다.
 */

/** 백업·복원·초기화 대상 AsyncStorage 키. 캐시(이미지 프리웜)와 세션 토큰은 제외. */
export const BACKUP_KEYS = ['builds:v1', 'theme:v1', 'locale:v1'] as const;

export type BackupKey = (typeof BACKUP_KEYS)[number];

const APP_ID = 'augment-lab';
const FORMAT_VERSION = 1;

export interface BackupFile {
  app: typeof APP_ID;
  version: typeof FORMAT_VERSION;
  /** ISO 8601 */
  exportedAt: string;
  /** 키 → AsyncStorage 원문 문자열. 저장된 적 없는 키는 빠진다. */
  data: Partial<Record<BackupKey, string>>;
}

export function serializeBackup(
  data: Partial<Record<BackupKey, string>>,
  exportedAt: string
): string {
  const file: BackupFile = { app: APP_ID, version: FORMAT_VERSION, exportedAt, data };
  return JSON.stringify(file, null, 2);
}

/**
 * `augment-lab-2026-08-20.alab` — 같은 날 재백업하면 파일 앱이 (1)을 붙인다.
 * 날짜는 사용자가 보는 값이므로 UTC가 아니라 기기 로컬 기준으로 만든다
 * (KST 새벽에 백업하면 ISO 날짜는 하루 전이 된다).
 */
export function buildFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `augment-lab-${local}.alab`;
}

/** 백업 파일에 담긴 빌드 개수. 복원 확인 다이얼로그 문구용. 파싱 실패 시 0. */
export function countBuilds(file: BackupFile): number {
  try {
    const parsed = JSON.parse(file.data['builds:v1'] ?? '[]');
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/**
 * .alab 텍스트를 검증해 파싱한다. 우리 파일이 아니거나 손상됐으면 throw —
 * 호출부는 실패 Alert만 띄우고 기존 데이터는 건드리지 않는다.
 */
export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('not-json');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not-object');

  const file = raw as Record<string, unknown>;
  if (file.app !== APP_ID) throw new Error('not-augment-lab');
  if (file.version !== FORMAT_VERSION) throw new Error('unsupported-version');
  if (!file.data || typeof file.data !== 'object' || Array.isArray(file.data)) {
    throw new Error('no-data');
  }

  const source = file.data as Record<string, unknown>;
  const data: Partial<Record<BackupKey, string>> = {};
  for (const key of BACKUP_KEYS) {
    const value = source[key];
    // 화이트리스트 밖 키는 그냥 버린다(미래 버전 파일도 아는 키만 복원).
    if (typeof value === 'string') data[key] = value;
  }
  // 빌드는 반드시 JSON 배열이어야 한다 — 깨진 값을 넣으면 목록이 통째로 비어 보인다.
  if (data['builds:v1'] !== undefined) {
    let builds: unknown;
    try {
      builds = JSON.parse(data['builds:v1']);
    } catch {
      throw new Error('builds-corrupt');
    }
    if (!Array.isArray(builds)) throw new Error('builds-corrupt');
  }

  return {
    app: APP_ID,
    version: FORMAT_VERSION,
    exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '',
    data,
  };
}
