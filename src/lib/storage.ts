import { Storage as TossStorage } from "@apps-in-toss/web-framework";
import { DEFAULT_CAP, FINISH_KEYS, MAX_KEYS } from "./capStyle";
import type { CapFinish, CapStyle } from "./capStyle";
import { FACE_KEYS } from "./faceDesigns";
import { LAYOUTS, type LayoutKey } from "./keycapLayout";
import { SWITCH_ORDER, type SwitchKey } from "./switches";

/* ------------------------------------------------------------------ *
 * 저장 원시 계층 — 토스 Storage(사용자별)를 우선 쓰고, 실패하거나 값이
 * 없으면 localStorage로 폴백해요. 모든 load 함수와 persist 함수는 이 두
 * 헬퍼(loadRaw/persistRaw) 위에 얇게 얹혀 있어요.
 * ------------------------------------------------------------------ */

// key에 저장된 원시 문자열을 읽어 parse에 넘겨요. parse가 null을 반환하거나
// 예외를 던지면(값이 없거나 손상된 경우) 다음 저장소로 폴백해요.
async function loadRaw<T>(
  key: string,
  parse: (raw: string) => T | null,
): Promise<T | null> {
  try {
    const v = await TossStorage.getItem(key);
    if (v != null) {
      const parsed = parse(v);
      if (parsed != null) return parsed;
    }
  } catch {
    /* 토스 환경이 아니면 무시하고 폴백 */
  }
  try {
    const v = window.localStorage.getItem(key);
    if (v != null) {
      const parsed = parse(v);
      if (parsed != null) return parsed;
    }
  } catch {
    /* noop */
  }
  return null;
}

// 두 저장소 모두에 원시 문자열을 써요. 한쪽이 실패해도 나머지는 시도해요.
async function persistRaw(key: string, value: string): Promise<void> {
  try {
    await TossStorage.setItem(key, value);
  } catch {
    /* noop */
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
}

// JSON으로 직렬화된 값을 읽어요. normalize는 파싱된 값을 항상 유효한 T로
// 보정해야 해요(null을 반환하면 안 돼요) — 파싱 자체가 실패했을 때만 폴백해요.
function loadJSON<T>(
  key: string,
  normalize: (raw: unknown) => T,
): Promise<T | null> {
  return loadRaw(key, (v) => normalize(JSON.parse(v)));
}

function persistJSON(key: string, value: unknown): Promise<void> {
  return persistRaw(key, JSON.stringify(value));
}

/* 간단한 on/off 설정 저장 (음소거, 햅틱, 최초 탭 여부 등) */
export async function loadFlag(key: string, dflt: boolean): Promise<boolean> {
  const v = await loadRaw(key, (raw) => raw === "1");
  return v ?? dflt;
}

export function persistFlag(key: string, val: boolean): Promise<void> {
  return persistRaw(key, val ? "1" : "0");
}

/* ------------------------------------------------------------------ *
 * 키캡 커스텀
 * ------------------------------------------------------------------ */
const CAPS_STORAGE_KEY = "clickme-key.caps.v1";

export function normalizeCaps(raw: unknown): CapStyle[] {
  const arr = Array.isArray(raw) ? raw : [];
  return Array.from({ length: MAX_KEYS }, (_, i) => {
    const c = arr[i] as
      | {
          color?: unknown;
          sticker?: unknown;
          finish?: unknown;
          face?: unknown;
          text?: unknown;
        }
      | undefined;
    if (
      c != null &&
      typeof c.color === "string" &&
      (c.sticker === null || typeof c.sticker === "string")
    ) {
      const finish =
        typeof c.finish === "string" && FINISH_KEYS.includes(c.finish)
          ? (c.finish as CapFinish)
          : "solid";
      const face =
        typeof c.face === "string" && FACE_KEYS.includes(c.face)
          ? c.face
          : null;
      const text = typeof c.text === "string" ? c.text.slice(0, 3) : null;
      return {
        color: c.color,
        sticker: c.sticker as string | null,
        finish,
        face,
        text,
      };
    }
    return { ...DEFAULT_CAP };
  });
}

// 구버전(단일 배열) 저장 형식 — 마이그레이션 용도로만 남겨둬요.
function loadCaps(): Promise<CapStyle[] | null> {
  return loadJSON(CAPS_STORAGE_KEY, normalizeCaps);
}

/* 배치 타입(3구/4구/정사각형)별로 각각 저장해요 */
export type CapsByLayout = Record<LayoutKey, CapStyle[]>;
const CAPS_BY_LAYOUT_STORAGE_KEY = "clickme-key.capsByLayout.v1";

function makeDefaultCaps(): CapStyle[] {
  return Array.from({ length: MAX_KEYS }, () => ({ ...DEFAULT_CAP }));
}

export function defaultCapsByLayout(): CapsByLayout {
  return {
    row3: makeDefaultCaps(),
    row4: makeDefaultCaps(),
    square: makeDefaultCaps(),
  };
}

export function normalizeCapsByLayout(raw: unknown): CapsByLayout {
  const r =
    raw != null && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};
  const out = defaultCapsByLayout();
  (Object.keys(out) as LayoutKey[]).forEach((k) => {
    if (r[k] != null) out[k] = normalizeCaps(r[k]);
  });
  return out;
}

