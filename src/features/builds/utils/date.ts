/**
 * 빌드 카드의 날짜 표시 — 오늘·어제는 말로, 그 밖은 "11.18"(다른 해면 "2025.11.18").
 */
import type { Locale } from "@/hooks/use-locale";

const WORDS: Record<Locale, { today: string; yesterday: string }> = {
  ko: { today: "오늘", yesterday: "어제" },
  en: { today: "Today", yesterday: "Yesterday" },
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** 로컬 자정 기준 며칠 전인지. createdAt 은 ISO 문자열. */
function daysAgo(date: Date, now: Date): number {
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((midnight(now) - midnight(date)) / DAY_MS);
}

export function dayLabel(iso: string, locale: Locale, now = new Date()): string {
  const date = new Date(iso);
  const ago = daysAgo(date, now);
  const words = WORDS[locale] ?? WORDS.en;
  if (ago === 0) return words.today;
  if (ago === 1) return words.yesterday;
  const md = `${date.getMonth() + 1}.${date.getDate()}`;
  return date.getFullYear() === now.getFullYear() ? md : `${date.getFullYear()}.${md}`;
}

/** 최근 7일(오늘 포함) 안에 만든 빌드인지 — 홈 필터 "최근 7일". */
export function isWithinWeek(iso: string, now = new Date()): boolean {
  return daysAgo(new Date(iso), now) < 7;
}
