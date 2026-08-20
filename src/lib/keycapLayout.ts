/* ------------------------------------------------------------------ *
 * 키캡 유닛 치수 & 배치 타입 — 투명 스위치 하우징 위에 3D 키캡이 올라간 키링 구조
 * ------------------------------------------------------------------ */
export const HOUSE = { w: 60, d: 60, h: 42 };
export const CAP = { w: 54, d: 54, h: 40 };
export const CAP_BASE_Y = -(HOUSE.h / 2 + CAP.h / 2 - 7);
export const PRESS = 12;
export const GAP = 6;
export const LETTERS = ["A", "S", "D", "F"];

// 키캡 배치 타입
export const LAYOUTS = {
  row3: { label: "3구", cols: 3, rows: 1 },
  row4: { label: "4구", cols: 4, rows: 1 },
  square: { label: "정사각형", cols: 2, rows: 2 },
} as const;
export type LayoutKey = keyof typeof LAYOUTS;
