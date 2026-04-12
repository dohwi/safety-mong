"use client";

import { useEffect, useRef, useCallback } from "react";
import type { SessionPhase } from "@/lib/socket/types";

const PLAYING_PHASES: Set<SessionPhase> = new Set(["active", "intermission"]);

export function useSessionBgm(phase: SessionPhase) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio("/bgm.mp3");
      a.loop = true;
      a.volume = 0.3;
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    const audio = getAudio();
    const shouldPlay = PLAYING_PHASES.has(phase);

    if (shouldPlay && !playingRef.current) {
      audio.play()
        .then(() => { playingRef.current = true; })
        .catch(() => {});
    } else if (!shouldPlay && playingRef.current) {
      audio.pause();
      playingRef.current = false;
    }
  }, [phase, getAudio]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        playingRef.current = false;
      }
    };
  }, []);
}
