/* ------------------------------------------------------------------ *
 * 색 유틸 & 팔레트
 * ------------------------------------------------------------------ */
export const KEYCAP_COLORS = [
  // 파스텔
  "#F4F4F5",
  "#C7D2FE",
  "#A7F3D0",
  "#FBCFE8",
  "#FDE68A",
  "#FCA5A5",
  "#93C5FD",
  "#DDD6FE",
  // 비비드 (화려한 조합용)
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  // 다크
  "#374151",
  "#111827",
];

export function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function mixColor(
  hex: string,
  tr: number,
  tg: number,
  tb: number,
  amt: number,
) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number, t: number) => Math.round(c + (t - c) * amt);
  return `rgb(${f(r, tr)}, ${f(g, tg)}, ${f(b, tb)})`;
}
export const darken = (hex: string, amt: number) => mixColor(hex, 0, 0, 0, amt);
export const lighten = (hex: string, amt: number) =>
  mixColor(hex, 255, 255, 255, amt);

export function readableText(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#374151" : "#FFFFFF";
}

export function rgbToHsl(r: number, g: number, b: number) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// 색을 hue만큼 회전한 색(hsl 문자열)으로 — 그라데이션/홀로에 사용해요.
// minSat: 회색 계열도 무지개가 보이도록 최소 채도를 보장할 때 사용(홀로 전용).
export function rotateHue(hex: string, deg: number, minSat = 0): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const sat = Math.min(100, Math.max(minSat, s));
  return `hsl(${(h + deg + 360) % 360}, ${sat}%, ${l}%)`;
}
