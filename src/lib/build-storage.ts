/**
 * build-storage — 드래프트 결과(빌드) 로컬 영속화.
 *
 * 로그인 없이 동작해야 하므로 AsyncStorage에 저장한다. 챔피언/증강/아이템은
 * id만 저장하고, 화면에서 useChampions()/useAugments()/useItems() 훅으로
 * 로케일별 JSON에서 재해석한다 (로케일 전환에 안전).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'builds:v1';

export type GameMode = 'aram' | 'arena';

export interface SavedBuild {
  id: string;
  /** 게임 모드. mode 없는 기존 데이터는 readAll에서 'aram'으로 폴백한다. */
  mode: GameMode;
  championId: string;
  /** 픽한 증강 id — 칼바람 최대 6, 아레나는 레벨업 누적 */
  augmentIds: string[];
  /** 선택한 아이템 id — 칼바람 0~6, 아레나는 전설/신발 누적 */
  itemIds: string[];
  /** (아레나) 증강 id → 강화 레벨. 칼바람 빌드에는 없음. */
  augmentLevels?: Record<string, number>;
  /** (아레나) 보유 프리즘 아이템 id. */
  prismaticIds?: string[];
  /** (아레나) 보유 능력치 모루 id. */
  shardIds?: string[];
  /** ISO 8601 */
  createdAt: string;
}

async function readAll(): Promise<SavedBuild[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // mode 필드 도입 전 데이터는 칼바람(aram)으로 간주한다.
    return parsed.map((b) => ({ ...b, mode: b.mode ?? 'aram' }));
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

export async function listBuilds(mode?: GameMode): Promise<SavedBuild[]> {
  const builds = await readAll();
  const filtered = mode ? builds.filter((b) => b.mode === mode) : builds;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
