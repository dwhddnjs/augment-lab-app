---
id: I-32
title: 마이페이지
wave: W2
status: done
depends: I-03, I-06a, I-15
owns: native/ios/AugmentLab/Features/MyPage/
spec: mypage.md §1
rn: src/features/mypage/screens/mypage-screen.tsx
---

# I-32 마이페이지

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
설정 화면을 만든다.

## 체크리스트
- [x] List insetGrouped 스타일
- [x] 테마·언어 Picker
- [x] 데이터 관리 행
- [x] 정보: 버전·패치·GitHub(SFSafariViewController)·메일(RN 원본 주소)·Riot 고지

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-32` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 테마를 바꾸면 즉시 전체 반영
- [ ] 언어를 바꾸면 재시작 없이 전체 반영

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `MyPageScreen` — List insetGrouped(배경 surface.base, 행 surface.raised). 일반: 테마·언어 Picker(menu, tint accent, 라벨 아이콘 text.primary 고정) → `settings.setTheme/setLocale`(창 스타일·로케일은 I-03/I-06a가 즉시 반영), 데이터 관리 → `router.push(.data)`. 정보: 앱 버전(`CFBundleShortVersionString`), 패치(`gameData.data.version.patch`), GitHub(SFSafariViewController 모달), 피드백(`mailto:` RN 주소 그대로), footer Riot 고지(RN 원문). 문구 ko/en은 RN 그대로.
- 주의점
  - RN의 "모드가 바뀌면 Host remount" 우회는 옮기지 않았다(spec: 네이티브에서 재현되면 그때). 테마를 바꿨는데 Picker tint가 옛 모드 색으로 남으면 `.id(settings.theme)`를 List에 달면 된다.
  - `#93`(I-06a, #88 포함) 위에 쌓았다.
- 사용자가 볼 것: 아래 **사용자 확인** 두 항목 + GitHub가 앱 안 브라우저로 열리는지, 피드백이 메일 앱을 여는지.
