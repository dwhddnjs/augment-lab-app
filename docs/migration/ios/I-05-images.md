---
id: I-05
title: 이미지 로딩·프리웜
wave: W0
status: done
depends: I-01, I-02a, I-03
owns: native/ios/AugmentLab/Infra/Images/
spec: app-shell.md §6, design-system.md §2.8, storage.md §4(이미지 캐시)
rn: src/lib/image-prewarm.ts, src/hooks/use-image-prewarm.ts, src/components/ui/remote-image.tsx, src/components/ui/augment-image.tsx
---

# I-05 이미지 로딩·프리웜

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
모든 이미지 표시와 첫 실행 프리웜을 담당한다.

## 체크리스트
- [x] SDWebImage 설정: 기본 캐시 사용(기존 캐시와 이어지게), 디스크 만료 무제한
- [x] `RemoteImage`: 로딩 배경 raised, 200ms 페이드, cover
- [x] `AugmentImage`: 로컬 아이콘 → large → base → small → 희귀도 글리프(0.62)
- [x] `prefetch(chain)`: URL마다 15초 타임아웃과 경쟁, 성공하면 멈춤
- [x] `@Observable PrewarmService`
    - 체인 순서·중복 제거(Map 의미) → 현재 473개
    - 동시 작업자 12, 진행률(실패도 셈)
    - 플래그 `prewarm:done:<ver>`
    - 보충: 첫 URL 캐시 확인, `scenePhase == .active`마다 실행
- [x] 단위 테스트가 어려운 부분은 체인 목록 생성 함수만 따로 빼서 검증한다(473개, 순서)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-05` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 첫 설치 진행률은 I-06c에서 확인한다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- `prewarmChains(_:)`(`Infra/Images/PrewarmChains.swift`)는 AugmentCore만 쓰는 순수 함수다 → `AugmentCore/…/Images/`로 옮기고 RN 골든(473개·순서) 테스트를 상주시키기. 지금은 앱 타깃에 있어 `make test`가 돌리지 않는다(검증 방법은 진행 기록).

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `Infra/Images/` 5개 — `ImagePipeline`(SDWebImage 기본 캐시, `maxDiskAge = -1`), `RemoteImage`, `AugmentImage`, `ImagePrefetch`(체인 prefetch, URL별 15초, 디스크 캐시 확인), `PrewarmService`(+ `.imagePrewarm(_:)` 모디파이어), `prewarmChains`.
- 검증: `make build` 통과. `prewarmChains(GameData ko)`를 RN `use-image-prewarm`의 `allUrls`(npx tsx로 뽑음)와 비교 → **473개, 순서·체인 URL 전부 일치**(증강 다단 184 + 단일 289). 임시 SwiftPM 실행 패키지(AugmentCore를 path 의존, PrewarmChains.swift 심볼릭 링크)로 돌렸고 커밋하지 않았다.
- 공용 API (다른 작업이 쓰는 것)
  - `RemoteImage(_ url: URL?, size: CGFloat? = nil, contentMode: ContentMode = .fill, accessibilityLabel: String? = nil)` — 모서리는 호출측 `.clipShape`
  - `AugmentImage(iconPath:size:tint:fallbackGlyph: Icon, fallbackRatio: 0.62)` — 글리프는 보통 `.mci(RarityColors.glyph[rarity]!)`
  - `ImagePrefetch.prefetch(_ chain: [URL]) async` — 화면별 prefetch(챔피언·아이템 선택, 드래프트 카드·펜타킬 스펠)
  - `PrewarmService(data:store:)` — `progress`, `isFirstRun`, `showSetup`, `start()`, `topUp()`. 앱 루트에 `.imagePrewarm(service)` 한 줄(I-06c)
- 주의점
  - 증강 필터는 RN 그대로 `modes`가 비지 않은 것. spec 문구(“aram 풀”)와 지금 데이터에선 같다(233개 모두 aram).
  - 완료 플래그는 UserDefaults라 동기로 읽는다 → RN의 "확인 중(null)" 상태가 없다. 첫 프레임부터 설치 화면 여부가 정해진다.
  - 시간 초과돼도 다운로드는 취소하지 않는다(RN과 같다).
  - `ImagePipeline.configure()`는 `PrewarmService` init이 부른다 → 부팅 때 서비스를 만들면 된다.
- 사용자가 볼 것: 화면 연결은 I-06c 이후. 첫 설치 진행률·아이콘 깜빡임 없음은 그때 시뮬레이터에서.

