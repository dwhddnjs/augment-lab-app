---
id: I-02b
title: 텍스트 정리·초성 검색·마크 텍스트
wave: W0
status: done
depends: I-02a
owns: native/ios/AugmentCore/Sources/AugmentCore/Text/, native/ios/AugmentCore/Tests/AugmentCoreTests/Text/
spec: data.md §4·§5
rn: src/lib/hangul.ts, src/lib/augment-text.ts, src/features/items/text.ts, src/features/headliners/marked.ts
---

# I-02b 텍스트 정리·초성 검색·마크 텍스트

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
화면 곳곳에서 쓰는 순수 텍스트 함수를 옮긴다.

## 체크리스트
- [x] `matchName` — 초성 규칙 그대로(섞인 질의는 불일치)
- [x] `cleanAugmentDescription` — 13단계 정규식을 순서 그대로
- [x] `cleanItemDescription` — `<stats>` 블록 제거 후 정리
- [x] 마크 텍스트 파서: `[(key, text)]` 조각 + `stripMarks`
- [x] 치환 헬퍼: 첫 1회만 치환 (`{n}` `{spell}` `{patch}` `{date}`)
- [x] 테스트: 초성 일치·불일치 예, 아이템 3153 결과, 짝 안 맞는 마크 태그. 기대값은 RN 함수를 `npx tsx -e`로 직접 실행해 뽑은 골든 값으로 비교한다(손으로 계산하지 않는다).

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-02b` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-26 · I-02b 완료
- **브랜치**: `native/I-02a` 위에 쌓았다(#76 → #77 → 이 PR 순서로 머지).
- **만든 API**
  - `matchName(_:_:)` — 초성 검색
  - `cleanAugmentDescription(_:)`, `cleanItemDescription(_:)`
  - `fillFirst(_:_:_:)` — JS `replace`처럼 첫 1회만 치환
  - `parseMarked(_:) -> [MarkedPart(text, mark?)]`, `stripMarks(_:)`
- **주의**: spec/data.md §4.1 요약보다 RN 원본 정규식이 정확하다. 원본 패턴을 문자 그대로 옮겼다.
  - `<br\s*/?>`는 대소문자를 무시한다.
  - 구두점 앞 `\s+`는 줄바꿈도 지운다.
  - 파이프 표기는 `\|[a-zA-Z]+`다.
- **마크 키**: JS `\w` 대신 `[A-Za-z0-9_]`를 쓴다. ICU `\w`는 유니코드 단어 문자까지 잡기 때문이다.
- **확인**
  - 골든 값: RN 함수를 tsx로 실행해 뽑았다. 아이템 3153 원문은 테스트에 고정해 패치에 흔들리지 않게 했다.
  - 헤드라이너 문구 전체의 마크 짝 검사도 넣었다.
  - `make -C native/ios test` 22개 통과, iOS 빌드 통과
