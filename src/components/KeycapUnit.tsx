import {
  memo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box } from "./Box";
import { KeycapKey } from "./KeycapKey";
import { BASE_FACES, DEFAULT_CAP, type CapStyle } from "../lib/capStyle";
import { GAP, HOUSE } from "../lib/keycapLayout";
import type { SwitchSpec } from "../lib/switches";

/* ------------------------------------------------------------------ *
 * 키캡 유닛 — 투명 스위치 하우징 위에 3D 키캡이 올라간 키링 구조
 * ------------------------------------------------------------------ */
interface KeycapUnitProps {
  cols: number;
  rows: number;
  spec: SwitchSpec;
  caps: CapStyle[];
  pressed: Set<string>;
  labels: string[];
  selectedId?: string | null;
  onKeyDown: (id: string, e: ReactPointerEvent) => void;
  onKeyUp: (id: string) => void;
}

const DRAG_THRESHOLD = 6; // px, 이보다 많이 움직이면 회전(드래그)으로 판단
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

function KeycapUnitImpl({
  cols,
  rows,
  spec,
  caps,
  pressed,
  labels,
  selectedId,
  onKeyDown,
  onKeyUp,
}: KeycapUnitProps) {
  const totalW = cols * HOUSE.w + (cols - 1) * GAP;
  const totalD = rows * HOUSE.d + (rows - 1) * GAP;
  const positions = Array.from({ length: cols * rows }, (_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    return {
      id: `K${i}`,
      x: c * (HOUSE.w + GAP) - totalW / 2 + HOUSE.w / 2,
      z: r * (HOUSE.d + GAP) - totalD / 2 + HOUSE.d / 2,
    };
  });

  const [rot, setRot] = useState({ x: -32, y: 19 });
  const drag = useRef({
    active: false,
    id: -1,
    sx: 0,
    sy: 0,
    rx: 0,
    ry: 0,
    moved: false,
    keyId: null as string | null,
  });

  const handleDown = (e: ReactPointerEvent) => {
    const keyEl = (e.target as HTMLElement).closest<HTMLElement>("[data-key]");
    const keyId = keyEl?.dataset.key ?? null;
    drag.current = {
      active: true,
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      rx: rot.x,
      ry: rot.y,
      moved: false,
      keyId,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (keyId != null) onKeyDown(keyId, e); // 즉시 눌림 + 소리 (탭 피드백)
  };

  const handleMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      d.moved = true; // 드래그로 확정 → 눌렀던 키는 다시 튀어오르게
      if (d.keyId != null) onKeyUp(d.keyId);
    }
    if (d.moved) {
      setRot({ x: clamp(d.rx - dy * 0.4, -78, 78), y: d.ry + dx * 0.4 });
    }
  };

  const handleUp = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.id) return;
    if (d.keyId != null && !d.moved) onKeyUp(d.keyId); // 탭 릴리즈
    d.active = false;
    d.keyId = null;
  };

  return (
    <div
      className="kc-stage"
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <div
        className="kc-unit"
        style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
      >
        {/* 아크릴 베이스 플레이트 */}
        <Box
          w={totalW + 22}
          d={totalD + 12}
          h={10}
          glass
          radius={7}
          faces={BASE_FACES}
          style={{
            transform: `translate(-50%, -50%) translateY(${HOUSE.h / 2 + 3}px)`,
          }}
        />

        {positions.map(({ id, x, z }, i) => (
          <KeycapKey
            key={id}
            id={id}
            x={x}
            z={z}
            label={labels[i] ?? `키 ${i + 1}`}
            cap={caps[i] ?? DEFAULT_CAP}
            pressed={pressed.has(id)}
            selected={selectedId === id}
            switchColor={spec.color}
            pressMs={spec.pressMs}
          />
        ))}
      </div>

      <div className="kc-shadow" style={{ width: totalW + 30 }} />

      {/* 키링(고리) */}
      <svg
        className="kc-ring"
        viewBox="0 0 60 120"
        aria-hidden="true"
        style={{
          transform: `translate(${totalW / 2 + 22}px, -50%) rotate(-20deg)`,
        }}
      >
        <defs>
          <linearGradient id="kcMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e5e9ef" />
            <stop offset="0.5" stopColor="#aab2bd" />
            <stop offset="1" stopColor="#d7dce3" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="52"
          width="20"
          height="9"
          rx="4.5"
          fill="url(#kcMetal)"
        />
        <circle
          cx="38"
          cy="56"
          r="17"
          fill="none"
          stroke="url(#kcMetal)"
          strokeWidth="6"
        />
      </svg>

      <div className="kc-hint kc-hint--side">🖐️ 드래그해서 요리조리</div>
    </div>
  );
}

// props가 그대로면(예: bursts/combo 등 무관한 상태 변경) 무거운 3D 트리 전체를
// 다시 그리지 않도록 감싸요. 실제로 눌린 키 하나만 KeycapKey 레벨에서 갱신돼요.
export const KeycapUnit = memo(KeycapUnitImpl);
