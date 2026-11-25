---
id: I-04c
title: 기존 사용자 데이터 이관 (AsyncStorage)
wave: W0
status: todo
depends: I-04a, I-03
owns: native/ios/AugmentCore/Sources/AugmentCore/Migration/, native/ios/AugmentCore/Tests/AugmentCoreTests/Migration/
spec: storage.md §4
rn: node_modules/@react-native-async-storage/async-storage/ios/RNCAsyncStorage.mm, src/lib/build-storage.ts
---

# I-04c 기존 사용자 데이터 이관 (AsyncStorage)

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
1.6.2(RN)에서 업데이트한 사용자의 빌드·테마·언어가 그대로 남게 한다. **데이터 손실 방지 작업이라 가장 엄격하게 한다.**

## 체크리스트
- [ ] 경로: `Application Support/<bundleId>/RCTAsyncLocalStorage_V1/`(+ 선택 폴백 `Documents/RCTAsyncLocalStorage_V1`)
- [ ] manifest 읽기 규칙: 키 없음 / `null` → md5 파일 / 문자열. MD5는 CryptoKit `Insecure.MD5`, 소문자 hex.
- [ ] 키 5개 이관: builds(parse 경유), theme, locale, review, 현재 버전 프리웜 플래그
- [ ] 완료 표시 `migration:asyncstorage:v1` — 이미 있으면 건너뛴다. **원본 폴더는 지우지 않는다.**
- [ ] 실패해도 앱은 계속 진행한다. 결과(옮긴 키 수·오류)를 돌려줘서 Sentry breadcrumb로 남길 수 있게 한다.
- [ ] 테스트: 픽스처 폴더 3종(인라인 값, `null` + md5 파일, md5 파일 누락), 두 번 실행해도 결과 같음, 미리 계산한 md5 이름 5개 일치

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-04c` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] I-42 리허설에서 실제 업데이트 설치로 확인한다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
