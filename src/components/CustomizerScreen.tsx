import { useMemo, useState, type CSSProperties } from "react";
import { BannerAd } from "./BannerAd";
import { CapFace } from "./CapFace";
import { KeycapUnit } from "./KeycapUnit";
import {
  CAP_FINISHES,
  DEFAULT_CAP,
  capFaces,
  type CapStyle,
} from "../lib/capStyle";
import { KEYCAP_COLORS, readableText } from "../lib/color";
import { FACE_BY_KEY, FACE_DESIGNS } from "../lib/faceDesigns";
import { useDragScroll } from "../hooks/useDragScroll";
import { LAYOUTS, LETTERS, type LayoutKey } from "../lib/keycapLayout";
import type { Preset } from "../lib/storage";
import { STICKER_CATEGORIES } from "../lib/stickers";
import type { SwitchSpec } from "../lib/switches";

/* ------------------------------------------------------------------ *
 * 키캡 꾸미기 화면 — 색상 + 캐릭터/스티커로 키캡을 꾸미고 저장해요.
 * ------------------------------------------------------------------ */
interface CustomizerProps {
  accentVars: CSSProperties;
  spec: SwitchSpec;
  cols: number;
  rows: number;
  keyCount: number;
  labels: string[];
  initialCaps: CapStyle[];
  presets: Preset[];
  onAddPreset: (caps: CapStyle[]) => void;
  onDeletePreset: (id: string) => void;
  onCancel: () => void;
  onSave: (caps: CapStyle[]) => void;
}

function PresetThumb({
  caps,
  layout,
}: {
  caps: CapStyle[];
  layout: LayoutKey;
}) {
  const { cols, rows } = LAYOUTS[layout];
  const count = cols * rows;
  return (
    <div
      className="kc-thumb"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {caps.slice(0, count).map((c, i) => {
        const labelColor =
          c.finish === "holo" || c.finish === "metal"
            ? "#2b2f36"
            : readableText(c.color);
        // 얼굴은 대표 이모지로, 그 외엔 직접 입력 글자/이모지/기본 글자
        const content =
          c.face != null
            ? (FACE_BY_KEY[c.face]?.emoji ?? "")
            : c.sticker == null
              ? c.text != null && c.text !== ""
                ? c.text
                : LETTERS[i]
              : c.sticker;
        const big = c.face != null || (c.sticker != null && c.sticker !== "");
        return (
          <span
            key={i}
            className="kc-thumb-cap"
            style={{ background: capFaces(c.color, c.finish).top }}
          >
            <span
              className={big ? "kc-thumb-emoji" : "kc-thumb-label"}
              style={{ color: labelColor }}
            >
              {content}
            </span>
          </span>
        );
      })}
    </div>
  );
}

type EditTab = "color" | "finish" | "char" | "sticker" | "preset";
const EDIT_TABS: { key: EditTab; label: string }[] = [
  { key: "color", label: "색상" },
  { key: "finish", label: "마감" },
  { key: "char", label: "캐릭터" },
  { key: "sticker", label: "글자" },
  { key: "preset", label: "프리셋" },
];

