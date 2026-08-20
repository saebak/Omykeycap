import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Box } from "./Box";
import { CapFace } from "./CapFace";
import { Stem } from "./Stem";
import {
  BASE_FACES,
  DEFAULT_CAP,
  HOUSING_FACES,
  capFaces,
  capGlowColor,
  type CapStyle,
} from "../lib/capStyle";
import { readableText } from "../lib/color";
import { CAP, CAP_BASE_Y, GAP, HOUSE, PRESS } from "../lib/keycapLayout";
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

export function KeycapUnit({
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

        {positions.map(({ id, x, z }, i) => {
          const down = pressed.has(id);
          const cap = caps[i] ?? DEFAULT_CAP;
          const selected = selectedId === id;
          const lift = CAP_BASE_Y + (down ? PRESS : 0) - (selected ? 14 : 0);
          // 글자 모드(sticker null): 직접 입력한 글자 → 없으면 기본 A·S·D·F
          const content =
            cap.sticker == null
              ? cap.text != null && cap.text !== ""
                ? cap.text
                : labels[i]
              : cap.sticker;
          const isEmoji = cap.sticker != null && cap.sticker !== "";
          const glowColor = capGlowColor(cap.color, cap.finish);
          const labelColor =
            cap.finish === "holo" || cap.finish === "metal"
              ? "#2b2f36"
              : readableText(cap.color);
          return (
            <div
              key={id}
              className="kc-key"
              data-key={id}
              role="button"
              aria-label={labels[i] ?? `키 ${i + 1}`}
              style={{
                transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px)`,
              }}
            >
              {/* 투명 스위치 하우징 */}
              <Box
                w={HOUSE.w}
                d={HOUSE.d}
                h={HOUSE.h}
                glass
                radius={6}
                faces={HOUSING_FACES}
                topContent={<Stem color={spec.color} />}
                style={{ transform: "translate(-50%, -50%)" }}
              />
              {/* 3D 키캡 (눌리면 하우징 속으로 내려가요) */}
              <div
                className="kc-cap-lift"
                style={{
                  transform: `translate(-50%, -50%) translateY(${lift}px)`,
                  transition: `transform ${spec.pressMs}ms ease`,
                }}
              >
                {/* 네온/홀로 언더글로우 — filter가 아닌 별도 요소라 3D가 안 깨져요 */}
                {glowColor != null && (
                  <div
                    className="kc-cap-glow"
                    style={{
                      background: `radial-gradient(50% 50% at 50% 50%, ${glowColor}, transparent 70%)`,
                    }}
                  />
                )}
                <Box
                  w={CAP.w}
                  d={CAP.d}
                  h={CAP.h}
                  radius={12}
                  faces={capFaces(cap.color, cap.finish)}
                  topClassName="kc-captop"
                  topContent={
                    cap.face != null ? (
                      <CapFace design={cap.face} />
                    ) : (
                      <span
                        className={isEmoji ? "kc-cap-emoji" : "kc-cap-label"}
                        style={{ color: labelColor }}
                      >
                        {content}
                      </span>
                    )
                  }
                  style={{ transform: "translate(-50%, -50%)" }}
                />
              </div>
            </div>
          );
        })}
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