export async function loadCapsByLayout(): Promise<CapsByLayout | null> {
  // 새 형식(타입별 저장) 우선
  const saved = await loadJSON(CAPS_BY_LAYOUT_STORAGE_KEY, normalizeCapsByLayout);
  if (saved != null) return saved;
  // 구버전(단일 배열)이 있으면 모든 타입에 적용해 마이그레이션
  const old = await loadCaps();
  if (old != null) {
    return {
      row3: old.map((c) => ({ ...c })),
      row4: old.map((c) => ({ ...c })),
      square: old.map((c) => ({ ...c })),
    };
  }
  return null;
}

export function persistCapsByLayout(map: CapsByLayout): Promise<void> {
  return persistJSON(CAPS_BY_LAYOUT_STORAGE_KEY, map);
}

/* ------------------------------------------------------------------ *
 * 프리셋 — 여러 개의 커스텀을 보관해요.
 * ------------------------------------------------------------------ */
export interface Preset {
  id: string;
  caps: CapStyle[];
  layout: LayoutKey; // 저장 당시 배치(3구/4구/정사각형)
}
const PRESETS_STORAGE_KEY = "clickme-key.presets.v1";
export const MAX_PRESETS = 12;

export function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function normalizePresets(raw: unknown): Preset[] {
  const arr = Array.isArray(raw) ? raw : [];
  const out: Preset[] = [];
  for (const p of arr) {
    const pp = p as { id?: unknown; caps?: unknown; layout?: unknown };
    if (pp != null && typeof pp.id === "string") {
      const layout =
        typeof pp.layout === "string" && pp.layout in LAYOUTS
          ? (pp.layout as LayoutKey)
          : "square";
      out.push({ id: pp.id, caps: normalizeCaps(pp.caps), layout });
    }
    if (out.length >= MAX_PRESETS) break;
  }
  return out;
}

export function loadPresets(): Promise<Preset[] | null> {
  return loadJSON(PRESETS_STORAGE_KEY, normalizePresets);
}

export function persistPresets(presets: Preset[]): Promise<void> {
  return persistJSON(PRESETS_STORAGE_KEY, presets);
}

/* ------------------------------------------------------------------ *
 * 음소거 설정
 * ------------------------------------------------------------------ */
const MUTED_STORAGE_KEY = "clickme-key.muted.v1";

export function loadMuted(): Promise<boolean> {
  return loadFlag(MUTED_STORAGE_KEY, false);
}

export function persistMuted(muted: boolean): Promise<void> {
  return persistFlag(MUTED_STORAGE_KEY, muted);
}

/* ------------------------------------------------------------------ *
 * 누적 타건 수 (해금 미션용)
 * ------------------------------------------------------------------ */
const TOTAL_TAPS_STORAGE_KEY = "clickme-key.totalTaps.v1";

export async function loadTotalTaps(): Promise<number> {
  const n = await loadRaw(TOTAL_TAPS_STORAGE_KEY, (v) => {
    const parsed = parseInt(v, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  });
  return n ?? 0;
}

export function persistTotalTaps(n: number): Promise<void> {
  return persistRaw(TOTAL_TAPS_STORAGE_KEY, String(n));
}

/* ------------------------------------------------------------------ *
 * 축 해금/열람 목록 — 둘 다 SwitchKey 배열이라 같은 정규화 함수를 써요.
 * ------------------------------------------------------------------ */
const UNLOCKED_STORAGE_KEY = "clickme-key.unlocked.v1";
const SEEN_STORAGE_KEY = "clickme-key.seen.v1";

function normalizeSwitchKeys(raw: unknown): SwitchKey[] {
  if (!Array.isArray(raw)) return [];
  const out: SwitchKey[] = [];
  for (const k of raw) {
    if (typeof k === "string" && (SWITCH_ORDER as string[]).includes(k)) {
      out.push(k as SwitchKey);
    }
  }
  return out;
}

// 해금한 축 목록 유지 (한 번 해금하면 계속 사용 가능)
export async function loadUnlocked(): Promise<SwitchKey[]> {
  return (await loadJSON(UNLOCKED_STORAGE_KEY, normalizeSwitchKeys)) ?? [];
}

export function persistUnlocked(keys: SwitchKey[]): Promise<void> {
  return persistJSON(UNLOCKED_STORAGE_KEY, keys);
}

// 이미 확인(사용)한 축 목록 — 갓 해금된 축에 NEW를 띄우기 위해 사용해요
export async function loadSeen(): Promise<SwitchKey[]> {
  return (await loadJSON(SEEN_STORAGE_KEY, normalizeSwitchKeys)) ?? [];
}

export function persistSeen(keys: SwitchKey[]): Promise<void> {
  return persistJSON(SEEN_STORAGE_KEY, keys);
}

export const HAPTIC_STORAGE_KEY = "clickme-key.haptic.v1";
export const EVER_TAPPED_STORAGE_KEY = "clickme-key.everTapped.v1";
