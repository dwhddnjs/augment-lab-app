/**
 * build-storage — 드래프트 결과(빌드) 로컬 영속화.
 *
 * 로그인 없이 동작해야 하므로 AsyncStorage에 저장한다. 챔피언/증강/아이템은
 * id만 저장하고, 화면에서 useChampions()/useAugments()/useItems() 훅으로
 * 로케일별 JSON에서 재해석한다 (로케일 전환에 안전).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'builds:v1';

/**
 * 'aram'    — 칼바람 나락 아수라장
 * 'arena'   — 아레나
 * 'classic' — 아수라장 클래식 스타일(협곡 맵 453). 증강·플로우는 칼바람과 같고
 *             라운드가 4 또는 5, 아이템이 레트로 세트라는 점만 다르다.
 */
export type GameMode = 'aram' | 'arena' | 'classic';

/**
 * 드래프트(3장 중 1픽) 플로우를 공유하는 모드. 아레나는 자체 화면이라 빠진다.
 * AugmentMode 와 값이 같아 useAugmentPool 에 그대로 넘길 수 있다.
 */
export type DraftMode = Exclude<GameMode, 'arena'>;

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
  /** (아레나) 선택한 재련(특수 증강) id. */
  reforgeIds?: string[];
  /** ISO 8601 */
  createdAt: string;
}

// 인메모리 캐시 + 구독 — 저장/삭제가 즉시 구독자(목록 화면)에 반영되도록 한다.
// null = 아직 디스크에서 로드 전. 캐시는 항상 최신순(desc) 정렬 상태를 유지한다.
let cache: SavedBuild[] | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function sortDesc(builds: SavedBuild[]): SavedBuild[] {
  return [...builds].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 빌드 목록 변경 구독. 반환값 호출로 해제. useSyncExternalStore용. */
export function subscribeBuilds(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 현재 캐시 스냅샷(동기). 로드 전이면 null. 참조는 변경 시에만 바뀐다. */
export function getBuildsSnapshot(): SavedBuild[] | null {
  return cache;
}

async function readAll(): Promise<SavedBuild[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // mode 필드 도입 전 데이터는 칼바람(aram)으로 간주한다.
    const list = Array.isArray(parsed)
      ? parsed.map((b) => ({ ...b, mode: b.mode ?? 'aram' }))
      : [];
    cache = sortDesc(list);
  } catch {
    // 손상된 데이터는 빈 목록으로 폴백 — 다음 저장에서 덮어쓴다.
    cache = [];
  }
  // 최초 로드 완료를 구독자에게 알린다(스냅샷 null→배열).
  emit();
  return cache;
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
  return mode ? builds.filter((b) => b.mode === mode) : builds;
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
  // 캐시를 먼저 갱신하고 알린 뒤 디스크에 기록 — 목록이 즉시 반영된다.
  cache = sortDesc([build, ...builds]);
  emit();
  await writeAll(cache);
  return build;
}

export async function removeBuild(id: string): Promise<void> {
  const builds = await readAll();
  cache = builds.filter((b) => b.id !== id);
  emit();
  await writeAll(cache);
}

/**
 * 디스크에서 목록을 다시 읽어 캐시를 교체한다(백업 복원·데이터 초기화 후).
 * readAll이 끝에 emit하므로 구독 중인 목록 화면이 자동으로 갱신된다.
 */
export async function reloadBuilds(): Promise<void> {
  cache = null;
  await readAll();
}
