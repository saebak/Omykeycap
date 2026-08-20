import { FACE_DESIGNS } from "../lib/faceDesigns";

// 키캡 윗면에 그려지는 귀여운 캐릭터 얼굴
export function CapFace({ design }: { design: string }) {
  const d = FACE_DESIGNS.find((f) => f.key === design);
  if (d == null) return null;
  return (
    <div className="kc-face-art" aria-hidden="true">
      {d.ears !== "none" && (
        <>
          <span
            className={`kc-ear kc-ear--${d.ears} kc-ear-l`}
            style={{ background: d.earColor }}
          />
          <span
            className={`kc-ear kc-ear--${d.ears} kc-ear-r`}
            style={{ background: d.earColor }}
          />
        </>
      )}
      <span className={`kc-eye kc-eye--${d.eyes} kc-eye-l`} />
      <span className={`kc-eye kc-eye--${d.eyes} kc-eye-r`} />
      {d.cheeks && (
        <>
          <span className="kc-cheek kc-cheek-l" />
          <span className="kc-cheek kc-cheek-r" />
        </>
      )}
      {d.nose && <span className="kc-nose" />}
      <span className={`kc-mouth kc-mouth--${d.mouth}`} />
    </div>
  );
}
