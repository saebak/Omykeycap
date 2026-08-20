export function Stem({ color }: { color: string }) {
  return (
    <div className="kc-stem">
      <div className="kc-stem-core" style={{ background: color }}>
        <span className="kc-stem-bar kc-stem-bar-h" />
        <span className="kc-stem-bar kc-stem-bar-v" />
      </div>
    </div>
  );
}
