"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionPhase, LiveParticipant, QuestionStats, QuestionBroadcast, TypedSocket } from "@/lib/socket/types";
import { useCountdown, computeRemaining } from "@/hooks/use-countdown";

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
  aiAnalysis: string | null;
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
    aiAnalysis: null,
  });

  const { startLocalCountdown, stopLocalCountdown } = useCountdown(
    (seconds) => setState((prev) => ({ ...prev, remainingSeconds: seconds }))
  );

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
        participants: prev.participants.map((p) => ({ ...p, hasAnswered: false })),
      }));
    });

    socket.on("question:timer", () => {
    });

    socket.on("answer:count", (data) => {
      setState((prev) => ({
        ...prev,
        responseCount: data.responseCount,
        participants: data.participants ?? prev.participants,
      }));
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

    socket.on("session:analysis-ready", (data) => {
      if (data.sessionId === sessionId) {
        setState((prev) => ({ ...prev, phase: "analysis", aiAnalysis: data.analysis }));
      }
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
      socket.off("session:analysis-ready");
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
