import { Image } from 'react-native';

import type { HeadlinerId, StickerId } from './types';

/**
 * 헤드라이너 로고 한 벌. 로고별 예외는 여기에만 둔다 — 그리는 쪽(헤더·등장 연출·판 위 로고)은 이 표만 읽는다.
 * - light: 라이트 모드 판 없는 자리(헤더)에 쓸 그림. 없으면 source 를 그대로 쓴다.
 * - small: 작은 자리(홈 시작 타일·빌드 카드 배지)에 쓸 그림. 없으면 source 를 그대로 쓴다.
 * - aspect: 판 없이 그릴 때 상자의 가로:세로. 기본 1 — 정사각 상자에 contain 한다.
 * - ink: 상자 대비 실제 그림(투명 여백·번진 빛 제외) 비율. 정사각 로고는 긴 변, 가로로 긴 K/DA 는 높이다. 기본 1.
 * - inkLeft: 그린 폭 대비 왼쪽 투명 여백. 없으면 정사각 로고는 (1 - ink) / 2(좌우가 같다), 가로로 긴 로고는 0.
 */
export interface HeadlinerLogoArt {
  source: number;
  light?: number;
  small?: number;
  aspect?: number;
  ink?: number;
  inkLeft?: number;
}

// 로고는 위키 원본, 초상은 CDragon kiwi_s3_band_heartsteel_augmentcard_character_* (게임 카드 장식).
// 등장 연출에서 바로 떠야 해서 앱에 넣어 둔다.
export const HEADLINER_LOGOS: Record<HeadlinerId, HeadlinerLogoArt> = {
  // 26.22 K/DA 는 크롬 + 빨강이다. 게임 로고(kiwi_s3_bandlogo_kda_v3)를 색 그대로 쓰고 ™ 만 지웠다(앱 크기에선 점 잡음).
  // 빨간 글로우를 둘러 어두운 배경에서 크롬의 검은 반사가 묻히지 않고 라이트에서도 윤곽이 선다.
  // 1000×267 이고 글로우 여백을 빼면 높이의 73%, 폭의 90%(좌우 5% 씩)가 그림이다.
  kda: { source: require('@/assets/headliners/kda-mark.png'), aspect: 1000 / 267, ink: 0.73, inkLeft: 0.05 },
  pentakill: { source: require('@/assets/headliners/pentakill.png') },
  heartsteel: { source: require('@/assets/headliners/heartsteel.png') },
  'true-damage': { source: require('@/assets/headliners/true-damage.png') },
  disco: { source: require('@/assets/headliners/disco.png') },
  'cafe-cuties': { source: require('@/assets/headliners/cafe-cuties.png') },
  bees: { source: require('@/assets/headliners/bees.png'), ink: 0.8 },
  'command-line': {
    source: require('@/assets/headliners/command-line.png'),
    // 원본 금색은 밝은 배경에서 빛 번짐이 묻혀 흐려지고, 단색으로 칠하면 금속 질감이 사라져 탁한 갈색이 된다.
    // 원본 위에 진한 금색(#6B4A0E) 그림자를 은은하게 깔아(캔버스 512 기준 아래 8px·번짐 10px·55%) 금색을 살린 채 윤곽만 세웠다.
    light: require('@/assets/headliners/command-line-light.png'),
    // 원본은 보이는 픽셀의 72% 가 반투명 빛 번짐이라 40pt 안팎에선 획이 뭉개진다. 알파 60 미만을 지우고
    // 60~200 을 0~255 로 펴서 번짐을 절반쯤 걷어낸 판이다(모양·색은 원본 그대로).
    small: require('@/assets/headliners/command-line-small.png'),
    // 번진 빛 때문에 82% 만 그림이다.
    ink: 0.82,
  },
  // 게임 원본 흰 로고(ux/kiwi/augments/augmentselection/kiwi_s3_bandlogo_worlds)를 투명 여백만 잘랐다.
  // 라이트 모드 판 없는 자리에서는 다른 흰 로고처럼 글자색으로 칠한다(HeadlinerLogo 의 WHITE_LOGOS).
  worlds: { source: require('@/assets/headliners/worlds.png') },
  // 26.23 — 게임 원본(maps/particles/kiwi/kiwi_s3_bandlogo_*)의 투명 여백만 잘랐다.
  // 아케이드 원본은 침략자 애니메이션 2프레임을 가로로 붙인 512×256 텍스처라 왼쪽 프레임(위키 배지와 같은 자세)만 잘랐다.
  // 흰 로고는 WHITE_LOGOS 에서 칠한다.
  arcade: { source: require('@/assets/headliners/arcade.png') },
  debonair: { source: require('@/assets/headliners/debonair.png') },
  'la-ilusion': { source: require('@/assets/headliners/la-ilusion.png') },
  // 게임에 마에스트로 로고 파일이 없다(악보·커튼 파티클뿐). 위키 원본 배지(Maestro_Jhin_Headliner_mayhem_logo)를
  // 원판째 쓴다 — 원판이 그림 전체라 라이트·다크 어디서나 보인다.
  maestro: { source: require('@/assets/headliners/maestro.png') },
};

