/// 증강·아이템 설명 리치 텍스트 정리 (RN `src/lib/augment-text.ts`). 정규식과 순서를 그대로 옮겼다.
public func cleanAugmentDescription(_ raw: String) -> String {
    let steps: [(String, String, Bool)] = [
        (#"<br\s*/?>"#, "\n", true),          // 줄바꿈
        (#"<[^>]+>"#, "", false),              // 리치 태그
        (#"\(%i:[^%]*%\)"#, "", false),        // (%i:scaleAP%) 괄호 안 아이콘
        (#"%i:[^%]*%"#, "", false),            // %i:scaleAD% 아이콘
        (#"@[^@]+@%?"#, "", false),            // @BaseCD@ / @ADAmp*100@% 숫자 자리(뒤 % 포함)
        (#"\{\{[^}]*\}\}"#, "", false),        // {{ template }}
        (#"\|[a-zA-Z]+"#, "", false),          // |ap 파이프 표기
        (#";[^|<\s]+"#, "", false),            // ;color 표기
        (#"\(\s*\)"#, "", false),              // 남은 빈 괄호
        (#"\s+([.,%)])"#, "$1", false),        // 구두점 앞 공백(줄바꿈 포함)
        (#"[ \t]{2,}"#, " ", false),           // 연속 공백
        (#"\n{2,}"#, "\n", false),
    ]
    return steps.reduce(raw) { s, step in regexReplace(s, step.0, step.1, ignoreCase: step.2) }
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

/// 아이템 고유 효과만 — `<stats>` 블록(스탯 요약과 중복)을 걷어낸 뒤 증강과 같은 정리 (RN `items/text.ts`).
public func cleanItemDescription(_ raw: String) -> String {
    cleanAugmentDescription(regexReplace(raw, #"<stats>[\s\S]*?</stats>"#, "", ignoreCase: true))
}

/// JS `String.replace(token, value)` — **처음 한 번만** 바꾼다 (`{n}` `{spell}` `{patch}` `{date}`).
public func fillFirst(_ template: String, _ token: String, _ value: String) -> String {
    guard let r = template.range(of: token) else { return template }
    return template.replacingCharacters(in: r, with: value)
}
