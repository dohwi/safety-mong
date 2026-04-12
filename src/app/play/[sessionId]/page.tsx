"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/hooks/use-socket";
import { useQuiz } from "@/hooks/use-quiz";
import { useSessionBgm } from "@/hooks/use-session-bgm";
import { getCookie } from "@/lib/cookie";
import { WaitingRoom } from "@/components/student/waiting-room";
import { QuestionCard } from "@/components/student/question-card";
import { FeedbackOverlay } from "@/components/student/feedback-overlay";
import { FloatingLabShapes } from "@/components/floating-lab-shapes";
import { QuizComplete } from "@/components/student/quiz-complete";
import { use } from "react";

function PlayContent({ sessionId }: { sessionId: number }) {
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") ?? "";
  const reconnectTokenFromQuery = searchParams.get("reconnectToken");

  const { socket } = useSocket();
  const { state, submitAnswer } = useQuiz(socket, sessionId);
  useSessionBgm(state.phase);
  const [participantCount, setParticipantCount] = useState(0);
  const [targetParticipantCount, setTargetParticipantCount] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const reconnectToken = reconnectTokenFromQuery || getCookie(`reconnect_${sessionId}`);
    if (reconnectToken) {
      document.cookie = `reconnect_${sessionId}=${reconnectToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    }

    socket.emit("session:join", {
      sessionId,
      nickname,
      reconnectToken: reconnectToken || undefined,
    });

    socket.on("session:error", (data) => {
      setJoinError(data.message);
    });

    socket.on("participant:joined", (data) => {
      setParticipantCount(data.participantCount);
      if (data.targetParticipantCount !== undefined) setTargetParticipantCount(data.targetParticipantCount);
    });

    return () => {
      socket.off("session:error");
      socket.off("participant:joined");
    };
  }, [socket, sessionId, nickname, reconnectTokenFromQuery]);

  if (joinError) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto w-full max-w-md px-4 py-6 text-center">
          <div className="mt-16 rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-4 text-[#EF4444]">
            <p className="font-semibold">참여 오류</p>
            <p className="mt-1 text-sm">{joinError}</p>
          </div>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-[#4F7CFF] px-6 py-2 text-white hover:bg-[#6B91FF] transition-all duration-200">홈으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg lg:max-w-2xl xl:max-w-3xl">
          {nickname && (
            <p className="mb-6 text-center text-sm font-medium text-[#9CA3AF] bg-white/50 backdrop-blur-sm py-1.5 px-4 rounded-full w-fit mx-auto shadow-sm ring-1 ring-black/[0.03]">
              {nickname}으로 참여 중
            </p>
          )}

          <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.05]">
            {state.phase === "waiting" && (
              <WaitingRoom participantCount={participantCount} targetParticipantCount={targetParticipantCount} />
            )}

            {state.phase === "active" && state.currentQuestion && (
              <div className="space-y-8">
                <QuestionCard
                  question={state.currentQuestion}
                  selectedIndex={state.selectedIndex}
                  remainingSeconds={state.remainingSeconds}
                  onSubmit={(idx) => submitAnswer(state.currentQuestion!.index, idx)}
                />
                <FeedbackOverlay feedback={state.feedback} isTimeUp={false} />
              </div>
            )}

            {state.phase === "intermission" && (
              <div className="space-y-10 py-6 sm:py-10">
                <div className="relative flex flex-col items-center text-center space-y-6">
                  {/* 애니메이션 요소들 */}
                  <div className="relative">
                    <FloatingLabShapes count={5} />
                  </div>

                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
                      다음 문제 준비중!
                    </h3>
                    <p className="text-[#6B7280] font-medium leading-relaxed">
                      실험몽이 다음 문제를 정성껏 준비하고 있어요.<br className="hidden sm:block" />
                      방금 본 해설을 복습하며 기다려볼까요?
                    </p>
                  </div>

                  <div className="w-48 h-1.5 bg-[#F1F3F8] rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-[#4F7CFF] via-[#7C5CFF] to-[#4F7CFF] rounded-full animate-loading-bar" />
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#4F7CFF]/10 to-[#7C5CFF]/10 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-500" />
                  <div className="relative">
                    <FeedbackOverlay feedback={state.feedback} isTimeUp={state.isTimeUp} />
                  </div>
                </div>
              </div>
            )}

            {state.phase === "completed" && (
              <QuizComplete correctCount={state.correctCount} totalCount={state.totalCount} reviewItems={state.reviewItems} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId: sessionIdStr } = use(params);
  const sessionId = parseInt(sessionIdStr, 10);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#9CA3AF]">로딩 중...</p>
      </div>
    }>
      <PlayContent sessionId={sessionId} />
    </Suspense>
  );
}


