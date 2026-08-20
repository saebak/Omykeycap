import { generateHapticFeedback } from "@apps-in-toss/web-framework";

/* 햅틱(진동) — 토스 환경이 아니면 조용히 무시해요 */
export type HapticType =
  | "tickWeak"
  | "tap"
  | "tickMedium"
  | "softMedium"
  | "basicWeak"
  | "basicMedium"
  | "success"
  | "error"
  | "wiggle"
  | "confetti";

export function haptic(type: HapticType) {
  try {
    void generateHapticFeedback?.({ type });
  } catch {
    /* noop */
  }
}
