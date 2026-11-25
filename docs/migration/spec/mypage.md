# 마이페이지 · 데이터 관리 명세

RN 원본: `src/features/mypage/screens/{mypage-screen,data-manage-screen}.tsx`, `src/components/ui/settings-row.tsx`, `src/lib/{backup,backup-format}.ts`.
저장·백업 규칙은 `storage.md`. 시각 구성은 `design-system.md` §2.9 · §5.

## 1. 마이페이지
List(insetGrouped), 배경 `surface.base`, 행 배경 `surface.raised`, tint accent.

**일반**

| 행 | 동작 |
|---|---|
| 테마 Picker (시스템/라이트/다크) | 저장 + 창 스타일 강제 |
| 언어 Picker (한국어/English) | 저장 + 즉시 반영 |
| "데이터 관리" | `push(.data)` |

**정보**

| 행 | 값·동작 |
|---|---|
| 앱 버전 | `CFBundleShortVersionString` / `versionName` |
| 패치 | `version.json`의 `patch` |
| GitHub | 앱 안 브라우저로 `https://github.com/dwhddnjs/aram-augment-lab-app` (iOS `SFSafariViewController`, Android Custom Tabs) |
| 피드백 | `mailto:` 피드백 주소. **RN `mypage-screen.tsx` 202행의 값을 그대로 쓴다** — 문서에 개인 정보를 다시 적지 않는다 |

- 섹션 footer: Riot 고지문(RN 원문 그대로)
- SF Symbol 목록: design-system §5

## 2. 데이터 관리
- `busy` 가드: 파일 선택기나 공유 시트가 떠 있는 동안 다른 행을 막는다.
  - RN 버그: 복원 확인창이 뜨는 즉시 `busy`가 풀린다. 네이티브는 적용이 끝날 때까지 막는다(사소한 수정, 허용).

**백업**
- `augment-lab-YYYY-MM-DD.alab`을 캐시 폴더에 쓰고 공유 시트를 띄운다.
- SF `square.and.arrow.up`

**복원**
1. 파일 선택기(형식 필터 없음)
2. `parseBackup`. 실패 코드마다 알림을 띄운다.
3. "빌드 N개로 교체" 확인
4. 적용(교체) → 저장소 다시 불러오기
- SF `square.and.arrow.down`

**초기화**
- 확인 → `BACKUP_KEYS`를 지우고 다시 불러온다.
- SF `trash`, destructive 스타일
