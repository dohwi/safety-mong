"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSocket } from "@/hooks/use-socket";
import { useQuiz } from "@/hooks/use-quiz";
import { WaitingRoom } from "@/components/student/waiting-room";
import { QuestionCard } from "@/components/student/question-card";
import { FeedbackOverlay } from "@/components/student/feedback-overlay";
import { QuizComplete } from "@/components/student/quiz-complete";
import { use } from "react";

export default function PlayPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId: sessionIdStr } = use(params);
  const sessionId = parseInt(sessionIdStr, 10);
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") ?? "";

  const { socket } = useSocket();
  const { state, submitAnswer } = useQuiz(socket, sessionId);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    socket.emit("session:join", { sessionId, nickname });

    socket.on("participant:joined", (data) => {
      setParticipantCount(data.participantCount);
    });

    return () => {
      socket.off("participant:joined");
    };
  }, [socket, sessionId, nickname]);

  useEffect(() => {
    if (!state.currentQuestion) return;

    const startedAt = state.currentQuestion.startedAt;
    const durationMs = state.currentQuestion.durationMs;

    const update = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setRemainingSeconds(remaining);
    };

    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, [state.currentQuestion]);

  return (
    <div className="min-h-screen bg-white px-4 py-6 max-w-md mx-auto">
      {state.phase === "waiting" && <WaitingRoom participantCount={participantCount} />}

      {state.phase === "active" && state.currentQuestion && (
        <>
          <QuestionCard
            question={state.currentQuestion}
            selectedIndex={state.selectedIndex}
            remainingSeconds={remainingSeconds}
            onSubmit={(idx) => submitAnswer(state.currentQuestion!.index, idx)}
          />
          <FeedbackOverlay feedback={state.feedback} isTimeUp={false} />
        </>
      )}

      {state.phase === "intermission" && (
        <div className="space-y-4">
          <p className="text-center text-[#6a6a6a]">다음 문제 준비 중...</p>
          <FeedbackOverlay feedback={state.feedback} isTimeUp={state.isTimeUp} />
        </div>
      )}

      {state.phase === "completed" && (
        <QuizComplete correctCount={state.correctCount} totalCount={state.totalCount || state.correctCount} />
      )}
    </div>
  );
}
