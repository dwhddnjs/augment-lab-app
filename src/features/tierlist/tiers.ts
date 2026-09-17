/**
 * 티어리스트 데이터 접근 + S/A/B/C/D 그룹핑.
 *
 * tierlist.json 은 `scripts/fetch-data/fetch-tierlist.ts` 가 굽는다. 소스 티어 순
 * (동티어 내 승률 내림차순)으로 이미 정렬되고 `tier` 도 거기서 박아 오므로 여기서
 * 절대 sort 하지 않고 계산도 하지 않는다.
 *
 * 티어는 **우리가 매기지 않는다** — aram.gg 가 주는 자체 티어(승률+픽률 종합)를 그대로
 * 쓴다. 승률만으로 줄 세우면 픽률 3%대 장인픽이 S로 올라오고 징크스 같은 주력픽이
 * 빠져서 다른 사이트와 결과가 어긋난다. 소스 티어는 우리가 못 보는 표본 수까지 반영해
 * 계산돼 선형결합으로는 재현되지 않는다.
 *
 * 칼바람 광란(아수라장) 전용이다 — 아레나는 지표가 승률이 아니라 평균 등수(8인 2인팀)라
 * 같은 표에 섞을 수 없고, 클래식은 Riot 이 Mayhem 계열 match-v5 를 막아 둔 탓에 어느
 * 집계 사이트에도 데이터가 없다.
 *
 * 증강 희귀도는 담지 않는다. 호출측이 앱 증강 풀에서 조인한 레코드의 `.rarity` 를 쓴다.
 * React 훅 없음 — 순수 함수만.
 */
import data from '@/features/tierlist/data/tierlist.json';

export const TIERS = ['S', 'A', 'B', 'C', 'D'] as const;
export type Tier = (typeof TIERS)[number];

/**
 * 증강 한 줄 — `[augSlugs 인덱스, 승률×10000, 소스 티어(1~4)]`.
 * 챔피언마다 120개 넘게 실어서 객체로 두면 파일이 1.3MB가 된다(fetch 스크립트 주석 참고).
 */
export type AugEntry = [number, number, number];

/** 증강 슬러그 사전 — `AugEntry` 첫 칸이 이 배열의 인덱스다. */
export const augSlugs: string[] = data.augIds;

/** 증강 소스 티어(1~4) → 표시 등급. 챔피언 티어와 달리 D가 없다. */
export function augTierOf(tier: number): Tier {
  return TIERS[tier - 1] ?? 'D';
}

export interface TierRow {
  /** 앱 champions.json 의 `key`(숫자 문자열). */
  key: string;
  score: number;
  /** 픽률. */
  sub: number;
  /** 소스 티어에서 굽힌 표시 등급. fetch 스크립트가 박는다. */
  tier: Tier;
  augments: AugEntry[];
  /** 완성템 구매 순서(아이템 id). */
  build: string[];
  /** 상황템(아이템 id) — 판수 내림차순, build 와 겹치지 않는다. */
  situational: string[];
  /** 최다 스펠 조합(스펠 id). `spellIcons` 키다. */
  spells: number[];
  /** 위 스펠 조합의 픽률 — 태그 빌드 전체 판수 대비. */
  spellPick: number;
}

const COLUMNS = 2;

/** 승률·픽률 표시 — 목록과 모달이 같은 자릿수를 써야 한다. */
export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/** 출처 문구의 `{patch}`·`{date}` 를 생성물 값으로 채운다. */
export function formatSource(text: string): string {
  return text.replace('{patch}', data.patch).replace('{date}', data.date);
}

/** 스펠 id → CDragon iconPath. 이름은 그리지 않아 로케일 무관이다. */
export const spellIcons: Record<string, string> = data.spellIcons;

/** JSON 의 `tier` 는 string 으로 추론된다 — 굽는 쪽에서 Tier 로 좁혀 쓴다. */
export function tierRows(): TierRow[] {
  return data.aram as unknown as TierRow[];
}

export function findTierRow(key: string): TierRow | undefined {
  return tierRows().find((r) => r.key === key);
}

/**
 * SectionList 용 섹션. `data` 는 챔피언이 아니라 **행**(COLUMNS 개 묶음)이다 —
 * SectionList 에는 numColumns 가 없어서 격자를 직접 만든다.
 *
 * `match` 는 검색 필터. 티어는 행에 박혀 있으니 검색해도 챔피언의 티어가 바뀌지 않는다.
 * 결과가 없는 티어는 헤더까지 통째로 빠진다.
 */
export function tierSections(
  match?: (row: TierRow) => boolean,
): { title: Tier; data: TierRow[][] }[] {
  const rows = tierRows();
  return TIERS.map((title) => {
    const slice = rows.filter((r) => r.tier === title && (!match || match(r)));
    const grid: TierRow[][] = [];
    for (let j = 0; j < slice.length; j += COLUMNS) grid.push(slice.slice(j, j + COLUMNS));
    return { title, data: grid };
  }).filter((s) => s.data.length > 0);
}
