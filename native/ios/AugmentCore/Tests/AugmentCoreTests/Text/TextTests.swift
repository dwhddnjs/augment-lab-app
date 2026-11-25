import Testing
@testable import AugmentCore

// 기대값은 RN 함수(augment-text.ts · items/text.ts · hangul.ts · marked.ts)를 tsx로 직접 실행해 뽑았다(2026-11-26).
struct TextTests {
    @Test(arguments: [
        ("피해량 <scaleAD>@Dmg@</scaleAD> (%i:scaleAP%) 증가<br/>다음  줄<BR>  끝 .", "피해량 증가\n다음 줄\n 끝."),
        ("power|ap 증가 ;red 효과 {{ tpl }} ( ) , 끝\n\n\n둘", "power 증가 효과, 끝\n둘"),
        ("@ADAmp*100@% 증가 %i:scaleAD% 피해 \t\t 공백  .", "증가 피해 공백."),
    ])
    func augmentDescription(input: String, expected: String) {
        #expect(cleanAugmentDescription(input) == expected)
    }

    @Test func itemDescriptionDropsStats() {
        let ko = "<mainText><stats>공격력 <attention>40</attention><br>공격 속도 <attention>25%</attention><br>생명력 흡수 <attention>10%</attention></stats><br><br><passive>안개의 검</passive><br>기본 공격 시 적의 현재 체력의 <physicalDamage>일정 비율</physicalDamage>만큼 <physicalDamage>추가 물리 피해</physicalDamage>(<OnHit>적중 시</OnHit> )를 입힙니다.<br><br><passive>할퀴는 그림자</passive><br>챔피언에게 3회 기본 공격을 가하면 1초 동안 30% <status>둔화</status>시킵니다.</mainText>"
        let en = "<mainText><stats><attention>40</attention> Attack Damage<br><attention>25%</attention> Attack Speed<br><attention>10%</attention> Life Steal</stats><br><br><passive>Mist's Edge</passive><br>Attacks deal <physicalDamage>a percentage</physicalDamage> of enemy's current Health as <physicalDamage>bonus physical damage</physicalDamage> <OnHit>On-Hit</OnHit>.<br><br><passive>Clawing Shadows</passive><br>Attacking a champion 3 times <status>Slows</status> them by 30% for 1 second.</mainText>"
        #expect(cleanItemDescription(ko) == "안개의 검\n기본 공격 시 적의 현재 체력의 일정 비율만큼 추가 물리 피해(적중 시)를 입힙니다.\n할퀴는 그림자\n챔피언에게 3회 기본 공격을 가하면 1초 동안 30% 둔화시킵니다.")
        #expect(cleanItemDescription(en) == "Mist's Edge\nAttacks deal a percentage of enemy's current Health as bonus physical damage On-Hit.\nClawing Shadows\nAttacking a champion 3 times Slows them by 30% for 1 second.")
    }

    @Test(arguments: [
        ("아트록스", "ㅇㅌㄹㅅ", true), ("아트록스", "ㅇㅌ", true), ("아트록스", "아ㅌ", false),
        ("Aatrox", "AAT", true), ("아트록스", "  트록 ", true), ("아트록스", "", true),
        ("아트록스", "ㅇ ㅌ", false), ("Kai'Sa", "kai'", true), ("카이사", "ㅋㅇㅅ ", true),
    ])
    func choseongSearch(name: String, query: String, expected: Bool) {
        #expect(matchName(name, query) == expected)
    }

    @Test func markedParts() {
        #expect(parseMarked("[s]스킬[/s] [e]강화[/e]!") == [
            MarkedPart(text: "스킬", mark: "s"), MarkedPart(text: " "), MarkedPart(text: "강화", mark: "e"), MarkedPart(text: "!"),
        ])
        #expect(parseMarked("앞 [k]x[/k] 뒤") == [MarkedPart(text: "앞 "), MarkedPart(text: "x", mark: "k"), MarkedPart(text: " 뒤")])
        #expect(parseMarked("[a]짝 [/b]안맞음") == [MarkedPart(text: "[a]짝 [/b]안맞음")])
        #expect(parseMarked("").isEmpty)
        #expect(stripMarks("[e]강화[/e] [s]{spell}[/s] 스킬은 [h]체력 회복량[/h] 및 [b]보호막 흡수량[/b]이") == "강화 {spell} 스킬은 체력 회복량 및 보호막 흡수량이")
    }

    @Test func headlinerTextsHaveOnlyBalancedMarks() throws {
        let t = try RepoData.gameData(.ko).headlinerTexts
        for s in [t.skillTitle, t.skillBonus, t.skillBonusShort] + t.headliners.values.map(\.description) {
            #expect(!stripMarks(s).contains("[/"), "짝 안 맞는 표기: \(s)")
        }
    }

    @Test func fillReplacesFirstOnly() {
        #expect(fillFirst("{n}개 · {n}개", "{n}", "3") == "3개 · {n}개")
        #expect(fillFirst("없음", "{n}", "3") == "없음")
    }
}
