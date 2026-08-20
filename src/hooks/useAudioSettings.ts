import { useCallback, useEffect, useState } from "react";
import { haptic, type HapticType } from "../lib/haptics";
import { playSound } from "../lib/sound";
import {
  HAPTIC_STORAGE_KEY,
  loadFlag,
  loadMuted,
  persistFlag,
  persistMuted,
} from "../lib/storage";
import type { SwitchKey } from "../lib/switches";
import { useStateRef } from "./useStateRef";

/* ------------------------------------------------------------------ *
 * 소리(음소거)와 진동(햅틱) 설정을 관리해요.
 * 저장된 값을 불러오고, 토글하고, 다른 훅/컴포넌트가 설정을 매번
 * 신경 쓰지 않도록 "설정을 반영한" 재생 함수(playTap, triggerHaptic)를
 * 함께 내려줘요.
 * ------------------------------------------------------------------ */
export function useAudioSettings() {
  const [muted, setMuted] = useState(false);
  const [hapticOn, hapticOnRef, setHapticOn] = useStateRef(true);

  // 저장했던 소리/진동 설정 불러오기
  useEffect(() => {
    let alive = true;
    void loadMuted().then((m) => {
      if (alive) setMuted(m);
    });
    void loadFlag(HAPTIC_STORAGE_KEY, true).then((v) => {
      if (alive) setHapticOn(v);
    });
    return () => {
      alive = false;
    };
  }, [setMuted, setHapticOn]);

  // 햅틱이 켜져 있을 때만 진동을 울려요 — 호출부는 설정을 신경 쓰지 않아도 돼요.
  const triggerHaptic = useCallback(
    (type: HapticType) => {
      if (hapticOnRef.current) haptic(type);
    },
    [hapticOnRef],
  );

  // 음소거가 아닐 때만 타건음을 재생해요.
  const playTap = useCallback(
    (type: SwitchKey) => {
      if (!muted) playSound(type);
    },
    [muted],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      persistMuted(next);
      return next;
    });
    triggerHaptic("tap");
  }, [setMuted, triggerHaptic]);

  const toggleHaptic = useCallback(() => {
    setHapticOn((h) => {
      const next = !h;
      persistFlag(HAPTIC_STORAGE_KEY, next);
      if (next) haptic("tap"); // 켤 때 한 번 느껴볼 수 있게 (막 켠 시점이라 triggerHaptic 대신 직접 호출)
      return next;
    });
  }, [setHapticOn]);

  return {
    muted,
    hapticOn,
    hapticOnRef,
    toggleMute,
    toggleHaptic,
    triggerHaptic,
    playTap,
  };
}
