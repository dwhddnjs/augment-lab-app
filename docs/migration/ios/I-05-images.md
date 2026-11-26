---
id: I-05
title: 이미지 로딩·프리웜
wave: W0
status: todo
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
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-05` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 첫 설치 진행률은 I-06c에서 확인한다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
