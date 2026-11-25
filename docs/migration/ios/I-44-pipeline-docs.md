---
id: I-44
title: 데이터 파이프라인·문서 갱신
wave: W3
status: todo
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
- [ ] `npm run data:refresh` → JSON 갱신 → `make -C native/ios build`로 앱에 반영되는지 확인
- [ ] `augment-check` 스킬과 CLAUDE.md 명령·아키텍처 섹션을 네이티브 기준으로 갱신(RN 섹션은 R-01까지 유지)

## 완료 기준
- [ ] 체크리스트 전부 완료, 사용자 확인 결과 기록
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
