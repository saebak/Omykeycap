import { useCallback, useEffect, useRef, useState } from "react";
import type { HapticType } from "../lib/haptics";
import {
  EVER_TAPPED_STORAGE_KEY,
  loadFlag,
  loadSeen,
  loadTotalTaps,
  loadUnlocked,
  persistFlag,
  persistSeen,
  persistTotalTaps,
  persistUnlocked,
} from "../lib/storage";
import { SWITCHES, SWITCH_ORDER, type SwitchKey } from "../lib/switches";
import { useStateRef } from "./useStateRef";

// 이 시간(ms) 안에 이어서 누르면 콤보가 이어져요.
const COMBO_WINDOW_MS = 800;

interface UseUnlockSystemOptions {
  // 축 해금/콤보 진동은 설정(소리·진동)에 관심 없이 그냥 울리면 되도록,
  // "켜져 있으면 울리는" 함수만 주입받아요.
  triggerHaptic: (type: HapticType) => void;
}

/* ------------------------------------------------------------------ *
 * 해금/콤보/누적 타수 시스템
 * · 타건마다 누적 타수를 세고, 임계값을 넘으면 축을 해금해요.
 * · 짧은 간격으로 이어치면 콤보가 올라가요.
 * · 누적 타수·해금 목록·열람 목록은 저장돼서 재접속해도 유지돼요.
 * ------------------------------------------------------------------ */
