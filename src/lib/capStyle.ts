import type { Faces } from "../components/Box";
import { darken, lighten, rotateHue } from "./color";
import { KEYCAP_COLORS } from "./color";

export const HOUSING_FACES: Faces = {
  top: "rgba(224, 232, 240, 0.14)",
  front: "rgba(216, 226, 238, 0.30)",
  back: "rgba(200, 212, 226, 0.22)",
  left: "rgba(190, 204, 220, 0.30)",
  right: "rgba(238, 244, 250, 0.34)",
  bottom: "rgba(180, 196, 214, 0.42)",
};

export const BASE_FACES: Faces = {
  top: "rgba(210, 222, 236, 0.24)",
  front: "rgba(196, 210, 226, 0.34)",
  back: "rgba(180, 196, 214, 0.26)",
  left: "rgba(176, 192, 212, 0.34)",
  right: "rgba(224, 234, 246, 0.36)",
  bottom: "rgba(168, 186, 208, 0.44)",
};

// 키캡 마감(질감) 종류
export type CapFinish = "solid" | "gradient" | "neon" | "metal" | "holo";
export const CAP_FINISHES: { key: CapFinish; label: string }[] = [
  { key: "solid", label: "기본" },
  { key: "gradient", label: "그라데이션" },
  { key: "neon", label: "네온" },
  { key: "metal", label: "메탈" },
  { key: "holo", label: "홀로그램" },
];
export const FINISH_KEYS = CAP_FINISHES.map((f) => f.key) as string[];

export function capFaces(color: string, finish: CapFinish = "solid"): Faces {
  // 옆면은 공통(원통형 음영), 윗면만 마감에 따라 화려하게 바뀌어요.
  const side = (a: string, b: string) =>
    `linear-gradient(180deg, ${a} 0%, ${b} 100%)`;
  const sides = {
    front: side(lighten(color, 0.06), darken(color, 0.26)),
    back: side(darken(color, 0.2), darken(color, 0.38)),
    left: side(darken(color, 0.16), darken(color, 0.34)),
    right: side(lighten(color, 0.18), darken(color, 0.08)),
    bottom: darken(color, 0.44),
  };
  const gloss =
    "radial-gradient(125% 95% at 50% 18%, rgba(255,255,255,0.62), rgba(255,255,255,0) 54%)";
  const dish =
    "radial-gradient(120% 120% at 50% 120%, rgba(0,0,0,0.20), rgba(0,0,0,0) 46%)";

  let top: string;
  switch (finish) {
    case "gradient": {
      // 유사색(hue +30)으로 부드럽게 흐르는 대각선 2톤
      const comp = rotateHue(color, 30);
      top =
        `${gloss}, ` +
        `linear-gradient(135deg, ${lighten(color, 0.3)} 0%, ${color} 52%, ${comp} 100%)`;
      break;
    }
    case "neon": {
      top =
        "radial-gradient(120% 88% at 50% 22%, rgba(255,255,255,0.9), rgba(255,255,255,0) 46%), " +
        `linear-gradient(180deg, ${lighten(color, 0.32)} 0%, ${color} 58%, ${darken(color, 0.02)} 100%)`;
      break;
    }
    case "metal": {
      top =
        "linear-gradient(105deg, rgba(255,255,255,0) 32%, rgba(255,255,255,0.78) 46%, rgba(255,255,255,0) 60%), " +
        `${dish}, ` +
        `linear-gradient(180deg, ${lighten(color, 0.44)} 0%, ${darken(color, 0.08)} 52%, ${lighten(color, 0.22)} 100%)`;
      break;
    }
    case "holo": {
      const c1 = rotateHue(color, 0, 55);
      const c2 = rotateHue(color, 60, 55);
      const c3 = rotateHue(color, 140, 55);
      const c4 = rotateHue(color, 220, 55);
      const c5 = rotateHue(color, 300, 55);
      top =
        "radial-gradient(120% 90% at 50% 18%, rgba(255,255,255,0.5), rgba(255,255,255,0) 52%), " +
        `linear-gradient(120deg, ${c1}, ${c2}, ${c3}, ${c4}, ${c5})`;
      break;
    }
    default:
      top =
        `${gloss}, ${dish}, ` +
        `linear-gradient(180deg, ${lighten(color, 0.24)} 0%, ${color} 46%, ${darken(color, 0.14)} 100%)`;
  }
  return { top, ...sides };
}

// 네온/홀로 마감의 언더글로우 색 (없으면 null) — filter 대신 별도 요소로 그려요.
export function capGlowColor(color: string, finish: CapFinish): string | null {
  if (finish === "neon") return color;
  if (finish === "holo") return "rgba(255, 255, 255, 0.85)";
  return null;
}

/* ------------------------------------------------------------------ *
 * 키캡 커스텀 데이터 모델
 * ------------------------------------------------------------------ */
// sticker: null → 알파벳 글자 표시, "" → 아무것도 없음, 그 외 → 이모지/캐릭터
// face: null → 얼굴 없음, 그 외 → FACE_DESIGNS 키(얼굴이 있으면 sticker/글자보다 우선)
export interface CapStyle {
  color: string;
  sticker: string | null;
  finish: CapFinish; // 마감(질감)
  face: string | null; // 캐릭터 얼굴
  text: string | null; // 직접 입력한 글자 (null이면 기본 A·S·D·F)
}
export const DEFAULT_CAP: CapStyle = {
  color: KEYCAP_COLORS[1],
  sticker: null,
  finish: "solid",
  face: null,
  text: null,
};
export const MAX_KEYS = 4;
