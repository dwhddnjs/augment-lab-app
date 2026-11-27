---
id: I-41-03
title: 챔피언 선택 검색창 위치·전체 필터 이름
wave: W3
status: done
depends: I-41
owns: native/ios/AugmentLab/Features/Launch/
spec: launch.md
rn: src/features/champions/... (select-champion-modal)
---

# I-41-03 챔피언 선택 검색창 위치·전체 필터 이름

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
RN은 검색창이 아래에 떠 있는 글라스 막대인데 네이티브는 제목 아래 위쪽에 있다(그리드가 ≈45pt 내려감). '전체' 필터 버튼의 VoiceOver 이름이 SF 심볼 이름('격자 2x2', 언어 무관)으로 읽힌다.

## 체크리스트
- [x] 검색창을 RN처럼 아래 떠 있는 막대로(키보드와 함께 올라감)
- [x] '전체' 필터 버튼에 로케일 이름(전체/All)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-41-03` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 챔피언 선택 시트 아래에 검색창이 떠 있다
- [ ] VoiceOver가 '전체'로 읽는다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료 (세션 5d)
- 검색창: iOS 26+는 `.searchable(placement: .toolbar)`다. iPhone에서는 아래에 떠 있는 글라스 막대가 되고, 키보드와 함께 올라온다(RN react-native-screens와 같다). 26 미만은 RN도 제목 밑 서랍이라 그대로 두었다.
- 필터 칩: VoiceOver 이름을 붙였다. '전체'는 전체/All, 역할 칩은 `championTagLabel`(전사/Fighter 등)로 읽힌다. 고른 칩에는 `.isSelected`를 준다. RN은 역할 칩에 이름이 없었으니 개선이다.
- `make -C native/ios build`가 통과했다. 바꾼 파일은 `Features/Launch/ChampionSelectScreen.swift` 하나다.
- 시뮬레이터 모습(아래 막대 위치, 스크롤할 때 빈 검색이 닫히는지)은 사용자 확인 2줄로 남긴다.
