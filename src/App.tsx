import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import "./App.css";
import { BannerAd } from "./components/BannerAd";
import { CustomizerScreen } from "./components/CustomizerScreen";
import { KeycapUnit } from "./components/KeycapUnit";
import { useAudioSettings } from "./hooks/useAudioSettings";
import { useUnlockSystem } from "./hooks/useUnlockSystem";
import type { CapStyle } from "./lib/capStyle";
import { hexToRgb } from "./lib/color";
import { LAYOUTS, LETTERS, type LayoutKey } from "./lib/keycapLayout";
import {
  MAX_PRESETS,
  defaultCapsByLayout,
  loadCapsByLayout,
  loadPresets,
  makeId,
  persistCapsByLayout,
  persistPresets,
  type CapsByLayout,
  type Preset,
} from "./lib/storage";
import { SWITCHES, SWITCH_ORDER, type SwitchKey } from "./lib/switches";

/* ------------------------------------------------------------------ *
 * App
 * ------------------------------------------------------------------ */
const KEY_MAP: Record<string, string> = { A: "K0", S: "K1", D: "K2", F: "K3" };

// 탭 이펙트(누를 때 튀어오르는 "+1" & 파동) 하나를 나타내요.
interface Burst {
  id: number;
  x: number;
  y: number;
  scale?: number; // 콤보가 높을수록 이펙트가 커져요.
}

