import { SWITCHES, type SwitchKey } from "./switches";

/* ------------------------------------------------------------------ *
 * Web Audio — 축별로 다른 타건음을 실시간 합성해요. (오디오 파일 불필요)
 * ------------------------------------------------------------------ */
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (audioCtx == null) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function makeNoise(ctx: AudioContext, duration: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playSound(type: SwitchKey, volume = 1) {
  if (volume <= 0) return;
  // Web Audio는 이벤트 핸들러 안에서 실행되기 때문에 여기서 던지면 ErrorBoundary가
  // 못 잡아요(렌더링 중 오류만 잡아요). AudioContext 생성 제한 등으로 실패해도
  // 타건 처리(콤보/해금/이펙트)는 계속되도록 조용히 무시해요.
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.95 * volume;
    master.connect(ctx.destination);

    const wobble = 0.96 + Math.random() * 0.08;

    const { body, click } = SWITCHES[type];
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(body.freq * wobble, t);
    osc.frequency.exponentialRampToValueAtTime(
      body.freq * 0.6,
      t + body.decay,
    );
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(body.gain, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + body.decay);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = body.lp;
    osc.connect(bodyGain).connect(lowpass).connect(master);
    osc.start(t);
    osc.stop(t + body.decay + 0.02);

    if (click != null) {
      const noise = ctx.createBufferSource();
      noise.buffer = makeNoise(ctx, click.dur);
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = click.hp;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(click.gain, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + click.dur);
      noise.connect(highpass).connect(clickGain).connect(master);
      noise.start(t);
      noise.stop(t + click.dur + 0.005);
    }
  } catch (error) {
    console.warn("[sound] 타건음 재생에 실패했어요:", error);
  }
}
