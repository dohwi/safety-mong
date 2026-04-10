"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { QuestionBroadcast, AnswerFeedback, SessionPhase } from "@/lib/socket/types";
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
  });

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("question:start", (data: QuestionBroadcast) => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setState((prev) => ({
        ...prev,
        phase: "active",
        currentQuestion: data,
        feedback: null,
        isTimeUp: false,
        selectedIndex: null,
      }));
    });

    socket.on("answer:feedback", (data: AnswerFeedback) => {
      setState((prev) => ({
        ...prev,
        feedback: data,
        correctCount: prev.correctCount + (data.isCorrect ? 1 : 0),
      }));
    });

    socket.on("question:end", () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setState((prev) => {
        if (!prev.feedback) {
          return { ...prev, isTimeUp: true, phase: "intermission" };
        }
        return { ...prev, phase: "intermission" };
      });
    });

    socket.on("session:complete", () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setState((prev) => ({ ...prev, phase: "completed" }));
    });

    return () => {
      socket.off("question:start");
      socket.off("answer:feedback");
      socket.off("question:end");
      socket.off("session:complete");
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [socket]);

  const submitAnswer = useCallback(
    (questionIndex: number, selectedIndex: number) => {
      if (!socket || state.selectedIndex !== null) return;
      setState((prev) => ({ ...prev, selectedIndex }));
      state.totalCount;
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
