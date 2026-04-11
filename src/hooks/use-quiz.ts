"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { QuestionBroadcast, AnswerFeedback, QuestionReviewItem, SessionPhase } from "@/lib/socket/types";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/lib/socket/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface QuizState {
  phase: SessionPhase;
  currentQuestion: QuestionBroadcast | null;
  feedback: AnswerFeedback | null;
  isTimeUp: boolean;
  selectedIndex: number | null;
  totalCount: number;
  correctCount: number;
  reviewItems: QuestionReviewItem[];
  remainingSeconds: number;
}

function computeRemaining(q: { startedAt: number; durationMs: number; serverNow?: number }): number {
  const offset = q.serverNow ? q.serverNow - Date.now() : 0;
  const serverNow = Date.now() + offset;
  const remaining = q.startedAt + q.durationMs - serverNow;
  return Math.max(0, Math.ceil(remaining / 1000));
}

export function useQuiz(socket: TypedSocket | null, sessionId: number) {
  const [state, setState] = useState<QuizState>({
    phase: "waiting",
    currentQuestion: null,
    feedback: null,
    isTimeUp: false,
    selectedIndex: null,
    totalCount: 0,
    correctCount: 0,
    reviewItems: [],
    remainingSeconds: 0,
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

    socket.on("question:start", (data: QuestionBroadcast) => {
      const initial = computeRemaining(data);
      startLocalCountdown({ startedAt: data.startedAt, durationMs: data.durationMs, serverNow: data.serverNow });
      setState((prev) => ({
        ...prev,
        phase: "active",
        currentQuestion: data,
        feedback: null,
        isTimeUp: false,
        selectedIndex: null,
        totalCount: data.index + 1 > prev.totalCount ? data.index + 1 : prev.totalCount,
        remainingSeconds: initial,
      }));
    });

    socket.on("session:state", (data) => {
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
          currentQuestion: data.currentQuestion,
          isTimeUp: false,
          selectedIndex: prev.selectedIndex,
          totalCount: Math.max(prev.totalCount, data.currentQuestionIndex + 1),
          remainingSeconds: initial,
        }));
      } else {
        stopLocalCountdown();
        setState((prev) => ({
          ...prev,
          phase: data.phase,
          currentQuestion: data.currentQuestion,
          isTimeUp: false,
          selectedIndex: data.phase === "active" ? prev.selectedIndex : null,
          totalCount: Math.max(prev.totalCount, data.currentQuestionIndex + (data.currentQuestion ? 1 : 0)),
          remainingSeconds: data.remainingSeconds ?? 0,
        }));
      }
    });

    socket.on("question:timer", (data) => {
      if (!questionMetaRef.current && Number.isFinite(data.remainingSeconds) && data.remainingSeconds > 0) {
        setState((prev) => ({ ...prev, remainingSeconds: data.remainingSeconds }));
      }
    });

    socket.on("answer:feedback", (data: AnswerFeedback) => {
      setState((prev) => ({
        ...prev,
        feedback: data,
        correctCount: prev.correctCount + (data.isCorrect ? 1 : 0),
      }));
    });

    socket.on("question:end", (data) => {
      stopLocalCountdown();
      setState((prev) => {
        const currentQuestion = prev.currentQuestion;
        const alreadyRecorded = prev.reviewItems.some((item) => item.questionIndex === data.questionIndex);
        const reviewItems = currentQuestion && !alreadyRecorded
          ? [
              ...prev.reviewItems,
              {
                questionIndex: data.questionIndex,
                questionText: currentQuestion.text,
                options: currentQuestion.options,
                selectedIndex: prev.selectedIndex,
                correctIndex: data.correctIndex,
                explanation: data.explanation,
                isCorrect: prev.feedback?.isCorrect ?? false,
              },
            ]
          : prev.reviewItems;

        if (!prev.feedback) {
          return { ...prev, isTimeUp: true, phase: "intermission", reviewItems, remainingSeconds: 0 };
        }
        return { ...prev, phase: "intermission", reviewItems, remainingSeconds: 0 };
      });
    });

    socket.on("session:complete", () => {
      stopLocalCountdown();
      setState((prev) => ({ ...prev, phase: "completed", remainingSeconds: 0 }));
    });

    return () => {
      socket.off("question:start");
      socket.off("session:state");
      socket.off("question:timer");
      socket.off("answer:feedback");
      socket.off("question:end");
      socket.off("session:complete");
      stopLocalCountdown();
    };
  }, [socket]);

  const submitAnswer = useCallback(
    (questionIndex: number, selectedIndex: number) => {
      if (!socket || state.selectedIndex !== null) return;
      setState((prev) => ({ ...prev, selectedIndex }));
      socket.emit("answer:submit", {
        sessionId,
        questionIndex,
        selectedIndex,
        submittedAt: Date.now(),
      });
    },
    [socket, sessionId, state.selectedIndex]
  );

  return { state, submitAnswer };
}
