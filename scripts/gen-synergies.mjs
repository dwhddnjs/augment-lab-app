import fs from "node:fs";

const data = JSON.parse(
  fs.readFileSync("src/features/augments/data/augments.en.json", "utf8"),
);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const byNorm = {};
for (const a of data) byNorm[norm(a.name)] = a.id;
const id = (n) => {
  const x = byNorm[norm(n)];
  if (!x) throw new Error("no id for " + n);
  return x;
};

// Official ARAM: Mayhem "Augment Sets" (patch 26.x) — source: League of Legends Wiki
// (https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augment_Sets).
// `tiers` lists only the breakpoints that grant a *new* effect (unchanged tiers omitted).
// `icon` is a MaterialCommunityIcons glyph name.
const defs = [
  {
    id: "firecracker",
    ko: "폭죽 세트",
    en: "Firecracker Set",
    icon: "firework",
    maxStacks: 6,
    members: ["Typhoon", "Light em Up", "Twin Fire", "Critical Missile", "Magic Missile", "Fan The Hammer"],
    tiers: [
      { count: 2, ko: "미사일이 2회 튕기며 위력의 25%로 피해를 입힙니다.", en: "Missiles bounce 2 times for 25% effectiveness." },
      { count: 4, ko: "미사일이 3회 튕기며 위력의 50%로 피해를 입힙니다.", en: "Missiles bounce 3 times for 50% effectiveness." },
    ],
  },
  {
    id: "archmage",
    ko: "대마법사",
    en: "Archmage",
    icon: "auto-fix",
    maxStacks: 4,
    members: ["Juiced", "Mind to Matter", "Buff Buddies", "Ocean Soul", "Overflow"],
    tiers: [
      { count: 2, ko: "스킬 시전 시 다른 스킬의 쿨다운을 30% 환급합니다.", en: "Casting a spell refunds 30% of another spell's cooldown." },
    ],
  },
  {
    id: "dive-bomb",
    ko: "급강하 세트",
    en: "Dive Bomb Set",
    icon: "arrow-down-bold-circle",
    maxStacks: 4,
    members: ["Dive Bomber", "Self Destruct", "Final City Transit", "Clown College"],
    tiers: [
      { count: 2, ko: "사망 타이머가 25% 단축됩니다.", en: "25% shorter death timer." },
    ],
  },
  {
    id: "fully-automated",
    ko: "완전 자동화",
    en: "Fully Automated",
    icon: "cog",
    maxStacks: 9,
    members: ["FireFox", "Frost Wraith", "Self Destruct", "Ok Boomerang", "Sonata", "Divine Intervention", "Quantum Computing", "Prom Queen"],
    tiers: [
      { count: 2, ko: "자동 시전(Autocast) 스킬의 쿨다운이 30% 감소합니다.", en: "Autocast ability cooldowns are reduced by 30%." },
      { count: 3, ko: "자동 시전 스킬의 쿨다운이 스킬 가속에 비례하게 됩니다.", en: "Autocast cooldowns now scale with your ability haste." },
    ],
  },
  {
    id: "high-roller",
    ko: "도박꾼",
    en: "High Roller",
    icon: "dice-multiple",
    maxStacks: 7,
    members: ["Transmute Gold", "Transmute Prismatic", "Transmute Chaos", "Pandoras Box", "Stats", "Stats on Stats", "Stats on Stats on Stats"],
    tiers: [
      { count: 2, ko: "골드/프리즘 등급 능력치 모루 선택 확률이 20% 증가합니다.", en: "+20% chance to gain a Gold or Prismatic tier Stat Anvil selection." },
      { count: 3, ko: "골드/프리즘 등급 능력치 모루 선택 확률이 추가로 50% 증가합니다 (총 70%).", en: "+50% chance (70% total) to gain a Gold or Prismatic tier Stat Anvil selection." },
    ],
  },
  {
    id: "make-it-rain",
    ko: "골드는 비를 타고",
    en: "Make it Rain",
    icon: "weather-pouring",
    maxStacks: 8,
    members: ["Upgrade Immolate", "Upgrade Collector", "From Beginning To End", "Donation", "Red Envelopes", "Goldrend", "Heads Up Cupcake"],
    tiers: [
      { count: 2, ko: "처치 시 코인 6개를 떨어뜨립니다 (총 30골드).", en: "Takedowns drop 6 coins (30 gold total)." },
      { count: 3, ko: "처치 시 코인 12개를 떨어뜨립니다 (총 60골드).", en: "Takedowns drop 12 coins (60 gold total)." },
    ],
  },
  {
    id: "snowday",
    ko: "눈 오는 날",
    en: "Snowday",
    icon: "snowflake",
    maxStacks: 5,
    members: ["Snowball Upgrade", "Snowball Roulette", "Pinball", "Biggest Snowball Ever", "Holy Snowball"],
    tiers: [
      { count: 2, ko: "눈덩이 피해량 +30%, 스킬 가속 50을 얻습니다.", en: "+30% snowball damage, 50 ability haste." },
      { count: 3, ko: "눈덩이 피해량 +50%, 스킬 가속 100을 얻습니다.", en: "+50% snowball damage, 100 ability haste." },
      { count: 4, ko: "눈덩이 피해량 +100%, 스킬 가속 150을 얻습니다.", en: "+100% snowball damage, 150 ability haste." },
    ],
  },
  {
    id: "stackosaurus-rex",
    ko: "다단 중첩",
    en: "Stackosaurus Rex",
    icon: "layers-triple",
    maxStacks: 10,
    members: ["Quest Steel Your Heart", "Upgrade Hubris", "Soul Eater", "Phenomenal Evil", "Master of Duality", "Tap Dancer", "Infinite Recursion"],
    tiers: [
      { count: 2, ko: "스택 획득량이 50% 증가합니다.", en: "+50% stacks gained." },
      { count: 3, ko: "스택 획득량이 100% 증가합니다.", en: "+100% stacks gained." },
      { count: 4, ko: "스택 획득량이 200% 증가합니다.", en: "+200% stacks gained." },
    ],
  },
  {
    id: "wee-woo",
    ko: "삐뽀삐뽀",
    en: "Wee Woo Wee Woo",
    icon: "medical-bag",
    maxStacks: 8,
    members: ["First-Aid Kit", "All For You", "Critical Healing", "Sonata", "Windspeakers Blessing", "Im a Baby Kitty Where is Mama"],
    tiers: [
      { count: 2, ko: "650 범위 내 체력 50% 이하 아군에게 향할 때 이동 속도 50%를 얻습니다.", en: "Gain 50% move speed toward allies below 50% health within 650 units." },
      { count: 3, ko: "다음 회복/보호막이 대상의 잃은 체력 12%를 추가로 회복시킵니다 (재사용 10초).", en: "Your next heal or shield restores 12% of the target's missing health (10s cooldown)." },
    ],
  },
];

const out = defs.map((d) => ({
  id: d.id,
  name: { ko: d.ko, en: d.en },
  augmentIds: d.members.map(id),
  tiers: d.tiers.map((t) => ({
    count: t.count,
    description: { ko: t.ko, en: t.en },
  })),
  maxStacks: d.maxStacks,
  icon: d.icon,
}));

fs.writeFileSync(
  "src/features/augments/data/synergies.json",
  JSON.stringify(out, null, 2) + "\n",
);
console.log("Wrote", out.length, "sets");
