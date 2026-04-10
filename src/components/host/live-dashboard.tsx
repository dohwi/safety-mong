"use client";

import { useSocket } from "@/hooks/use-socket";
import { useHostDashboard } from "@/hooks/use-host-dashboard";
import { SessionControls } from "./session-controls";
import { ParticipantList } from "./participant-list";
import { QuestionStatsDisplay } from "./question-stats";
import { QRCodeSVG } from "qrcode.react";

interface LiveDashboardProps {
  sessionId: number;
  sessionCode: string;
  quizBoxTitle: string;
  totalQuestions: number;
  qrUrl: string;
  authToken: string;
}

export function LiveDashboard({
  sessionId,
  sessionCode,
  quizBoxTitle,
  totalQuestions,
  qrUrl,
  authToken,
}: LiveDashboardProps) {
  const { socket } = useSocket();
  const { state, startSession, skipQuestion, endSession } = useHostDashboard(socket, sessionId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#222222]">{quizBoxTitle}</h1>
          <p className="text-sm text-[#6a6a6a]">세션 코드: {sessionCode}</p>
        </div>
        <SessionControls
          phase={state.phase}
          onStart={startSession}
          onSkip={skipQuestion}
          onEnd={endSession}
        />
      </div>

      {state.phase === "waiting" && (
        <div className="flex flex-col items-center py-8">
          <div className="p-4 bg-white border-2 border-[#3b82f6] rounded-2xl">
            <QRCodeSVG value={qrUrl} size={200} />
          </div>
          <p className="mt-3 text-sm text-[#6a6a6a]">{qrUrl}</p>
        </div>
      )}

      {state.phase === "active" && (
        <div className="text-center py-4">
          <p className="text-3xl font-bold text-[#3b82f6]">{state.remainingSeconds}s</p>
          <p className="text-sm text-[#6a6a6a]">문제 {state.currentQuestionIndex + 1}/{totalQuestions}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParticipantList participants={state.participants} responseCount={state.responseCount} />
        {state.questionStats && (
          <QuestionStatsDisplay stats={state.questionStats} totalQuestions={totalQuestions} />
        )}
      </div>

      {state.phase === "completed" && (
        <div className="text-center py-8">
          <p className="text-xl font-semibold text-[#222222]">세션이 종료되었습니다</p>
        </div>
      )}
    </div>
  );
}
