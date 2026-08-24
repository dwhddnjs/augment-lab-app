/**
 * 아이템 선택 화면의 카테고리 필터 정의.
 * - ITEM_CATEGORIES: 태그 추론을 덮어쓰는 아이템별 명시 분류
 * - itemInCategory: 한 아이템이 특정 카테고리 탭에 노출될지 판단
 * - FILTERS: 사이드 탭 목록(아이콘 + predicate)
 */
import type { Item } from "./types";

// ─── 아이템 카테고리 명시 지정 ───────────────────────────────────────────────
// 태그 기반 predicate보다 우선 적용. 여러 카테고리 가능.
export const ITEM_CATEGORIES: Record<string, string[]> = {
  "2065": ["support"], // 슈렐리아의 군가
  "2517": ["fighter"], // 끝없는 갈망
  "2524": ["support"], // 밴들파이프
  "3050": ["support"], // 지크의 융합(명령)
  "3068": ["tank"], // 태양불꽃 방패
  "3072": ["marksman"], // 피바라기
  "3087": ["marksman"], // 스태틱의 단검
  "3091": ["fighter"], // 마법사의 최후
  "3107": ["support"], // 구원
  "3109": ["support"], // 기사의 맹세
  "3110": ["tank"], // 얼어붙은 심장
  "3139": ["marksman"], // 헤르메스의 시미터
  "3146": ["mage"], // 마법공학 총검
  "3156": ["fighter"], // 맬모셔스의 아귀
  "3190": ["support"], // 강철의 솔라리 펜던트
  "3222": ["support"], // 미카엘의 축복
  "3302": ["marksman"], // 경계
  "3504": ["support"], // 불타는 향로
  "3814": ["assassin"], // 밤의 끝자락
  "4005": ["support"], // 제국의 명령
  "4633": ["mage"], // 균열 생성기
  "4646": ["mage"], // 폭풍 쇄도
  "6616": ["support"], // 흐르는 물의 지팡이
  "6617": ["support"], // 월석 재생기
  "6620": ["support"], // 헬리아의 메아리
  "6621": ["support"], // 새벽심장
  "6664": ["tank"], // 공허한 광휘
  "6672": ["marksman"], // 크라켄 학살자
  "6692": ["fighter"], // 월식
  "6697": ["assassin"], // 오만 (Hubris)
  "3119": ["tank"], // 혹한의 손길
  "3124": ["marksman"], // 구인수의 격노검

  // ── 클래식 레트로 아이템(77xxxx) ──────────────────────────────────────────
  // 구버전 태그는 현대 태그 규칙과 어긋나 태그 추론만으로는 어느 탭에도 안 걸리거나,
  // 두세 탭에 동시에 걸린다(예: Aura 가 붙었다는 이유로 전부 서포터로 샜다).
  // 그래서 진열되는 레트로 아이템은 태그에 맡기지 않고 전부 손으로 지정한다.
  "772045": ["support"], // 루비 시야석
  "773001": ["mage"], // 심연의 홀
  "773005": ["fighter"], // 아트마의 창
  "773025": ["tank"], // 얼어붙은 건틀릿
  "773026": ["fighter"], // 수호 천사
  "773035": ["marksman"], // 최후의 속삭임
  "773040": ["mage"], // 대천사의 포옹
  "773042": ["fighter"], // 무라마나
  "773050": ["fighter"], // 지크의 전령 / Zeke's Herald
  "773060": ["support"], // 지휘관의 깃발
  "773069": ["support"], // 슈렐리아의 몽상
  "773072": ["marksman"], // 피바라기
  "773077": ["fighter"], // 티아맷
  "773078": ["fighter"], // 삼위일체
  "773085": ["marksman"], // 루난의 허리케인
  "773091": ["fighter"], // 마법사의 최후
  "773098": ["support"], // 행운 피크 (현재 진열 풀 밖)
  "773107": ["support"], // 룬 방벽
  "773110": ["tank"], // 얼어붙은 심장
  "773124": ["marksman"], // 구인수의 격노검
  "773138": ["tank"], // 레비아탄 갑옷
  "773139": ["marksman"], // 헤르메스의 시미터
  "773141": ["fighter"], // 비술의 검
  "773146": ["mage"], // 마법공학 총검
  "773154": ["assassin"], // 리글의 랜턴
  "773156": ["fighter"], // 맬모셔스의 아귀
  "773160": ["assassin"], // 야생의 섬광
  "773172": ["marksman"], // 서풍
  "773173": ["support"], // 일라이자의 기적
  "773178": ["fighter"], // 이온 충격기
  "773190": ["support"], // 강철의 솔라리 펜던트
  "773206": ["assassin"], // 망령의 영혼
  "773207": ["assassin"], // 고대 골렘의 영혼
  "773209": ["assassin"], // 도마뱀 장로의 영혼
  "773222": ["support"], // 미카엘의 도가니
  "773504": ["support"], // 불타는 향로
};

