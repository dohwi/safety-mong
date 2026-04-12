"use client";

import { useRef, useEffect } from "react";

export function computeRemaining(q: { startedAt: number; durationMs: number; serverNow?: number }): number {
  const offset = q.serverNow ? q.serverNow - Date.now() : 0;
  const serverNow = Date.now() + offset;
  const remaining = q.startedAt + q.durationMs - serverNow;
  return Math.max(0, Math.ceil(remaining / 1000));
}

export function useCountdown(onTick: (seconds: number) => void) {
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionMetaRef = useRef<{ startedAt: number; durationMs: number; offset: number } | null>(null);

  function startLocalCountdown(meta: { startedAt: number; durationMs: number; serverNow?: number }) {
    const offset = meta.serverNow ? meta.serverNow - Date.now() : 0;
    questionMetaRef.current = { startedAt: meta.startedAt, durationMs: meta.durationMs, offset };
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      if (!questionMetaRef.current) return;
      const { startedAt, durationMs, offset } = questionMetaRef.current;
      const remaining = startedAt + durationMs - (Date.now() + offset);
      const seconds = Math.max(0, Math.ceil(remaining / 1000));
      onTick(seconds);
    }, 250);
  }

  function stopLocalCountdown() {
    questionMetaRef.current = null;
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return { startLocalCountdown, stopLocalCountdown, isActive: () => questionMetaRef.current !== null };
}
