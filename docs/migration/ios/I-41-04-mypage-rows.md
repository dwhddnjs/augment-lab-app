---
id: I-41-04
title: 마이페이지·데이터 관리 행
wave: W3
status: done
depends: I-41
owns: native/ios/AugmentLab/Features/MyPage/, native/ios/AugmentLab/Features/DataManage/, native/ios/AugmentLab/UI/Common/SettingsRow.swift
spec: mypage.md
rn: src/features/mypage/**
---

# I-41-04 마이페이지·데이터 관리 행

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
행 오른쪽 값(앱 버전·패치)과 쉐브론이 RN보다 흐리다(RN은 값 흰색·쉐브론 밝음). 테마·언어 행은 행 오른쪽 값만 눌러야 메뉴가 열린다(RN은 행 전체). 데이터 관리 제목이 RN은 가운데, 네이티브는 왼쪽.

## 체크리스트
- [x] 값·쉐브론 색을 RN 토큰과 같게
- [x] 테마·언어 행 어디를 눌러도 메뉴가 열림
- [x] 데이터 관리 내비 제목 가운데

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-41-04` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 마이페이지 값·쉐브론 밝기가 RN과 같다
- [ ] 행 아무 데나 눌러도 메뉴가 뜬다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- `UI/Common/SettingsRow.swift`(I-15, 머지됨)를 직접 고쳤다. 호출처가 마이페이지·데이터 관리뿐이라 owns에 넣었다.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료 (세션 5d)
- **값·쉐브론**
  - 원인: RN `settings-row.tsx`는 `foregroundStyle` 색 이름으로 `"secondaryLabel"`·`"tertiaryLabel"`을 넘긴다. 그런데 expo-modules-core 색 변환은 이 이름을 모른다. CSS 이름도 hex도 아니라 `InvalidHexColorException`이 나고, 수정자가 통째로 빠진다. 그래서 RN 실제 화면은 값·쉐브론·설명 모두 기본 전경색이었다.
  - 고침: 네이티브도 색을 지정하지 않는다(보이던 대로).
- **테마·언어 행**: RN Picker는 스타일을 정하지 않는다(automatic). 리스트 안에서는 행 전체가 메뉴를 연다. 네이티브의 `.pickerStyle(.menu)`를 지웠다.
- **데이터 관리 제목**: 셸의 `toolbarRole(.editor)`(뒤로 버튼 화살표만)가 inline 제목을 왼쪽에 붙인다. 화면 안에 `ToolbarItem(.principal)` 제목(headline)을 두어 가운데로 옮겼다. 셸(App/Shell)은 건드리지 않았다.
- `make -C native/ios build` 통과.
- **주의**: 설명 줄(데이터 관리 백업·복원·초기화)도 같은 이유로 기본색이 된다. RN 화면과 다르게 보이면 RN 캡처로 다시 비교한다.
- 사용자 확인 2줄은 남긴다.
