/// 파일별 번역 사전. RN `useTranslation({ko, en})` 대응.
///
///     private let L = L10n(
///         ko: ["title": "내 빌드"],
///         en: ["title": "My Builds"]
///     )
///     // 뷰 안: @Environment(AppSettings.self) private var settings
///     let t = L.t(settings.locale)
///     Text(t("title"))
public struct L10n: Sendable {
    let ko: [String: String]
    let en: [String: String]

    public init(ko: [String: String], en: [String: String]) {
        self.ko = ko
        self.en = en
    }

    /// 현재 언어 → en → '' 순으로 폴백한다.
    public func t(_ locale: AppLocale) -> (String) -> String {
        let dict = locale == .ko ? ko : en
        return { key in dict[key] ?? en[key] ?? "" }
    }
}
