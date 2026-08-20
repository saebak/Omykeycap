import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * 3D 큐브(Box) — preserve-3d로 6면을 실제 입체로 그려요.
 * ------------------------------------------------------------------ */
export interface Faces {
  top: string;
  bottom?: string;
  front: string;
  back?: string;
  left: string;
  right: string;
}

export interface BoxProps {
  w: number;
  d: number;
  h: number;
  faces: Faces;
  radius?: number;
  glass?: boolean;
  topContent?: ReactNode;
  topClassName?: string;
  style?: CSSProperties;
}

export function Box({
  w,
  d,
  h,
  faces,
  radius = 5,
  glass,
  topContent,
  topClassName,
  style,
}: BoxProps) {
  const faceClass = "kc-face" + (glass ? " kc-face--glass" : "");
  const defs: Array<{
    key: string;
    fw: number;
    fh: number;
    t: string;
    bg: string;
    content?: ReactNode;
  }> = [
    {
      key: "front",
      fw: w,
      fh: h,
      t: `translateZ(${d / 2}px)`,
      bg: faces.front,
    },
    {
      key: "back",
      fw: w,
      fh: h,
      t: `rotateY(180deg) translateZ(${d / 2}px)`,
      bg: faces.back ?? faces.front,
    },
    {
      key: "right",
      fw: d,
      fh: h,
      t: `rotateY(90deg) translateZ(${w / 2}px)`,
      bg: faces.right,
    },
    {
      key: "left",
      fw: d,
      fh: h,
      t: `rotateY(-90deg) translateZ(${w / 2}px)`,
      bg: faces.left,
    },
    {
      key: "top",
      fw: w,
      fh: d,
      t: `rotateX(90deg) translateZ(${h / 2}px)`,
      bg: faces.top,
      content: topContent,
    },
    {
      key: "bottom",
      fw: w,
      fh: d,
      t: `rotateX(-90deg) translateZ(${h / 2}px)`,
      bg: faces.bottom ?? faces.top,
    },
  ];
  return (
    <div className="kc-box" style={style}>
      {defs.map((f) => (
        <div
          key={f.key}
          className={
            f.key === "top" && topClassName
              ? faceClass + " " + topClassName
              : faceClass
          }
          style={{
            width: f.fw,
            height: f.fh,
            background: f.bg,
            borderRadius: radius,
            transform: `translate(-50%, -50%) ${f.t}`,
          }}
        >
          {f.content}
        </div>
      ))}
    </div>
  );
}
