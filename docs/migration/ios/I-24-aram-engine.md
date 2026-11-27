---
id: I-24
title: 칼바람 엔진
wave: W2
status: done
depends: I-02a, I-12a
owns: native/ios/AugmentCore/Sources/AugmentCore/Aram/, native/ios/AugmentCore/Tests/AugmentCoreTests/Aram/
spec: aram.md §2
rn: src/features/aram/{rarity-odds,transmute}.ts, src/features/aram/hooks/use-aram.ts, scripts/{check-rarity-odds.mjs,check-transmute.ts}
---

# I-24 칼바람 엔진

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
드래프트 규칙 전체를 UI 없는 상태 머신으로 만든다. 화면(I-25b)은 이 상태만 그린다.

## 체크리스트
- [x] 확률표 2종, `rollRarity`, `drawOfRarity`, `cardPool`(판도라 첫 라운드 제외)
- [x] 리롤: 슬롯마다 라운드당 1회, 희귀도 유지, command-line 첫 리롤 승급, heartsteel 스티커 유지·빈칸 50%
- [x] `applyPick`: 전환 3종, 판도라, 연쇄 없음, transmuted 표시, 원본 불변
- [x] 상태 머신: 라운드 수, 펜타킬 스킬 선택 2회, 스티커 진행, `done` → 아이템 화면 파라미터
- [x] 난수 주입
- [x] 테스트: `check-rarity-odds.mjs` + `check-transmute.ts` 항목 전부 + 헤드라이너별 한 판 시뮬레이션(끝까지 진행되는지)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `make -C native/ios test` 통과
- [x] `bash docs/migration/status.sh diff I-24` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `Aram/Transmute.swift`(`AramRules`: 확률표 2종·`rollRarity`·`drawOfRarity`·`cardPool`·`applyPick`), `Aram/AramDraft.swift`(값 타입 상태 머신 `AramDraft` + `HeadlinerProgress`·`AramPickResult`). 난수는 `init(rng:)`로 주입.
- 테스트: `check-rarity-odds.mjs`·`check-transmute.ts` 전부 + 헤드라이너 13종 × 50판 끝까지 시뮬레이션(리롤 섞음) + 리롤 희귀도·스티커 유지 + 커맨드 라인 해킹. 규칙을 일부러 깨면(판도라 1라운드 제외 삭제) 실패하는 것 확인.
- 주의점
  - `AramDraft`는 struct다. 화면(I-25b)은 `@State var draft`로 들고 `draft.pick(i)` 결과의 `done`을 본다. RN처럼 펜타킬 마지막 `pickSkill`은 상태에 넣지 않으므로, 저장할 스킬은 **결과의 `progress`**에서 꺼낸다.
  - `HeadlinerProgress`는 타입 있는 id(HeadlinerId·StickerId)다. 저장할 때 I-04a의 `BuildHeadliner(id: p.id.rawValue, skills: p.skills, stickers: p.stickers.map(\.rawValue))`로 바꾼다(I-04a가 아직 dev에 없어 여기서 직접 참조하지 않음).
  - 빌드 저장용 `augmentIds = picked.map(\.id)`, `transmutedIds = picked.filter(\.transmuted).map(\.id)`.
  - 라운드 표시(worlds 5, kda 4/4에서 멈춤)는 화면 몫이다(I-25b).
- 사용자가 볼 것: 없음(단위 테스트로 검증).
