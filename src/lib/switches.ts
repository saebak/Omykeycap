/* ------------------------------------------------------------------ *
 * 스위치(축) 정의 — 축마다 소리 캐릭터와 눌림 애니메이션 속도가 달라요.
 * ------------------------------------------------------------------ */
export type SwitchKey = "blue" | "red" | "brown" | "black" | "silent" | "topre";

export interface SoundBody {
  freq: number;
  decay: number;
  gain: number;
  lp: number;
}
export interface SoundClick {
  dur: number;
  hp: number;
  gain: number;
}

export interface SwitchSpec {
  label: string;
  desc: string;
  color: string;
  pressMs: number; // 키캡이 눌리는 애니메이션 속도(ms)
  body: SoundBody; // 타건음의 몸통(저역) 성분
  click?: SoundClick; // 딸깍 성분 (리니어 축은 없음)
  unlockAt: number; // 누적 타건 수가 이 값 이상이면 해금돼요 (0이면 기본 제공)
}

export const SWITCHES: Record<SwitchKey, SwitchSpec> = {
  blue: {
    label: "청축",
    desc: "경쾌한 클릭",
    color: "#3B82F6",
    pressMs: 45,
    body: { freq: 235, decay: 0.05, gain: 0.32, lp: 3600 },
    click: { dur: 0.013, hp: 2200, gain: 0.5 },
    unlockAt: 0,
  },
  brown: {
    label: "갈축",
    desc: "적당한 구분감",
    color: "#B45309",
    pressMs: 78,
    body: { freq: 185, decay: 0.07, gain: 0.42, lp: 1500 },
    click: { dur: 0.009, hp: 1400, gain: 0.26 },
    unlockAt: 0,
  },
  red: {
    label: "적축",
    desc: "부드러운 리니어",
    color: "#EF4444",
    pressMs: 120,
    body: { freq: 150, decay: 0.1, gain: 0.5, lp: 720 },
    unlockAt: 0,
  },
  black: {
    label: "흑축",
    desc: "묵직한 리니어",
    color: "#1F2937",
    pressMs: 130,
    body: { freq: 122, decay: 0.13, gain: 0.58, lp: 560 },
    unlockAt: 300,
  },
  silent: {
    label: "저소음",
    desc: "조용한 리니어",
    color: "#FB7185",
    pressMs: 96,
    body: { freq: 158, decay: 0.06, gain: 0.26, lp: 460 },
    unlockAt: 1000,
  },
  topre: {
    label: "무접점",
    desc: "통통한 톡톡",
    color: "#A855F7",
    pressMs: 100,
    body: { freq: 132, decay: 0.11, gain: 0.5, lp: 980 },
    click: { dur: 0.02, hp: 700, gain: 0.14 },
    unlockAt: 2500,
  },
};
export const SWITCH_ORDER: SwitchKey[] = [
  "blue",
  "brown",
  "red",
  "black",
  "silent",
  "topre",
];
