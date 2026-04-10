"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionPhase, LiveParticipant, QuestionStats } from "@/lib/socket/types";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/lib/socket/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface HostState {
  phase: SessionPhase;
  currentQuestionIndex: number;
  participants: LiveParticipant[];
  responseCount: number;
  questionStats: QuestionStats | null;
  remainingSeconds: number;
}

export function useHostDashboard(socket: TypedSocket | null, sessionId: number) {
  const [state, setState] = useState<HostState>({
    phase: "waiting",
    currentQuestionIndex: 0,
    participants: [],
    responseCount: 0,
    questionStats: null,
    remainingSeconds: 0,
  });

  useEffect(() => {
    if (!socket) return;

    socket.emit("session:host", { sessionId });

    socket.on("session:state", (data) => {
      setState((prev) => ({
        ...prev,
        phase: data.phase,
        currentQuestionIndex: data.currentQuestionIndex,
        participants: data.participants,
      }));
    });

    socket.on("participant:joined", (data) => {
      setState((prev) => ({
        ...prev,
        participants: [
          ...prev.participants,
          { id: prev.participants.length + 1, nickname: data.nickname.split(" ")[0], hasAnswered: false },
        ],
      }));
    });

    socket.on("question:start", (data) => {
      setState((prev) => ({
        ...prev,
        phase: "active",
        currentQuestionIndex: data.index,
        responseCount: 0,
        questionStats: null,
        remainingSeconds: Math.ceil(data.durationMs / 1000),
      }));
    });

    socket.on("answer:count", (data) => {
      setState((prev) => ({ ...prev, responseCount: data.responseCount }));
    });

    socket.on("question:stats", (data) => {
      setState((prev) => ({ ...prev, questionStats: data }));
    });

    socket.on("question:end", () => {
      setState((prev) => ({ ...prev, phase: "intermission" }));
    });

    socket.on("session:complete", () => {
      setState((prev) => ({ ...prev, phase: "completed" }));
    });

    return () => {
      socket.off("session:state");
      socket.off("participant:joined");
      socket.off("question:start");
      socket.off("answer:count");
      socket.off("question:stats");
      socket.off("question:end");
      socket.off("session:complete");
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
