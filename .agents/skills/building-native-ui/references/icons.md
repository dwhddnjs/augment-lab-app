# 아이콘 (SF Symbols)

네이티브 느낌을 위해 SF Symbols를 사용하세요. FontAwesome이나 Ionicons는 절대 사용하지 마세요.

## 기본 사용법

```tsx
import { SymbolView } from "expo-symbols";
import { PlatformColor } from "react-native";

<SymbolView
  tintColor={PlatformColor("label")}
  resizeMode="scaleAspectFit"
  name="square.and.arrow.down"
  style={{ width: 16, height: 16 }}
/>;
```

## Props

```tsx
<SymbolView
  name="star.fill"                    // SF Symbol 이름 (필수)
  tintColor={PlatformColor("label")}  // 아이콘 색상
  size={24}                           // width/height 축약형
  resizeMode="scaleAspectFit"         // 크기 조정 방식
  weight="regular"                    // thin | ultraLight | light | regular | medium | semibold | bold | heavy | black
  scale="medium"                      // small | medium | large
  style={{ width: 16, height: 16 }}   // 표준 스타일 props
/>
```

## 자주 쓰는 아이콘

### 네비게이션 & 액션
- `house.fill` - 홈
- `gear` - 설정
- `magnifyingglass` - 검색
- `plus` - 추가
- `xmark` - 닫기
- `chevron.left` - 뒤로
- `chevron.right` - 앞으로
- `arrow.left` - 뒤로 화살표
- `arrow.right` - 앞으로 화살표

### 미디어
- `play.fill` - 재생
- `pause.fill` - 일시정지
- `stop.fill` - 정지
- `backward.fill` - 되감기
- `forward.fill` - 빨리감기
- `speaker.wave.2.fill` - 볼륨
- `speaker.slash.fill` - 음소거

### 카메라
- `camera` - 카메라
- `camera.fill` - 카메라 채움
- `arrow.triangle.2.circlepath` - 카메라 전환
- `photo` - 갤러리/사진
- `bolt` - 플래시
- `bolt.slash` - 플래시 끄기

### 커뮤니케이션
- `message` - 메시지
- `message.fill` - 메시지 채움
- `envelope` - 이메일
- `envelope.fill` - 이메일 채움
- `phone` - 전화
- `phone.fill` - 전화 채움
- `video` - 영상통화
- `video.fill` - 영상통화 채움

### 소셜
- `heart` - 좋아요
- `heart.fill` - 좋아요 활성
- `star` - 즐겨찾기
- `star.fill` - 즐겨찾기 활성
- `hand.thumbsup` - 엄지 위
- `hand.thumbsdown` - 엄지 아래
- `person` - 프로필
- `person.fill` - 프로필 채움
- `person.2` - 사람들
- `person.2.fill` - 사람들 채움

### 콘텐츠 액션
- `square.and.arrow.up` - 공유
- `square.and.arrow.down` - 다운로드
- `doc.on.doc` - 복사
- `trash` - 삭제
- `pencil` - 편집
- `folder` - 폴더
- `folder.fill` - 폴더 채움
- `bookmark` - 북마크
- `bookmark.fill` - 북마크 활성

### 상태 & 피드백
- `checkmark` - 성공/완료
- `checkmark.circle.fill` - 완료됨
- `xmark.circle.fill` - 오류/실패
- `exclamationmark.triangle` - 경고
- `info.circle` - 정보
- `questionmark.circle` - 도움말
- `bell` - 알림
- `bell.fill` - 알림 활성

### 기타
- `ellipsis` - 더보기
- `ellipsis.circle` - 원 안의 더보기
- `line.3.horizontal` - 메뉴/햄버거
- `slider.horizontal.3` - 필터
- `arrow.clockwise` - 새로고침
- `location` - 위치
- `location.fill` - 위치 채움
- `map` - 지도
- `mappin` - 핀
- `clock` - 시간
- `calendar` - 캘린더
- `link` - 링크
- `nosign` - 차단/금지

## 애니메이션 심볼

```tsx
<SymbolView
  name="checkmark.circle"
  animationSpec={{
    effect: {
      type: "bounce",
      direction: "up",
    },
  }}
/>
```

### 애니메이션 효과

- `bounce` - 통통 튀는 애니메이션
- `pulse` - 맥박 효과
- `variableColor` - 색상 순환
- `scale` - 크기 애니메이션

```tsx
// 방향 있는 바운스
animationSpec={{
  effect: { type: "bounce", direction: "up" }  // up | down
}}

// 펄스
animationSpec={{
  effect: { type: "pulse" }
}}

// 가변 색상 (다색 심볼)
animationSpec={{
  effect: {
    type: "variableColor",
    cumulative: true,
    reversing: true
  }
}}
```

## 심볼 굵기

```tsx
// 얇은 굵기
<SymbolView name="star" weight="ultraLight" />
<SymbolView name="star" weight="thin" />
<SymbolView name="star" weight="light" />

// 기본
<SymbolView name="star" weight="regular" />

// 굵은 굵기
<SymbolView name="star" weight="medium" />
<SymbolView name="star" weight="semibold" />
<SymbolView name="star" weight="bold" />
<SymbolView name="star" weight="heavy" />
<SymbolView name="star" weight="black" />
```

## 심볼 크기

```tsx
<SymbolView name="star" scale="small" />
<SymbolView name="star" scale="medium" />  // 기본값
<SymbolView name="star" scale="large" />
```

## 다색 심볼

일부 심볼은 여러 색상을 지원합니다:

```tsx
<SymbolView
  name="cloud.sun.rain.fill"
  type="multicolor"
/>
```

## 심볼 이름 찾기

1. macOS에서 SF Symbols 앱 사용 (Apple에서 무료 제공)
2. https://developer.apple.com/sf-symbols/ 에서 검색
3. 심볼 이름은 점 표기법 사용: `square.and.arrow.up`

## 모범 사례

- 벡터 아이콘 라이브러리보다 항상 SF Symbols를 사용하세요.
- 심볼 굵기를 주변 텍스트 굵기와 맞추세요.
- 선택/활성 상태에는 `.fill` 변형을 사용하세요.
- 다크모드 지원을 위해 tint에 PlatformColor를 사용하세요.
- 아이콘은 일관된 크기로 유지하세요 (16, 20, 24, 32).
