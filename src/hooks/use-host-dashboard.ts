"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SessionPhase, LiveParticipant, QuestionStats, QuestionBroadcast } from "@/lib/socket/types";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/lib/socket/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface HostState {
  phase: SessionPhase;
  currentQuestionIndex: number;
  currentQuestionText: string;
  currentQuestionOptions: string[];
  participants: LiveParticipant[];
  responseCount: number;
  questionStats: QuestionStats | null;
  allQuestionStats: QuestionStats[];
  correctCount: number;
  remainingSeconds: number;
  targetParticipantCount: number | null;
  currentQuestion: QuestionBroadcast | null;
}

function computeRemaining(q: { startedAt: number; durationMs: number; serverNow?: number }): number {
  const offset = q.serverNow ? q.serverNow - Date.now() : 0;
  const serverNow = Date.now() + offset;
  const remaining = q.startedAt + q.durationMs - serverNow;
  return Math.max(0, Math.ceil(remaining / 1000));
}

export function useHostDashboard(socket: TypedSocket | null, sessionId: number) {
  const [state, setState] = useState<HostState>({
    phase: "waiting",
    currentQuestionIndex: 0,
    currentQuestionText: "",
    currentQuestionOptions: [],
    participants: [],
    responseCount: 0,
    questionStats: null,
    allQuestionStats: [],
    correctCount: 0,
    remainingSeconds: 0,
    targetParticipantCount: null,
    currentQuestion: null,
  });

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
      setState((prev) => ({ ...prev, remainingSeconds: seconds }));
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
    if (!socket) return;

    socket.emit("session:host", { sessionId });

    socket.on("session:state", (data) => {
      const allQuestionStats = data.allQuestionStats ?? [];
      const currentStats = allQuestionStats.find((stats) => stats.questionIndex === data.currentQuestionIndex) ?? null;

      if (data.phase === "active" && data.currentQuestion) {
        const initial = computeRemaining(data.currentQuestion);
        startLocalCountdown({
          startedAt: data.currentQuestion.startedAt,
          durationMs: data.currentQuestion.durationMs,
          serverNow: data.currentQuestion.serverNow,
        });
        setState((prev) => ({
          ...prev,
          phase: data.phase,
          currentQuestionIndex: data.currentQuestionIndex,
          participants: data.participants,
          targetParticipantCount: data.targetParticipantCount,
          currentQuestion: data.currentQuestion,
          currentQuestionText: data.currentQuestion!.text,
          currentQuestionOptions: data.currentQuestion!.options,
          responseCount: data.responseCount,
          allQuestionStats,
          questionStats: currentStats,
          correctCount: currentStats?.correctCount ?? prev.correctCount,
          remainingSeconds: initial,
        }));
      } else {
        stopLocalCountdown();
        setState((prev) => ({
          ...prev,
          phase: data.phase,
          currentQuestionIndex: data.currentQuestionIndex,
          participants: data.participants,
          targetParticipantCount: data.targetParticipantCount,
          currentQuestion: data.currentQuestion,
          currentQuestionText: data.currentQuestion?.text ?? prev.currentQuestionText,
          currentQuestionOptions: data.currentQuestion?.options ?? prev.currentQuestionOptions,
          responseCount: data.responseCount,
          allQuestionStats,
          questionStats: currentStats,
          correctCount: currentStats?.correctCount ?? prev.correctCount,
          remainingSeconds: data.remainingSeconds ?? 0,
        }));
      }
    });

    socket.on("participant:joined", (data) => {
      setState((prev) => ({
        ...prev,
        targetParticipantCount: data.targetParticipantCount,
        participants: prev.participants.some((participant) => participant.nickname === data.nickname)
          ? prev.participants
          : [...prev.participants, { id: prev.participants.length + 1, nickname: data.nickname, hasAnswered: false }],
      }));
    });

    socket.on("question:start", (data) => {
      const initial = computeRemaining(data);
      startLocalCountdown({ startedAt: data.startedAt, durationMs: data.durationMs, serverNow: data.serverNow });
      setState((prev) => ({
        ...prev,
        phase: "active",
        currentQuestionIndex: data.index,
        currentQuestionText: data.text,
        currentQuestionOptions: data.options,
        currentQuestion: data,
        responseCount: 0,
        questionStats: null,
        correctCount: 0,
        remainingSeconds: initial,
      }));
    });

    socket.on("question:timer", () => {
    });

    socket.on("answer:count", (data) => {
      setState((prev) => ({ ...prev, responseCount: data.responseCount }));
    });

    socket.on("question:stats", (data) => {
      setState((prev) => {
        const existing = prev.allQuestionStats.find((s) => s.questionIndex === data.questionIndex);
        const updated = existing
          ? prev.allQuestionStats.map((s) => (s.questionIndex === data.questionIndex ? data : s))
          : [...prev.allQuestionStats, data];
        return {
          ...prev,
          questionStats: data,
          correctCount: data.correctCount,
          allQuestionStats: updated,
        };
      });
    });

    socket.on("question:end", () => {
      stopLocalCountdown();
      setState((prev) => ({ ...prev, phase: "intermission", currentQuestion: null, remainingSeconds: 0 }));
    });

    socket.on("session:complete", () => {
      stopLocalCountdown();
      setState((prev) => ({ ...prev, phase: "completed", currentQuestion: null, remainingSeconds: 0 }));
    });

    return () => {
      socket.off("session:state");
      socket.off("participant:joined");
      socket.off("question:start");
      socket.off("question:timer");
      socket.off("answer:count");
      socket.off("question:stats");
      socket.off("question:end");
      socket.off("session:complete");
      stopLocalCountdown();
    };
  }, [socket, sessionId]);

  const startSession = useCallback(() => {
    socket?.emit("session:start", { sessionId });
  }, [socket, sessionId]);

  const skipQuestion = useCallback(() => {
    socket?.emit("session:skip", { sessionId });
  }, [socket, sessionId]);

  const endSession = useCallback(() => {
    socket?.emit("session:end", { sessionId });
  }, [socket, sessionId]);

  return { state, startSession, skipQuestion, endSession };
}
