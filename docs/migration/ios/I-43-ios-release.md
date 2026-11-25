---
id: I-43
title: iOS 출시 준비
wave: W3
status: todo
depends: I-41, I-42
owns: (직렬 — 이 작업 중에는 다른 iOS 작업을 돌리지 않는다)
spec: app-shell.md §7
rn: app.json(privacyManifests), eas.json
---

# I-43 iOS 출시 준비

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
TestFlight에 올릴 수 있는 상태로 만든다.

## 체크리스트
- [ ] PrivacyInfo.xcprivacy = app.json `privacyManifests`와 동일
- [ ] 버전 2.0.0, 빌드 번호 > EAS 원격 값(`eas build:version:get -p ios`)
- [ ] 서명(Xcode 자동, 팀 선택은 사용자)
- [ ] Sentry dSYM 업로드 빌드 단계
- [ ] 아카이브 → TestFlight 업로드 절차 문서화
- [ ] App Store '새로운 기능' 문구 초안(ko·en)

## 완료 기준
- [ ] 체크리스트 전부 완료, 사용자 확인 결과 기록
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] TestFlight 빌드가 기기에서 실행된다
- [ ] Sentry에 테스트 오류가 심볼과 함께 찍힌다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
