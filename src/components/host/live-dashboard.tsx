"use client";

import { useMemo } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useHostDashboard } from "@/hooks/use-host-dashboard";
import { SessionControls } from "./session-controls";
import { ParticipantList } from "./participant-list";
import { QuestionStatsDisplay } from "./question-stats";
import { QRCodeSVG } from "qrcode.react";
import { AnalysisView } from "../analysis-view";
import { NextQuestionOverlay } from "../quiz/next-question-overlay";

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
  const dynamicQrUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/join/${sessionCode}`;
    }
    return qrUrl;
  }, [sessionCode, qrUrl]);

  const { socket } = useSocket(authToken);
  const { state, startSession, skipQuestion, endSession } = useHostDashboard(socket, sessionId);
  const displaySeconds = Number.isFinite(state.remainingSeconds) ? Math.max(0, state.remainingSeconds) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#222222]">{quizBoxTitle}</h1>
          <p className="text-sm text-[#6B7280]">세션 코드: {sessionCode}</p>
        </div>
        <SessionControls
          phase={state.phase}
          onStart={startSession}
          onSkip={skipQuestion}
          onEnd={endSession}
        />
      </div>

      {state.phase === "waiting" && (
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="p-4 bg-white border-2 border-[rgba(79,124,255,0.4)] rounded-2xl shadow-sm qr-scan-wrap">
            <QRCodeSVG value={dynamicQrUrl} size={200} bgColor="#FFFFFF" fgColor="#222222" />
          </div>
          <p className="text-sm text-[#9CA3AF]">{dynamicQrUrl}</p>
          {state.targetParticipantCount && state.targetParticipantCount > 0 ? (
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">참여자</span>
                <span className="font-medium text-[#222222]">{state.participants.length}/{state.targetParticipantCount}명</span>
              </div>
              <div className="w-full bg-[#F1F3F8] rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    state.participants.length >= state.targetParticipantCount
                      ? "bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                      : "bg-[#4F7CFF] shadow-[0_0_8px_rgba(79,124,255,0.3)]"
                  }`}
                  style={{ width: `${Math.min(100, (state.participants.length / state.targetParticipantCount) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-center text-[#9CA3AF]">
                {state.participants.length >= state.targetParticipantCount
                  ? "전원 참여 완료! 퀴즈가 곧 시작됩니다"
                  : `모두 참여하면 자동으로 시작됩니다`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">현재 참여자: {state.participants.length}명 (수동 시작)</p>
          )}
        </div>
      )}

      {/* 퀴즈 시작 시 또는 대기 중 전원 참여 시 오버레이 표시 */}
      {state.phase === "waiting" && state.targetParticipantCount && state.participants.length >= state.targetParticipantCount && (
        <NextQuestionOverlay 
          correctCount={0} 
          totalParticipants={state.participants.length} 
          customTitle="퀴즈를 시작합니다!"
          customSubtitle="준비 되셨나요? 첫 번째 문제가 곧 나타납니다."
        />
      )}

      {state.phase === "active" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-[rgba(0,0,0,0.06)] shadow-sm">
            <div className={`relative flex items-center justify-center w-24 h-24 rounded-full border-4 transition-colors ${
              displaySeconds <= 5 ? "border-[#EF4444] animate-pulse" : "border-[#4F7CFF]"
            }`}>
              <span className={`text-3xl font-black tabular-nums ${displaySeconds <= 5 ? "text-[#EF4444]" : "text-[#4F7CFF]"}`}>
                {displaySeconds}
              </span>
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={276}
                  strokeDashoffset={276 - (276 * (displaySeconds / (state.currentQuestion?.durationMs ? state.currentQuestion.durationMs / 1000 : 30)))}
                  className={`transition-all duration-1000 ease-linear ${
                    displaySeconds <= 5 ? "text-[#EF4444]/20" : "text-[#4F7CFF]/10"
                  }`}
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-bold tracking-widest text-[#9CA3AF] uppercase">
              Question {state.currentQuestionIndex + 1} / {totalQuestions}
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[rgba(0,0,0,0.04)] space-y-6">
            <h2 className="text-2xl font-bold text-[#222222] leading-tight text-center">
              {state.currentQuestionText}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {state.currentQuestionOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8F9FB] border border-[rgba(0,0,0,0.04)]">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white text-xs font-black text-[#4F7CFF] shadow-sm shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-base font-medium text-[#4B5563]">{opt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-6 py-3 bg-[#4F7CFF]/5 rounded-full border border-[#4F7CFF]/10">
              <div className="flex -space-x-2">
                {[...Array(Math.min(3, state.responseCount))].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-[#4F7CFF] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  </div>
                ))}
              </div>
              <span className="text-sm font-bold text-[#4F7CFF]">
                현재 {state.responseCount}명 제출 완료
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF]">모든 학생이 제출하면 자동으로 종료됩니다</p>
          </div>
        </div>
      )}

      {state.phase === "intermission" && (
        <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 bg-[#4F7CFF]/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#4F7CFF] to-[#7C5CFF] flex items-center justify-center text-white shadow-xl rotate-6 animate-lab-float">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-[#222222]">결과 분석 중...</h2>
            <div className="flex items-center justify-center gap-4 text-[#6B7280] font-medium">
              <span>최종 정답 {state.correctCount}명</span>
              <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
              <span>참여 {state.participants.length}명</span>
            </div>
          </div>

          <div className="w-48 h-1.5 bg-[#F1F3F8] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#4F7CFF] to-[#7C5CFF] rounded-full w-1/3 animate-loading-bar"
            />
          </div>
        </div>
      )}

      {state.phase === "completed" && (
        <div className="animate-fade-in-up">
          <AnalysisView 
            sessionId={sessionId} 
            quizBoxTitle={quizBoxTitle} 
            aiAnalysis={null} 
            phase={state.phase} 
          />
        </div>
      )}

      {state.phase === "analysis" && (
        <div className="animate-fade-in-up">
          <AnalysisView 
            sessionId={sessionId} 
            quizBoxTitle={quizBoxTitle} 
            aiAnalysis={null}
            phase={state.phase}
          />
        </div>
      )}

      {state.phase !== "completed" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParticipantList participants={state.participants} responseCount={state.responseCount} />
          {state.phase === "waiting" && (
            <div className="border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 bg-white shadow-sm flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F1F3F8] flex items-center justify-center text-[#4F7CFF]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[#222222]">학생들에게 코드를 공유하세요</h3>
                <p className="text-sm text-[#6B7280]">상단 QR 코드를 스캔하거나<br/>{sessionCode}를 입력해 입장할 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {state.phase === "completed" && state.allQuestionStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <QuestionStatsDisplay stats={state.allQuestionStats} totalQuestions={totalQuestions} />
          <div className="border border-[rgba(0,0,0,0.08)] rounded-2xl p-5 bg-white shadow-sm">
            <h3 className="font-semibold text-[#222222] mb-3">문제별 종합 결과</h3>
            <div className="space-y-3">
              {state.allQuestionStats.map((qs) => {
                const rate = qs.totalParticipants > 0 ? Math.round((qs.correctCount / qs.totalParticipants) * 100) : 0;
                return (
                  <div key={qs.questionIndex} className="flex items-center justify-between py-2 border-b border-[rgba(0,0,0,0.06)] last:border-0">
                    <span className="text-sm text-[#222222]">문제 {qs.questionIndex + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#9CA3AF]">{qs.correctCount}/{qs.totalParticipants} 정답</span>
                      <span className="text-sm font-medium text-[#4F7CFF]">{rate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
