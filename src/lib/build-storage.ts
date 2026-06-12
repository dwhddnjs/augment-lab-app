/**
 * build-storage — 드래프트 결과(빌드) 로컬 영속화.
 *
 * 로그인 없이 동작해야 하므로 AsyncStorage에 저장한다. 챔피언/증강/아이템은
 * id만 저장하고, 화면에서 useChampions()/useAugments()/useItems() 훅으로
 * 로케일별 JSON에서 재해석한다 (로케일 전환에 안전).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'builds:v1';

export interface SavedBuild {
  id: string;
  championId: string;
  /** 픽한 증강 id — 최대 6 (Transmute: Chaos 보너스 포함) */
  augmentIds: string[];
  /** 선택한 아이템 id — 0~6 (건너뛰기 시 빈 배열) */
  itemIds: string[];
  /** ISO 8601 */
  createdAt: string;
}

async function readAll(): Promise<SavedBuild[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // 손상된 데이터는 빈 목록으로 폴백 — 다음 저장에서 덮어쓴다.
    return [];
  }
}

async function writeAll(builds: SavedBuild[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

function generateId(): string {
  // Hermes에 crypto.randomUUID 보장이 없어 시각+난수 조합으로 생성.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listBuilds(): Promise<SavedBuild[]> {
  const builds = await readAll();
  return builds.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBuild(id: string): Promise<SavedBuild | null> {
  const builds = await readAll();
  return builds.find((b) => b.id === id) ?? null;
}

export async function saveBuild(
  input: Omit<SavedBuild, 'id' | 'createdAt'>
): Promise<SavedBuild> {
  const build: SavedBuild = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const builds = await readAll();
  await writeAll([build, ...builds]);
  return build;
}

export async function removeBuild(id: string): Promise<void> {
  const builds = await readAll();
  await writeAll(builds.filter((b) => b.id !== id));
}
