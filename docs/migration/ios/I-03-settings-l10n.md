---
id: I-03
title: 설정 저장소·번역 헬퍼
wave: W0
status: todo
depends: I-00
owns: native/ios/AugmentCore/Sources/AugmentCore/Settings/, native/ios/AugmentCore/Tests/AugmentCoreTests/Settings/, native/ios/AugmentLab/Infra/Settings/
spec: storage.md §1·§5
rn: src/hooks/use-locale.ts, src/hooks/use-theme-preference.ts, src/hooks/use-theme.ts, src/lib/i18n.ts
---

# I-03 설정 저장소·번역 헬퍼

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
테마·언어 설정과 번역 패턴을 만든다. 키-값 저장소도 여기서 정한다(빌드 저장소가 이어서 쓴다).

## 체크리스트
- [ ] `KeyValueStore` 프로토콜(get/set/remove) — UserDefaults 구현 + 테스트용 메모리 구현(실패 주입 가능)
- [ ] `ThemePreference`(system/light/dark, 그 외 값은 system으로)
- [ ] `LocaleStore`: 저장값 → 없으면 기기 언어(ko면 ko, 아니면 en). 읽기 오류면 현재 값 유지.
- [ ] `@Observable AppSettings`(theme, locale)
- [ ] 번역 헬퍼 `L10n(ko:en:)` + `t(key)`(없으면 en → '') — 파일별 사전 패턴
- [ ] 앱 측(`Infra/Settings/`): 창 `overrideUserInterfaceStyle` 적용, 환경 주입
- [ ] 테스트: 기본값, 보정, 기기 언어 기본값, 저장 왕복

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-03` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 마이페이지가 생긴 뒤(I-32) 테마를 바꾸면 즉시 반영된다 — I-32에서 함께 확인

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