/**
 * 아이템이 주어진 카테고리에 속하는지 판단.
 * - ITEM_CATEGORIES에 등록된 아이템은 그 목록만 사용
 * - 신발은 boots/all 탭에서만 노출
 * - 나머지는 tagFallback 사용
 */
export function itemInCategory(
  item: Item,
  key: string,
  tagFallback: () => boolean,
): boolean {
  // 신발: boots탭과 all탭에서만 노출
  if (key !== "boots" && key !== "all" && item.tags.includes("Boots"))
    return false;
  // 명시 지정 우선
  const cats = ITEM_CATEGORIES[item.id];
  if (cats !== undefined) return cats.includes(key);
  // boots탭이면 Boots 태그로만 판단
  if (key === "boots") return item.tags.includes("Boots");
  return tagFallback();
}

// ─── 필터 정의 ───────────────────────────────────────────────────────────────
export type FilterDef = {
  key: string;
  ko: string;
  en: string;
  predicate: (item: Item) => boolean;
} & (
  | { iconType: "mci"; icon: string }
  | { iconType: "cdragon"; classTag: string }
);

export const FILTERS: FilterDef[] = [
  {
    key: "all",
    ko: "전체",
    en: "All",
    predicate: () => true,
    iconType: "mci",
    icon: "apps",
  },
  {
    key: "fighter",
    ko: "전사",
    en: "Fighter",
    predicate: (i) =>
      itemInCategory(
        i,
        "fighter",
        () =>
          i.tags.includes("Damage") &&
          (i.tags.includes("Health") ||
            i.tags.includes("LifeSteal") ||
            i.tags.includes("Mana") ||
            i.tags.includes("Armor")) &&
          !i.tags.includes("CriticalStrike") &&
          !i.tags.includes("SpellDamage") &&
          !i.tags.includes("Aura") &&
          !i.tags.includes("Boots"),
      ),
    iconType: "cdragon",
    classTag: "Fighter",
  },
  {
    key: "marksman",
    ko: "원거리딜러",
    en: "Marksman",
    predicate: (i) =>
      itemInCategory(
        i,
        "marksman",
        () => i.tags.includes("CriticalStrike") && !i.tags.includes("Boots"),
      ),
    iconType: "cdragon",
    classTag: "Marksman",
  },
  {
    key: "assassin",
    ko: "암살자",
    en: "Assassin",
    predicate: (i) =>
      itemInCategory(
        i,
        "assassin",
        () =>
          i.tags.includes("ArmorPenetration") &&
          !i.tags.includes("CriticalStrike") &&
          !i.tags.includes("Health") &&
          !i.tags.includes("SpellDamage") &&
          !i.tags.includes("Boots"),
      ),
    iconType: "cdragon",
    classTag: "Assassin",
  },
  {
    key: "mage",
    ko: "마법사",
    en: "Mage",
    predicate: (i) =>
      itemInCategory(
        i,
        "mage",
        () =>
          (i.tags.includes("SpellDamage") ||
            i.tags.includes("MagicPenetration")) &&
          !i.tags.includes("Boots"),
      ),
    iconType: "cdragon",
    classTag: "Mage",
  },
  {
    key: "tank",
    ko: "탱커",
    en: "Tank",
    predicate: (i) =>
      itemInCategory(
        i,
        "tank",
        () =>
          !i.tags.includes("Damage") &&
          !i.tags.includes("CriticalStrike") &&
          !i.tags.includes("SpellDamage") &&
          !i.tags.includes("ArmorPenetration") &&
          !i.tags.includes("Boots") &&
          (i.tags.includes("Armor") ||
            i.tags.includes("SpellBlock") ||
            i.tags.includes("Tenacity") ||
            i.tags.includes("HealthRegen")),
      ),
    iconType: "cdragon",
    classTag: "Tank",
  },
  {
    key: "support",
    ko: "서포터",
    en: "Support",
    predicate: (i) =>
      itemInCategory(
        i,
        "support",
        () =>
          !i.tags.includes("Boots") &&
          (i.tags.includes("Aura") ||
            i.tags.includes("SpellVamp") ||
            i.tags.includes("GoldPer") ||
            (i.tags.includes("ManaRegen") &&
              !i.tags.includes("Damage") &&
              !i.tags.includes("SpellDamage"))),
      ),
    iconType: "cdragon",
    classTag: "Support",
  },
  {
    key: "boots",
    ko: "신발",
    en: "Boots",
    predicate: (i) =>
      itemInCategory(i, "boots", () => i.tags.includes("Boots")),
    iconType: "mci",
    icon: "shoe-sneaker",
  },
];

export type FilterKey = (typeof FILTERS)[number]["key"] | null;
