"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrandMascot } from "@/components/brand-mascot";
import type { AnalysisOutput } from "@/lib/ai/schemas";
import type { SessionPhase } from "@/lib/socket/types";
import { renderBoldText } from "@/lib/render-bold";

interface AnalysisViewProps {
  sessionId: number;
  quizBoxTitle: string;
  aiAnalysis: string | null;
  phase: SessionPhase;
}

export function AnalysisView({ sessionId, quizBoxTitle, aiAnalysis, phase }: AnalysisViewProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const pollStartedRef = useRef(false);

  useEffect(() => {
    if (aiAnalysis) {
      try { setAnalysis(JSON.parse(aiAnalysis)); } catch {}
      return;
    }
  }, [aiAnalysis]);

  useEffect(() => {
    if (analysis) return;
    if (aiAnalysis) return;
    if (pollStartedRef.current) return;

    pollStartedRef.current = true;
    setLoading(true);

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let dead = false;

    async function poll() {
      if (dead) return;
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!res.ok) throw new Error("fail");
        const data = await res.json();
        if (data.summary && !dead) {
          setAnalysis(data);
          setLoading(false);
          return;
        }
      } catch {}
      if (!dead) {
        timerId = setTimeout(poll, 2000);
      }
    }

    poll();

    return () => {
      dead = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [sessionId]);

  async function handleClose() {
    await fetch("/api/session/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    router.push("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="rounded-[28px] border border-[rgba(0,0,0,0.06)] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F9FB] text-[#6B7280] transition-all hover:bg-[#F1F3F8] hover:text-[#222222]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <BrandMascot variant="safety" size={36} className="shrink-0" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#222222]">{quizBoxTitle}</h1>
                <p className="text-xs font-medium text-[#9CA3AF]">실험 전 강조 포인트 분석</p>
              </div>
            </div>
          </div>
          {analysis && (phase === "completed" || phase === "analysis") && (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-[#222222] text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all"
            >
              세션 마감
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {!analysis && loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#4F7CFF]/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-3xl bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center rotate-3 animate-lab-float">
                <div className="w-10 h-10 border-4 border-[#4F7CFF]/20 border-t-[#4F7CFF] rounded-full animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-bold text-[#222222]">분석하고 있어요...</p>
              <p className="text-[#6B7280]">학생들이 어떤 안전수칙을 놓쳤는지 파악 중입니다.</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {analysis.overallCorrectRate != null && (
              <div className="flex items-center gap-4 px-1">
                <span className="text-sm font-bold text-[#6B7280]">평균 정답률</span>
                <span className="text-2xl font-black tabular-nums text-[#222222]">
                  {Math.round(analysis.overallCorrectRate * 100)}%
                </span>
                <div className="flex-1 h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4F7CFF] transition-all duration-700"
                    style={{ width: `${Math.round(analysis.overallCorrectRate * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              {analysis.questionBreakdowns.map((q) => {
                const needsEmphasis = q.correctRate < 0.6;
                return (
                  <div
                    key={q.questionIndex}
                    className={`rounded-[24px] border bg-white p-5 space-y-3 ${
                      needsEmphasis
                        ? "border-[rgba(239,68,68,0.2)]"
                        : "border-[rgba(0,0,0,0.06)]"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black text-white ${
                            needsEmphasis ? "bg-[#EF4444]" : "bg-[#4F7CFF]"
                          }`}>
                            {q.questionIndex + 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-sm font-bold text-[#222222] leading-relaxed">{q.questionText}</p>

                          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                            <span className="font-bold">정답률 <span className={`text-base font-black ${needsEmphasis ? "text-[#EF4444]" : "text-[#222222]"}`}>{Math.round(q.correctRate * 100)}%</span></span>
                            <span className="text-[rgba(0,0,0,0.15)]">|</span>
                            <span>정답: {q.correctOptionText}</span>
                            {q.topWrongOptionText && (
                              <>
                                <span className="text-[rgba(0,0,0,0.15)]">|</span>
                                <span>최다 오답: {q.topWrongOptionText}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {needsEmphasis && (
                        <div className="ml-12 rounded-xl bg-[#FEF2F2] border border-[rgba(239,68,68,0.15)] px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex items-center justify-center w-5 h-5 rounded bg-[#EF4444] text-white text-[10px] font-black shrink-0">!</span>
                            <div>
                              <p className="text-xs font-black text-[#EF4444] mb-1">실험 전 강조 필요</p>
                              <p className="text-sm text-[#4B5563] leading-relaxed">{renderBoldText(q.teachingTip)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
