---
id: I-33
title: 데이터 관리
wave: W2
status: done
depends: I-04b, I-06a, I-15
owns: native/ios/AugmentLab/Features/DataManage/
spec: mypage.md §2, storage.md §3
rn: src/features/mypage/screens/data-manage-screen.tsx, src/lib/backup.ts
---

# I-33 데이터 관리

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
백업·복원·초기화 UI를 만든다.

## 체크리스트
- [x] 백업: 캐시 폴더에 쓰기 → 공유 시트
- [x] 복원: fileImporter(필터 없음) → parse → 개수 확인 → 적용 → 다시 불러오기, 오류 코드별 알림
- [x] 초기화(destructive 확인)
- [x] busy 가드(적용 끝까지)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-33` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] RN 1.6.2에서 만든 .alab 파일이 네이티브 앱에서 복원된다
- [ ] 네이티브에서 만든 .alab이 RN 앱에서도 복원된다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- Router(I-06a)가 `BackupStorage`를 함께 들고 환경으로 넘기면 화면이 저장소 위치를 몰라도 된다(지금은 기본 위치를 화면에서 다시 만든다).

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `DataManageScreen` — RN 문구 ko/en 그대로, insetGrouped 목록 + `SettingsRow` 3개.
  - 백업: `BackupStorage.exportText()` → `Caches/augment-lab-YYYY-MM-DD.alab`(덮어씀) → `UIActivityViewController`(닫힐 때까지 busy)
  - 복원: `.fileImporter([.item])`(형식 필터 없음) → `Backup.parse` → "빌드 N개로 교체" 확인 → `apply` → 완료/실패 알림. 실패 문구는 RN처럼 코드와 상관없이 하나.
  - 초기화: destructive 확인 → `reset()`(실패는 RN처럼 조용히)
  - busy: 선택기·공유 시트·복원 확인이 떠 있는 동안, 그리고 **적용이 끝날 때까지** 유지(RN 버그 수정, spec 허용)
- 주의점
  - `#94`(I-04b, I-04a 포함) + `#93`(I-06a) 위에 쌓았다. 그 둘이 먼저 머지돼야 한다.
  - `BackupStorage`는 화면에서 `FileKeyValueStore()`·`UserDefaultsStore()`를 새로 만든다 — 루트(`AugmentLabApp`)가 쓰는 기본 위치와 같다. 루트가 저장소 위치를 바꾸면 여기도 맞춰야 한다(승격 후보: Router가 `BackupStorage`를 들고 있게).
  - 알림 버튼 동작 안에서 다음 알림을 바로 넣으면 SwiftUI가 바인딩을 false로 돌리며 지운다 → `show()`가 한 박자 늦춰 띄운다.
- 사용자가 볼 것: 아래 **사용자 확인** 두 항목 + 백업 공유 시트에 "파일에 저장"이 뜨는지, 복원 확인창의 빌드 개수가 맞는지.
