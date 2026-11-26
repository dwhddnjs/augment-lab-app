---
id: I-11
title: 증강 카드 프레임·타일
wave: W1
status: todo
depends: I-01, I-02b, I-05
owns: native/ios/AugmentLab/UI/Cards/
spec: design-system.md §2.6~§2.8
rn: src/components/ui/{rarity-card-frame,augment-tile,augment-image}.tsx
---

# I-11 증강 카드 프레임·타일

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
앱의 얼굴인 증강 카드를 픽셀 단위로 옮긴다.

## 체크리스트
- [x] `RarityCardFrame`: 14:9, 모서리, 아트 2겹, 배치 비율, 글자 크기(일반·compact), 설명 줄 수 계산, 골드 수치 강조, 그림자·글로우(라이트·다크), 카드 텍스트 Dynamic Type 끔
- [x] 카드 폭 계산 헬퍼(§2.6)
- [x] `AugmentTile`
- [ ] Preview: 희귀도 3종 × 라이트·다크 × 일반·compact

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-11` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 카드 3장을 RN 스크린샷과 겹쳐 보면 1px 안쪽으로 맞는다(테두리·그림자는 네 변 가장자리를 확인)
- [ ] 라이트 모드 그림자, 다크 모드 글로우

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
