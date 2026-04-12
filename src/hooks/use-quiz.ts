"use client";

import { useState, useCallback, useEffect } from "react";
import type { QuestionBroadcast, AnswerFeedback, QuestionReviewItem, SessionPhase, TypedSocket } from "@/lib/socket/types";
import { useCountdown, computeRemaining } from "@/hooks/use-countdown";

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

  const { startLocalCountdown, stopLocalCountdown, isActive: isCountdownActive } = useCountdown(
    (seconds) => setState((prev) => ({ ...prev, remainingSeconds: seconds }))
  );

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
      if (!isCountdownActive() && Number.isFinite(data.remainingSeconds) && data.remainingSeconds > 0) {
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