/**
 * 판 없이 그리는 로고의 상자 높이 — 투명 여백을 뺀 실제 그림(ink)의 긴 변이 `inkSize`pt 가 되게 한다.
 * 가로로 긴 워드마크(K/DA)는 그림 높이를 절반만 준다. 같은 높이로 두면 폭이 네 배로 늘어 혼자 튄다.
 */
export function logoBoxHeight(id: HeadlinerId, inkSize: number): number {
  const { aspect = 1, ink = 1 } = HEADLINER_LOGOS[id];
  return Math.round((aspect > 1 ? inkSize / 2 : inkSize) / ink);
}

/**
 * 상자 왼쪽 끝에서 실제 그림 왼쪽 끝까지(pt). 그림을 다른 요소의 세로선에 맞출 때 그만큼 당긴다.
 * contain 으로 남는 좌우 여백(세로로 긴 원본은 정사각 상자에서 폭이 남는다) + 원본 안 투명 여백(inkLeft)이다.
 */
export function logoInkLeft(id: HeadlinerId, boxHeight: number): number {
  const { source, small, aspect = 1, ink = 1, inkLeft } = HEADLINER_LOGOS[id];
  const { width, height } = Image.resolveAssetSource(small ?? source);
  const boxW = boxHeight * aspect;
  const drawnW = Math.min(boxW, boxHeight * (width / height));
  return (boxW - drawnW) / 2 + drawnW * (inkLeft ?? (aspect > 1 ? 0 : (1 - ink) / 2));
}

/**
 * 열혈 팬 21레벨 카드 윗변에 걸치는 Worlds 로고. 게임 카드 장식(Kiwi_S3_Augment_Worlds)처럼 흰 로고에 파란 빛을 둘렀다.
 * 625×633 이고 빛 여백을 빼면 77% 가 그림이다(ink).
 */
export const WORLDS_CARD_MARK = {
  source: require('@/assets/headliners/worlds-card.png') as number,
  ink: 0.77,
  aspect: 625 / 633,
};

/** 커맨드 라인 리롤 버튼. 게임 로고(kiwi_s3_bandlogo_project_v2)를 금색으로 입혔고, flash 는 번쩍이는 순간의 레이어다. */
export const COMMAND_LINE_REROLL = {
  icon: require('@/assets/headliners/command-line-reroll.png') as number,
  /** 라이트 모드용 — HEADLINER_LOGOS['command-line'].light 와 같은 그림자(256 캔버스라 절반 크기). */
  lightIcon: require('@/assets/headliners/command-line-reroll-light.png') as number,
  flash: require('@/assets/headliners/command-line-reroll-flash.png') as number,
};

/**
 * 펜타킬 스킬 카드에만 있는 장식. 게임 원본(ux/kiwi/augments/augmentselection)이다.
 * 배경과 골드 프레임은 증강 카드와 같은 것을 쓴다(AUGMENT_CARD_ART).
 */
export const SKILL_CARD_ART = {
  swirl: require('@/assets/headliners/skill-card-swirl.png') as number,
  iconFrame: require('@/assets/headliners/skill-card-icon-frame.png') as number,
};

export const STICKER_PORTRAITS: Record<StickerId, number> = {
  aphelios: require('@/assets/headliners/sticker-aphelios.png'),
  ezreal: require('@/assets/headliners/sticker-ezreal.png'),
  kayn: require('@/assets/headliners/sticker-kayn.png'),
  ksante: require('@/assets/headliners/sticker-ksante.png'),
  sett: require('@/assets/headliners/sticker-sett.png'),
  yone: require('@/assets/headliners/sticker-yone.png'),
};
