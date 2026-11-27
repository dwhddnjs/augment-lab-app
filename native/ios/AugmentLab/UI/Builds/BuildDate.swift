import AugmentCore
import Foundation

/// 빌드 카드 날짜 표시 (RN `builds/utils/date.ts`) — 오늘·어제는 말로, 그 밖은 "11.18"(다른 해면 "2025.11.18").
/// 날짜 경계는 로컬 자정이다.
enum BuildDate {
    private static let words: [AppLocale: (today: String, yesterday: String)] = [
        .ko: ("오늘", "어제"),
        .en: ("Today", "Yesterday"),
    ]

    /// `createdAt`(ISO 8601, 밀리초 있거나 없거나) → Date
    static func parse(_ iso: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: iso) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: iso)
    }

    /// 로컬 자정 기준 며칠 전인지
    static func daysAgo(_ date: Date, now: Date, calendar: Calendar = .current) -> Int {
        calendar.dateComponents([.day], from: calendar.startOfDay(for: date), to: calendar.startOfDay(for: now)).day ?? 0
    }

    static func dayLabel(_ iso: String, _ locale: AppLocale, now: Date = Date(), calendar: Calendar = .current) -> String {
        guard let date = parse(iso) else { return "" }
        let ago = daysAgo(date, now: now, calendar: calendar)
        let w = words[locale] ?? words[.en]!
        if ago == 0 { return w.today }
        if ago == 1 { return w.yesterday }
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        let md = "\(c.month!).\(c.day!)"
        return c.year == calendar.component(.year, from: now) ? md : "\(c.year!).\(md)"
    }

    /// 최근 7일(오늘 포함) 안에 만든 빌드인지 — 홈 필터 "최근 7일"
    static func isWithinWeek(_ iso: String, now: Date = Date(), calendar: Calendar = .current) -> Bool {
        guard let date = parse(iso) else { return false }
        return daysAgo(date, now: now, calendar: calendar) < 7
    }
}
