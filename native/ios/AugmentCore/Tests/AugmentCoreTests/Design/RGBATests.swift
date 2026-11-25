import Testing
@testable import AugmentCore

struct RGBATests {
    @Test func parsesTokenForms() throws {
        #expect(RGBA("#0E0F12") == RGBA(r: 14 / 255, g: 15 / 255, b: 18 / 255))
        let suffixed = try #require(RGBA("#E83850" + "4D")) // RN `color + StageAlpha.glow`
        #expect(suffixed.r == 0xE8 / 255.0 && suffixed.a == 0x4D / 255.0)
        #expect(RGBA("rgba(0,233,148,0.14)") == RGBA(r: 0, g: 233 / 255, b: 148 / 255, a: 0.14))
        #expect(RGBA("rgba(8, 9, 11, 0.96)") == RGBA(r: 8 / 255, g: 9 / 255, b: 11 / 255, a: 0.96))
    }

    @Test func rejectsTypos() {
        for bad in ["#0E0F1", "0E0F12", "#GGGGGG", "rgba(1,2,3)", "rgb(1,2,3)", ""] { #expect(RGBA(bad) == nil, "\(bad)") }
    }
}
