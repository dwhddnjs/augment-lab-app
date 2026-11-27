---
id: I-41-01
title: 빌드 상세 가로 넘침·히어로 상태바
wave: W3
status: done
depends: I-41
owns: native/ios/AugmentLab/Features/BuildDetail/
spec: home-builds.md
rn: src/features/builds/screens/build-detail-screen.tsx
---

# I-41-01 빌드 상세 가로 넘침·히어로 상태바

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
빌드 상세 본문이 화면보다 넓게 잡혀 카드 오른쪽이 잘린다(4가지 설정 모두). 히어로 위 상태바 글자가 라이트에서 검다.

## 체크리스트
- [x] 본문 폭이 화면 폭을 넘지 않게(원인 후보: 히어로 이미지 `scaledToFill`이 부모 폭을 키움 — 날짜 '2026. 11. 27.'가 x≈1.13, 카드 글자 잘림)
- [x] 오른쪽 위 삭제 버튼이 RN처럼 원형(지금은 넓은 알약)
- [x] 히어로 위 상태바는 라이트 모드에서도 흰 글자(RN과 같게)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-41-01` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 빌드 상세 카드·날짜가 화면 안에 다 보인다(ko·en)
- [ ] 라이트 모드에서 히어로 위 시계·배터리가 흰색

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료 (fd)
- 원인: 배너 `WebImage(...).scaledToFill()`에 `.frame(maxWidth: .infinity)`만 있어 그림의 큰 폭이 ZStack(스크롤 포함)을 넓혔다. → `.frame(width: geo.size.width, height:)` + `.clipped()`. 삭제 버튼 알약도 같은 원인(넓어진 툴바)이라 함께 원형으로 돌아왔다.
- 상태바: `.toolbarColorScheme(fade < 0.5 ? .dark : palette.scheme, for: .navigationBar)` — `nil`로 두면 접힌 뒤에도 흰 글자가 남아 밝은 헤더에서 안 보였다.
- 시뮬레이터(라이트·en)에서 RN 캡처와 나란히 비교: 폭·날짜·삭제 버튼·상태바 같음. 스크롤로 접은 헤더는 검은 상태바.
