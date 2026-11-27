---
id: I-44
title: 데이터 파이프라인·문서 갱신
wave: W3
status: done
depends: I-43
owns: (직렬 — 이 작업 중에는 다른 iOS 작업을 돌리지 않는다)
spec: -
rn: package.json scripts, .agents/skills/augment-check/SKILL.md, CLAUDE.md
---

# I-44 데이터 파이프라인·문서 갱신

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
패치 대응 흐름이 네이티브에서도 그대로 도는지 확인하고 문서를 바꾼다.

## 체크리스트
- [x] `npm run data:refresh` → JSON 갱신 → `make -C native/ios build`로 앱에 반영되는지 확인
- [x] `augment-check` 스킬과 CLAUDE.md 명령·아키텍처 섹션을 네이티브 기준으로 갱신(RN 섹션은 R-01까지 유지)

## 완료 기준
- [ ] 체크리스트 전부 완료, 사용자 확인 결과 기록
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 22 세션
**한 일**
- 파이프라인 리허설(워크트리에서 실제 실행 → 확인 후 되돌림, 데이터는 커밋 안 함):
  1. 기준 빌드 → 번들 `Data/` JSON 15개 = `src/` 원본과 바이트 동일.
  2. `npm run data:refresh` 성공 — DDragon 16.16.1 → 16.23.1, 챔피언 173·아이템 254, `docs/index.html` 재생성.
  3. `make -C native/ios build` 다시(증분) → 번들 JSON 15개 모두 갱신본과 동일, `version.json` ddragonVersion 16.23.1. 빌드 단계가 xcfilelist 입력이라 JSON만 바뀌어도 다시 복사됨.
  4. `make -C native/ios test` → 95개 중 3건 실패: `aram-item-ids.json`의 `3097`이 16.23.1 아이템 목록에 없어 진열 풀 111 → 110(`GameDataTests.itemPoolKeepsItemOrder`, `CustomDraftTests.itemListMatchesRN` 개수). 파이프라인 문제 아님.
     - **정정(같은 날):** 처음엔 "폭풍갈퀴가 빠졌다"고 적었으나 틀렸다. DDragon 원본 대조 결과 폭풍갈퀴는 그대로 있고 **id만 `3097` → `3095`로 바뀌었다**(이름·가격 3200·스탯 동일, 16.16.1의 `3095`는 맵 비활성 "과거 아이템"). 16.16.1 → 16.23.1에서 구매 가능 아이템 중 바뀐 건 이 한 건뿐(사라진 id 1 = 새 id 1, 이름 같음).
- 문서: CLAUDE.md에 네이티브 명령(`make build/test/clean`)·네이티브 아키텍처 섹션 추가(RN 섹션은 그대로). `augment-check` 스킬에 "네이티브도 같은 JSON" 절(빌드·테스트, xcfilelist, 테스트 스냅샷 갱신 규칙, 네이티브 카드 위치)과 로컬 아이콘 네이티브 등록(imageset + `CDN.localAugmentNames`) 추가.

**다음 단계 / 주의점**
- 의존 I-43(fd, 서명 팀 대기)보다 먼저 끝냈다 — 문서·확인만이라 I-43과 겹치는 파일 없음(I-43은 pbxproj·PrivacyInfo·RELEASE.md).
- 실제 데이터 갱신(16.23.1 반영)은 이 작업 범위 밖이다. 하려면 ① `aram-item-ids.json`의 `3097` → `3095` ② 저장된 빌드의 옛 id `3097`을 `3095`로 읽게 하기(RN·네이티브 둘 다 — 지금은 id 별칭 처리가 없어 옛 빌드에서 폭풍갈퀴가 사라진다) ③ 그 뒤 테스트 스냅샷이 그대로 통과하는지 확인(개수 111 유지 예상, 해시는 id가 바뀌어 달라질 수 있음). `fetch-ddragon.ts`가 `version.json` 끝 줄바꿈을 지우는 건 기존 동작.
