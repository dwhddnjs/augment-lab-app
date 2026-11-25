// 승격 후보: I-02a가 `Data/AppLocale.swift`로 같은 타입을 소유한다. 둘 다 머지되면 이 파일을 지운다.
/// 앱 언어. RN `Locale = 'ko' | 'en'`.
public enum AppLocale: String, Codable, CaseIterable, Sendable {
    case ko, en
}
