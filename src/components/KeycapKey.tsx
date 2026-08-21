import { memo } from "react";
import { Box } from "./Box";
import { CapFace } from "./CapFace";
import { Stem } from "./Stem";
import { HOUSING_FACES, capFaces, capGlowColor, type CapStyle } from "../lib/capStyle";
import { readableText } from "../lib/color";
import { CAP, CAP_BASE_Y, HOUSE, PRESS } from "../lib/keycapLayout";

/* ------------------------------------------------------------------ *
 * 키캡 한 개(하우징+캡) — pressed/selected/cap이 바뀐 키만 리렌더되도록
 * memo로 감싸요. 부모(KeycapUnit)가 눌림 Set 전체를 새로 만들어도
 * 실제로 눌린 키 하나만 다시 그려요.
 * ------------------------------------------------------------------ */
interface KeycapKeyProps {
  id: string;
  x: number;
  z: number;
  label: string;
  cap: CapStyle;
  pressed: boolean;
  selected: boolean;
  switchColor: string;
  pressMs: number;
}

function KeycapKeyImpl({
  id,
  x,
  z,
  label,
  cap,
  pressed,
  selected,
  switchColor,
  pressMs,
}: KeycapKeyProps) {
  const lift = CAP_BASE_Y + (pressed ? PRESS : 0) - (selected ? 14 : 0);
  // 글자 모드(sticker null): 직접 입력한 글자 → 없으면 기본 A·S·D·F
  const content =
    cap.sticker == null
      ? cap.text != null && cap.text !== ""
        ? cap.text
        : label
      : cap.sticker;
  const isEmoji = cap.sticker != null && cap.sticker !== "";
  const glowColor = capGlowColor(cap.color, cap.finish);
  const labelColor =
    cap.finish === "holo" || cap.finish === "metal"
      ? "#2b2f36"
      : readableText(cap.color);

  return (
    <div
      className="kc-key"
      data-key={id}
      role="button"
      aria-label={label}
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
        topContent={<Stem color={switchColor} />}
        style={{ transform: "translate(-50%, -50%)" }}
      />
      {/* 3D 키캡 (눌리면 하우징 속으로 내려가요) */}
      <div
        className="kc-cap-lift"
        style={{
          transform: `translate(-50%, -50%) translateY(${lift}px)`,
          transition: `transform ${pressMs}ms ease`,
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
}

export const KeycapKey = memo(KeycapKeyImpl);