export function useUnlockSystem({ triggerHaptic }: UseUnlockSystemOptions) {
  // 누적 타건 수 (해금 미션용) — 화면엔 숫자로 표시하지 않고 콤보/해금에만 사용해요.
  const [totalTaps, totalTapsRef, setTotalTaps] = useStateRef(0);
  const totalPersistTimer = useRef<number | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<SwitchKey | null>(null);
  const unlockToastTimer = useRef<number | null>(null);

  // 해금한 축 목록 (한 번 해금하면 계속 사용 가능 — 저장돼서 재접속해도 유지)
  const [unlocked, unlockedRef, setUnlocked] = useStateRef<Set<SwitchKey>>(
    () => new Set(),
  );

  // 이미 확인한 축(갓 해금된 축 NEW 표시용)
  const [seen, seenRef, setSeen] = useStateRef<Set<SwitchKey>>(() => new Set());

  // 최초 탭 유도
  const [everTapped, everTappedRef, setEverTapped] = useStateRef(true);

  // 콤보
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  const lastTapAt = useRef(0);
  const comboResetTimer = useRef<number | null>(null);

  // 저장했던 누적 타수 · 해금/열람 목록 불러오기 (접속할 때마다 유지)
  useEffect(() => {
    let alive = true;
    void loadFlag(EVER_TAPPED_STORAGE_KEY, false).then((v) => {
      if (alive) setEverTapped(v);
    });
    void loadSeen().then((keys) => {
      if (alive) setSeen(new Set<SwitchKey>(keys));
    });
    void Promise.all([loadTotalTaps(), loadUnlocked()]).then(([n, keys]) => {
      if (!alive) return;
      setTotalTaps(n);
      // 저장된 해금 목록 + 누적 타수가 이미 임계값을 넘은 축을 합쳐요(자기 복구).
      const set = new Set<SwitchKey>(keys);
      let changed = false;
      for (const k of SWITCH_ORDER) {
        const at = SWITCHES[k].unlockAt;
        if (at > 0 && n >= at && !set.has(k)) {
          set.add(k);
          changed = true;
        }
      }
      setUnlocked(set);
      if (changed) persistUnlocked(Array.from(set));
    });
    return () => {
      alive = false;
    };
  }, [setEverTapped, setSeen, setTotalTaps, setUnlocked]);

  // 타이머 정리 & 종료 시 누적 타건 수 저장
  useEffect(() => {
    return () => {
      if (comboResetTimer.current != null) {
        window.clearTimeout(comboResetTimer.current);
      }
      if (unlockToastTimer.current != null) {
        window.clearTimeout(unlockToastTimer.current);
      }
      if (totalPersistTimer.current != null) {
        window.clearTimeout(totalPersistTimer.current);
      }
      // 언마운트 시점의 최신 누적 타수를 읽어야 해서 의도적으로 ref를 그대로 참조해요
      // (지역 변수로 복사하면 마운트 시점 값에 고정돼 버려요).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      persistTotalTaps(totalTapsRef.current);
    };
  }, [totalTapsRef]);

  // 누적 타건 수 저장은 잦은 쓰기를 피해 잠깐 모아서 처리해요.
  const scheduleTotalPersist = useCallback(() => {
    if (totalPersistTimer.current != null) {
      window.clearTimeout(totalPersistTimer.current);
    }
    totalPersistTimer.current = window.setTimeout(() => {
      persistTotalTaps(totalTapsRef.current);
    }, 1200);
  }, [totalTapsRef]);

  // 앱이 백그라운드로 가거나 닫힐 때 누적 타수를 즉시 저장해요 (해금 유지 보장)
  useEffect(() => {
    const flush = () => persistTotalTaps(totalTapsRef.current);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [totalTapsRef]);

  // 해금됐지만 아직 안 본 축을 "확인함"으로 표시해요(NEW 배지 제거용).
  const markSeen = useCallback(
    (key: SwitchKey) => {
      if (seenRef.current.has(key)) return;
      const next = new Set(seenRef.current);
      next.add(key);
      persistSeen(Array.from(next));
      setSeen(next);
    },
    [seenRef, setSeen],
  );

  // 한 번의 타건 = 누적 +1 + 콤보 + 진동 + 해금 체크
  const registerTap = useCallback(() => {
    // ⚡ 누르자마자 가장 먼저 진동을 쏴서 지연을 최소화해요 (매 타건).
    triggerHaptic("tap");

    // 최초 탭이면 유도 문구를 숨기고 기록해요.
    if (!everTappedRef.current) {
      setEverTapped(true);
      persistFlag(EVER_TAPPED_STORAGE_KEY, true);
    }

    // 누적 타건 수 갱신 (해금 미션용)
    const prevTotal = totalTapsRef.current;
    const newTotal = prevTotal + 1;
    setTotalTaps(newTotal);
    scheduleTotalPersist();

    // 이번 타건으로 "처음" 해금된 축이 있는지 확인 (이미 해금된 축은 축하 안 함)
    for (const key of SWITCH_ORDER) {
      const at = SWITCHES[key].unlockAt;
      const crossed = at > 0 && prevTotal < at && newTotal >= at;
      if (crossed && !unlockedRef.current.has(key)) {
        triggerHaptic("confetti"); // 해금 축포
        const nextUnlocked = new Set(unlockedRef.current);
        nextUnlocked.add(key);
        persistUnlocked(Array.from(nextUnlocked)); // 해금 목록 즉시 저장
        setUnlocked(nextUnlocked);
        persistTotalTaps(newTotal);
        setJustUnlocked(key);
        if (unlockToastTimer.current != null) {
          window.clearTimeout(unlockToastTimer.current);
        }
        unlockToastTimer.current = window.setTimeout(
          () => setJustUnlocked(null),
          2600,
        );
        break;
      }
    }

    // 콤보 계산: 짧은 간격으로 이어치면 콤보가 오르고, 끊기면 리셋돼요.
    const now = Date.now();
    const within = now - lastTapAt.current < COMBO_WINDOW_MS;
    lastTapAt.current = now;
    const nextCombo = within ? comboRef.current + 1 : 1;
    comboRef.current = nextCombo;
    setCombo(nextCombo);
    if (comboResetTimer.current != null) {
      window.clearTimeout(comboResetTimer.current);
    }
    comboResetTimer.current = window.setTimeout(() => {
      comboRef.current = 0;
      setCombo(0);
    }, COMBO_WINDOW_MS);

    // 10콤보마다 리워드 진동 (가끔) — 기본 탭 진동은 맨 위에서 이미 울렸어요.
    if (nextCombo % 10 === 0) triggerHaptic("success");
  }, [
    triggerHaptic,
    everTappedRef,
    setEverTapped,
    totalTapsRef,
    setTotalTaps,
    scheduleTotalPersist,
    unlockedRef,
    setUnlocked,
  ]);

  const hasLocked = SWITCH_ORDER.some(
    (k) => SWITCHES[k].unlockAt > 0 && !unlocked.has(k),
  );

  return {
    totalTaps,
    unlocked,
    seen,
    everTapped,
    justUnlocked,
    combo,
    hasLocked,
    markSeen,
    registerTap,
  };
}
