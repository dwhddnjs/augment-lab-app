/**
 * 빌드 목록 날짜 유틸 — 저장된 빌드를 '날(day)' 단위 섹션으로 묶고 표시용으로 포맷한다.
 */
import type { Locale } from "@/hooks/use-locale";
import type { SavedBuild } from "@/lib/build-storage";

export interface BuildSection {
  key: string;
  title: string;
  data: SavedBuild[];
}

/** 로컬 기준 같은 '날(day)'을 식별하는 키. createdAt은 ISO 문자열. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** 최신순으로 정렬한 뒤 같은 날짜끼리 섹션으로 묶는다(ISO는 사전순=시간순). */
export function groupByDate(builds: SavedBuild[], locale: Locale): BuildSection[] {
  const sorted = [...builds].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const sections: BuildSection[] = [];
  let current: BuildSection | null = null;
  for (const b of sorted) {
    const key = dayKey(b.createdAt);
    if (!current || current.key !== key) {
      current = {
        key,
        title: new Date(b.createdAt).toLocaleDateString(
          locale === "ko" ? "ko-KR" : "en-US",
        ),
        data: [],
      };
      sections.push(current);
    }
    current.data.push(b);
  }
  return sections;
}

/** "2026. 6. 17." (ko) 또는 "6/17/2026" (en) 형식을 "2026.6.17" 로 통일. */
export function formatDate(input: string): string {
  if (input.includes(".")) {
    const [year, month, day] = input
      .split(".")
      .map((v) => v.trim())
      .filter(Boolean);
    return `${year}.${Number(month)}.${Number(day)}`;
  }

  if (input.includes("/")) {
    const [month, day, year] = input.split("/").map((v) => v.trim());
    return `${year}.${Number(month)}.${Number(day)}`;
  }

  throw new Error("지원하지 않는 날짜 형식입니다.");
}