export function CustomizerScreen({
  accentVars,
  spec,
  cols,
  rows,
  keyCount,
  labels,
  initialCaps,
  presets,
  onAddPreset,
  onDeletePreset,
  onCancel,
  onSave,
}: CustomizerProps) {
  const [draft, setDraft] = useState<CapStyle[]>(() =>
    initialCaps.map((c) => ({ ...c })),
  );
  const [selected, setSelected] = useState(0);
  const [applyAll, setApplyAll] = useState(false);
  const [category, setCategory] = useState(STICKER_CATEGORIES[0].key);
  const [tab, setTab] = useState<EditTab>("color");

  const noPressed = useMemo(() => new Set<string>(), []);
  const current = draft[selected] ?? DEFAULT_CAP;
  const activeCategory =
    STICKER_CATEGORIES.find((c) => c.key === category) ?? STICKER_CATEGORIES[0];

  // 가로 목록 드래그 스크롤
  const presetScrollRef = useDragScroll<HTMLDivElement>();
  const finishScrollRef = useDragScroll<HTMLDivElement>();
  const charScrollRef = useDragScroll<HTMLDivElement>();

  const patch = (change: Partial<CapStyle>) => {
    setDraft((prev) =>
      prev.map((c, i) =>
        applyAll || i === selected ? { ...c, ...change } : c,
      ),
    );
  };

  const selectKey = (id: string) => {
    const idx = Number(id.slice(1));
    if (idx < keyCount) setSelected(idx);
  };

  return (
    <div className="kc-editor" style={accentVars}>
      <div className="kc-topbar">
        <button type="button" className="kc-topbar-btn" onClick={onCancel}>
          취소
        </button>
        <span className="kc-topbar-title">키캡 꾸미기</span>
        <button
          type="button"
          className="kc-topbar-btn kc-topbar-save"
          onClick={() => onSave(draft)}
        >
          저장
        </button>
      </div>

      {/* 실시간 3D 미리보기 */}
      <div className="kc-play kc-play--edit">
        <KeycapUnit
          cols={cols}
          rows={rows}
          spec={spec}
          caps={draft}
          pressed={noPressed}
          labels={labels}
          selectedId={`K${selected}`}
          onKeyDown={(id) => selectKey(id)}
          onKeyUp={() => {}}
        />
        <div className="kc-hint">
          ✨ 키캡을 눌러 선택하고 아래에서 꾸며보세요
        </div>
      </div>

      {/* 적용 대상 (항상 보임) */}
      <div className="kc-apply kc-apply--bar">
        <button
          type="button"
          className={"kc-apply-btn" + (!applyAll ? " kc-apply-on" : "")}
          onClick={() => setApplyAll(false)}
        >
          선택한 키 ({labels[selected] ?? selected + 1})
        </button>
        <button
          type="button"
          className={"kc-apply-btn" + (applyAll ? " kc-apply-on" : "")}
          onClick={() => setApplyAll(true)}
        >
          전체 적용
        </button>
      </div>

      {/* 옵션 탭 */}
      <div className="kc-edit-tabs">
        {EDIT_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            className={"kc-edit-tab" + (tab === t.key ? " kc-edit-tab-on" : "")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 스크롤 영역: 활성 탭 내용 */}
      <div className="kc-edit-body">
        {tab === "color" && (
          <div className="kc-color-grid">
            {KEYCAP_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`색상 ${color}`}
                className={
                  "kc-swatch" + (current.color === color ? " kc-swatch-on" : "")
                }
                style={{ background: color }}
                onClick={() => patch({ color })}
              />
            ))}
          </div>
        )}

        {tab === "finish" && (
          <div className="kc-finish-row" ref={finishScrollRef}>
            {CAP_FINISHES.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={current.finish === f.key}
                className={
                  "kc-finish" +
                  (current.finish === f.key ? " kc-finish-on" : "")
                }
                onClick={() => patch({ finish: f.key })}
              >
                <span
                  className="kc-finish-swatch"
                  style={{ background: capFaces(current.color, f.key).top }}
                />
                <span className="kc-finish-label">{f.label}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "char" && (
          <div className="kc-char-grid" ref={charScrollRef}>
            {FACE_DESIGNS.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-pressed={current.face === d.key}
                className={
                  "kc-char" + (current.face === d.key ? " kc-char-on" : "")
                }
                onClick={() =>
                  patch({ face: d.key, sticker: "", color: d.color })
                }
              >
                <span
                  className="kc-char-cap"
                  style={{ background: capFaces(d.color, "solid").top }}
                >
                  <CapFace design={d.key} />
                </span>
                <span className="kc-char-label">{d.label}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "sticker" && (
          <>
            <div className="kc-topper-row">
              <button
                type="button"
                className={
                  "kc-topper kc-topper-text" +
                  (current.sticker == null && current.face == null
                    ? " kc-topper-on"
                    : "")
                }
                onClick={() => patch({ sticker: null, face: null })}
              >
                글자
              </button>
              <button
                type="button"
                className={
                  "kc-topper kc-topper-text" +
                  (current.sticker === "" && current.face == null
                    ? " kc-topper-on"
                    : "")
                }
                onClick={() => patch({ sticker: "", face: null })}
              >
                없음
              </button>
            </div>
            {current.sticker == null && current.face == null && (
              <input
                className="kc-text-input"
                type="text"
                inputMode="text"
                maxLength={3}
                value={current.text ?? ""}
                placeholder={`글자 직접 입력 (예: ${labels[selected] ?? "A"})`}
                onChange={(e) =>
                  patch({
                    text: e.target.value.slice(0, 3),
                    sticker: null,
                    face: null,
                  })
                }
              />
            )}
            <div className="kc-cats">
              {STICKER_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={
                    "kc-cat" + (category === c.key ? " kc-cat-on" : "")
                  }
                  onClick={() => setCategory(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="kc-sticker-grid">
              {activeCategory.items.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={
                    "kc-topper" +
                    (current.sticker === emoji && current.face == null
                      ? " kc-topper-on"
                      : "")
                  }
                  onClick={() => patch({ sticker: emoji, face: null })}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "preset" && (
          <>
            <div className="kc-presets" ref={presetScrollRef}>
              <button
                type="button"
                className="kc-preset-add"
                onClick={() => onAddPreset(draft)}
              >
                <span className="kc-preset-plus">＋</span>
                <span>현재 저장</span>
              </button>
              {presets.map((p) => (
                <div className="kc-preset" key={p.id}>
                  <button
                    type="button"
                    className="kc-preset-thumb"
                    aria-label="프리셋 불러오기"
                    onClick={() => setDraft(p.caps.map((c) => ({ ...c })))}
                  >
                    <PresetThumb caps={p.caps} layout={p.layout} />
                  </button>
                  <button
                    type="button"
                    className="kc-preset-del"
                    aria-label="프리셋 삭제"
                    onClick={() => onDeletePreset(p.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {presets.length === 0 && (
              <p className="kc-preset-empty">
                마음에 드는 조합을 <b>현재 저장</b>으로 보관해 두고 언제든
                불러오세요.
              </p>
            )}
          </>
        )}
      </div>

      {/* 하단 광고 배너 */}
      <div className="kc-footer">
        <BannerAd />
      </div>
    </div>
  );
}