function App() {
  const [switchType, setSwitchType] = useState<SwitchKey>("blue");
  // 배치 타입별로 각각의 키캡 커스텀을 보관해요.
  const [capsByLayout, setCapsByLayout] =
    useState<CapsByLayout>(defaultCapsByLayout);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [screen, setScreen] = useState<"home" | "custom">("home");
  const [layout, setLayout] = useState<LayoutKey>("row3");
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [showTip, setShowTip] = useState(false); // 해금 안내 툴팁
  const [axisOpen, setAxisOpen] = useState(false); // 축 선택 드롭다운

  // 현재 배치의 키캡
  const caps = capsByLayout[layout];

  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstId = useRef(0);
  const playRef = useRef<HTMLDivElement>(null);

  // 소리(음소거)/진동(햅틱) 설정
  const { muted, hapticOn, toggleMute, toggleHaptic, triggerHaptic, playTap } =
    useAudioSettings();

  // 해금/콤보/누적 타수
  const {
    totalTaps,
    unlocked,
    seen,
    everTapped,
    justUnlocked,
    combo,
    hasLocked,
    markSeen,
    registerTap,
  } = useUnlockSystem({ triggerHaptic });

  const spec = SWITCHES[switchType];
  const { cols, rows } = LAYOUTS[layout];
  const keyCount = cols * rows;
  const labels = useMemo(() => LETTERS.slice(0, keyCount), [keyCount]);

  // 저장했던 키캡 커스텀 & 프리셋 불러오기 (접속할 때마다 유지)
  useEffect(() => {
    let alive = true;
    void loadCapsByLayout().then((saved) => {
      if (!alive) return;
      if (saved != null) setCapsByLayout(saved);
      // 딥링크(?screen=custom)로 열면 저장 로드 후 꾸미기 화면으로 진입해요.
      try {
        const target = new URLSearchParams(window.location.search).get(
          "screen",
        );
        if (target === "custom") setScreen("custom");
      } catch {
        /* noop */
      }
    });
    void loadPresets().then((saved) => {
      if (alive && saved != null) setPresets(saved);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 툴팁이 열리면 바깥을 터치했을 때 닫아요.
  useEffect(() => {
    if (!showTip) return;
    const close = () => setShowTip(false);
    const t = window.setTimeout(
      () => document.addEventListener("pointerdown", close),
      0,
    );
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("pointerdown", close);
    };
  }, [showTip]);

  // 축 드롭다운 바깥 터치 시 닫기
  useEffect(() => {
    if (!axisOpen) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest(".kc-axis") == null) setAxisOpen(false);
    };
    const t = window.setTimeout(
      () => document.addEventListener("pointerdown", onDown),
      0,
    );
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [axisOpen]);

  const selectAxis = useCallback(
    (key: SwitchKey) => {
      setSwitchType(key);
      setAxisOpen(false);
      markSeen(key);
    },
    [markSeen],
  );

  const addPreset = useCallback(
    (next: CapStyle[]) => {
      setPresets((prev) => {
        const list = [
          ...prev,
          { id: makeId(), caps: next.map((c) => ({ ...c })), layout },
        ];
        const trimmed = list.slice(-MAX_PRESETS);
        void persistPresets(trimmed);
        return trimmed;
      });
    },
    [layout],
  );

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => {
      const list = prev.filter((p) => p.id !== id);
      void persistPresets(list);
      return list;
    });
  }, []);

  const press = useCallback((id: string) => {
    setPressed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const release = useCallback((id: string) => {
    setPressed((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // 누를 때마다 "+1" & 파동 이펙트를 무대 위에 잠깐 띄워요.
  const spawnBurst = useCallback((clientX?: number, clientY?: number) => {
    const el = playRef.current;
    if (el == null) return;
    const rect = el.getBoundingClientRect();
    const x = clientX != null ? clientX - rect.left : rect.width / 2;
    const y = clientY != null ? clientY - rect.top : rect.height * 0.42;
    const id = (burstId.current += 1);
    setBursts((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 700);
  }, []);

  // 한 번의 탭 = 해금 시스템 카운트 + 타건음 + 이펙트
  const handleTap = useCallback(
    (clientX?: number, clientY?: number) => {
      registerTap();
      playTap(switchType);
      spawnBurst(clientX, clientY);
    },
    [registerTap, playTap, switchType, spawnBurst],
  );

  // 물리 키보드 지원 — A·S·D·F 매핑
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const id = KEY_MAP[e.key.toUpperCase()];
      if (id == null || Number(id.slice(1)) >= keyCount) return;
      e.preventDefault();
      if (e.repeat) return;
      press(id);
      handleTap();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const id = KEY_MAP[e.key.toUpperCase()];
      if (id != null) release(id);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [keyCount, press, release, handleTap]);

  const handleKeyDown = useCallback(
    (id: string, e: ReactPointerEvent) => {
      e.preventDefault();
      press(id);
      handleTap(e.clientX, e.clientY);
    },
    [press, handleTap],
  );

  const accentVars = useMemo(() => {
    const { r, g, b } = hexToRgb(spec.color);
    return {
      "--accent": spec.color,
      "--accent-soft": `rgba(${r}, ${g}, ${b}, 0.18)`,
      "--accent-glow": `rgba(${r}, ${g}, ${b}, 0.28)`,
    } as CSSProperties;
  }, [spec.color]);

  if (screen === "custom") {
    return (
      <CustomizerScreen
        accentVars={accentVars}
        spec={spec}
        cols={cols}
        rows={rows}
        keyCount={keyCount}
        labels={labels}
        initialCaps={caps}
        presets={presets}
        onAddPreset={addPreset}
        onDeletePreset={deletePreset}
        onCancel={() => setScreen("home")}
        onSave={(next) => {
          setCapsByLayout((prev) => {
            const merged = { ...prev, [layout]: next };
            void persistCapsByLayout(merged);
            return merged;
          });
          setScreen("home");
        }}
      />
    );
  }

  return (
    <div className="kc-app" style={accentVars}>
      {/* 히어로 헤더 */}
      <header className="kc-hero">
        <h1 className="kc-hero-title">오마이키캡</h1>
        <p className="kc-hero-sub">누를수록 빠져드는 진짜 타건감</p>
      </header>

      {/* 축 선택 (커스텀 드롭다운) */}
      <div className="kc-section">
        <div className={"kc-axis" + (axisOpen ? " kc-axis-open" : "")}>
          <button
            type="button"
            className="kc-axis-trigger"
            aria-haspopup="listbox"
            aria-expanded={axisOpen}
            onClick={() => setAxisOpen((o) => !o)}
          >
            <span
              className="kc-axis-dot"
              style={{ background: spec.color }}
              aria-hidden="true"
            />
            <span className="kc-axis-current">
              {spec.label}
              <span className="kc-muted"> · {spec.desc}</span>
            </span>
            <span className="kc-axis-caret" aria-hidden="true">
              ▾
            </span>
          </button>

          {axisOpen && (
            <div className="kc-axis-menu" role="listbox">
              {SWITCH_ORDER.map((key) => {
                const s = SWITCHES[key];
                const locked = s.unlockAt > 0 && !unlocked.has(key);
                const selected = switchType === key;
                const isNew = !locked && s.unlockAt > 0 && !seen.has(key);
                const progress = Math.min(totalTaps / s.unlockAt, 1);
                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={locked}
                    className={
                      "kc-axis-item" +
                      (selected ? " kc-axis-item-on" : "") +
                      (locked ? " kc-axis-item-locked" : "")
                    }
                    onClick={() => selectAxis(key)}
                  >
                    <span
                      className="kc-axis-dot"
                      style={{ background: s.color }}
                      aria-hidden="true"
                    />
                    <span className="kc-axis-info">
                      <span className="kc-axis-name">
                        {s.label}
                        {locked && <span className="kc-axis-lock"> 🔒</span>}
                        {isNew && <em className="kc-axis-new">NEW</em>}
                      </span>
                      {locked ? (
                        <>
                          <span className="kc-axis-desc">
                            {totalTaps.toLocaleString()} /{" "}
                            {s.unlockAt.toLocaleString()}타
                          </span>
                          <span className="kc-axis-bar">
                            <span
                              className="kc-axis-bar-fill"
                              style={{ width: `${progress * 100}%` }}
                            />
                          </span>
                        </>
                      ) : (
                        <span className="kc-axis-desc">{s.desc}</span>
                      )}
                    </span>
                    {selected && (
                      <span className="kc-axis-check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="kc-switch-info">
          <span className="kc-taps">
            {hasLocked && (
              <button
                type="button"
                className="kc-tip-btn"
                aria-label="해금 안내"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTip((v) => !v);
                }}
              >
                💡
              </button>
            )}
            <span className="kc-taps-label">누적 타수</span>
            <b className="kc-taps-num">{totalTaps.toLocaleString()}</b>
          </span>
          <div className="kc-count">
            {(Object.keys(LAYOUTS) as LayoutKey[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={layout === key}
                className={"kc-pill" + (layout === key ? " kc-pill-on" : "")}
                onClick={() => {
                  setLayout(key);
                  setPressed(new Set());
                }}
              >
                {LAYOUTS[key].label}
              </button>
            ))}
          </div>
          {showTip && hasLocked && (
            <div className="kc-tip-bubble" role="tooltip">
              많이 누르면 <b>새로운 축</b>이 열려요 🔓
            </div>
          )}
        </div>
      </div>

      {/* 3D 키캡 유닛 */}
      <div className="kc-play" ref={playRef}>
        {/* 새 축 해금 축하 */}
        {justUnlocked != null && (
          <div className="kc-unlock-toast" key={justUnlocked}>
            🎉 <b>{SWITCHES[justUnlocked].label}</b> 해금!
          </div>
        )}

        {/* 컨트롤: 소리 / 진동 */}
        <div className="kc-controls">
          <button
            type="button"
            className="kc-ctrl-btn"
            onClick={toggleMute}
            aria-pressed={!muted}
            aria-label={muted ? "소리 켜기" : "소리 끄기"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            type="button"
            className="kc-ctrl-btn"
            onClick={toggleHaptic}
            aria-pressed={hapticOn}
            aria-label={hapticOn ? "진동 끄기" : "진동 켜기"}
          >
            {hapticOn ? "📳" : "📴"}
          </button>
        </div>

        {/* 최초 1회 탭 유도 */}
        {!everTapped && (
          <div className="kc-nudge" aria-hidden="true">
            👆 키캡을 눌러보세요
          </div>
        )}

        {/* 콤보 미터 */}
        {combo >= 2 && (
          <div
            className="kc-combo"
            key={combo}
            data-hot={combo >= 15 ? "3" : combo >= 8 ? "2" : "1"}
          >
            <span className="kc-combo-fire" aria-hidden="true">
              🔥
            </span>
            <span className="kc-combo-x">{combo}</span>
            <span className="kc-combo-label">COMBO</span>
          </div>
        )}

        <KeycapUnit
          cols={cols}
          rows={rows}
          spec={spec}
          caps={caps}
          pressed={pressed}
          labels={labels}
          onKeyDown={handleKeyDown}
          onKeyUp={release}
        />

        {/* 누를 때 튀어오르는 이펙트 */}
        {bursts.map((b) => (
          <span
            key={b.id}
            className="kc-burst"
            style={{ left: b.x, top: b.y }}
            aria-hidden="true"
          >
            <span className="kc-burst-ring" />
            <span className="kc-burst-plus">+1</span>
          </span>
        ))}
      </div>

      {/* 키캡 꾸미기 CTA */}
      <div className="kc-section">
        <button
          type="button"
          className="kc-custom-cta"
          onClick={() => setScreen("custom")}
        >
          🎨 키캡 꾸미기
        </button>
      </div>

      {/* 하단 고정 광고 배너 */}
      <div className="kc-footer">
        <BannerAd />
      </div>
    </div>
  );
}

export default App;
