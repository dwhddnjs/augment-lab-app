import Foundation

/// JS `str.replace(/pattern/g, template)`와 같은 치환. 템플릿의 `$1`은 캡처 그룹.
/// 모듈 안 공용 — 텍스트 정리(I-02b) 등도 이걸 쓴다.
func regexReplace(_ string: String, _ pattern: String, _ template: String, ignoreCase: Bool = false) -> String {
    let regex = try! NSRegularExpression(pattern: pattern, options: ignoreCase ? [.caseInsensitive] : [])
    return regex.stringByReplacingMatches(
        in: string, range: NSRange(string.startIndex..., in: string), withTemplate: template)
}
