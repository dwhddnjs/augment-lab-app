/**
 * 정규화된 아이템 스탯. scripts/parse-item-stats.mjs가 description의 <stats>
 * 블록을 파싱해 생성한다. Flat 키는 절대값, Percent/비율 키는 0.4=40% 형태.
 */
export interface ItemStats {
  // 절대값(flat)
  hp?: number;
  mp?: number;
  attackdamage?: number;
  abilitypower?: number;
  armor?: number;
  spellblock?: number;
  abilityhaste?: number;
  lethality?: number; // 물리 관통력(고정)
  magicpenFlat?: number; // 마법 관통력(고정)
  movespeedFlat?: number;
  adaptive?: number; // 적응형 능력치
  // 클래식 레트로 전용 — 5초당 재생을 절대값으로 준다. 현대 아이템의 hpregen/mpregen은
  // 챔피언 기본 재생에 곱하는 비율이라 단위가 달라 합칠 수 없다.
  hpregenFlat?: number;
  mpregenFlat?: number;
  // 비율(0.4 = 40%)
  attackspeed?: number;
  movespeedPercent?: number;
  hpregen?: number;
  mpregen?: number;
  crit?: number;
  critdamage?: number;
  armorpen?: number; // 방어구 관통력(%)
  magicpenPercent?: number;
  lifesteal?: number;
  omnivamp?: number; // 모든 피해 흡혈
  tenacity?: number; // 강인함
  healshield?: number; // 체력 회복 및 보호막 효과
  cdr?: number; // 클래식 레트로 전용 — 구버전 재사용 대기시간 감소(스킬 가속과 별개)
}

/**
 * 한 빌드에 담을 수 있는 아이템 수. 아이템 선택 화면의 "n / 6" 표기와 커스텀 화면의
 * 정원 판정이 함께 읽는다 — 화면 훅이 아니라 도메인 타입 옆에 둬서, 상수 하나 때문에
 * expo-router·expo-image 를 끌고 오는 화면 모듈을 로드하지 않게 한다.
 */
export const MAX_ITEMS = 6;

export interface Item {
  id: string;
  name: string;
  description: string;
  plaintext: string;
  gold: {
    base: number;
    total: number;
    sell: number;
    purchasable: boolean;
  };
  tags: string[];
  stats: ItemStats;
  imageKey: string; // ddragon image file key (e.g. "1001.png")
}
