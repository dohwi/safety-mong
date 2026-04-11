"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrandMascot } from "@/components/brand-mascot";
import Link from "next/link";
import type { AnalysisOutput } from "@/lib/ai/schemas";
import { QuestionBreakdown } from "./analysis/question-breakdown";
import { MisconceptionSummary } from "./analysis/vulnerability-summary";
import { EducationSuggestions } from "./analysis/education-suggestions";

interface AnalysisViewProps {
  sessionId: number;
  quizBoxTitle: string;
  aiAnalysis: string | null;
  phase: string;
}

export function AnalysisView({ sessionId, quizBoxTitle, aiAnalysis, phase }: AnalysisViewProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const didFetch = useRef(false);

  useEffect(() => {
    if (analysis) return;
    if (aiAnalysis) {
      try { setAnalysis(JSON.parse(aiAnalysis)); } catch {}
      return;
    }
    if (phase !== "completed" || loading || didFetch.current) return;

    didFetch.current = true;
    setLoading(true);

    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!res.ok) throw new Error("fail");
        const data = await res.json();
        if (data.summary && !cancelled) {
          setAnalysis(data);
          setLoading(false);
          return;
        }
      } catch {}
      if (!cancelled) setTimeout(poll, 3000);
    }

    poll();
    return () => { cancelled = true; };
  }, [phase, aiAnalysis, analysis, loading, sessionId]);

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
      <div className="rounded-[28px] border border-[rgba(0,0,0,0.06)] bg-white p-5 sm:p-6 shadow-sm">
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
                <p className="text-xs font-medium text-[#9CA3AF]">AI 심층 분석 리포트</p>
              </div>
            </div>
          </div>
          {analysis && phase === "completed" && (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-[#222222] text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all"
            >
              세션 마감
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {!analysis && loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#4F7CFF]/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-3xl bg-white border border-[rgba(0,0,0,0.06)] shadow-xl flex items-center justify-center rotate-3 animate-lab-float">
                <div className="w-10 h-10 border-4 border-[#4F7CFF]/20 border-t-[#4F7CFF] rounded-full animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-bold text-[#222222]">분석하고 있어요...</p>
              <p className="text-[#6B7280]">학생들이 어떤 부분을 헷갈려했는지 파악 중입니다.</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {analysis.overallCorrectRate != null && (
              <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6B7280]">전체 평균 정답률</span>
                  <span className={`text-3xl font-black tabular-nums ${
                    analysis.overallCorrectRate >= 0.8 ? "text-[#22C55E]" : analysis.overallCorrectRate >= 0.6 ? "text-[#F59E0B]" : "text-[#EF4444]"
                  }`}>
                    {Math.round(analysis.overallCorrectRate * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F1F3F8] rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round(analysis.overallCorrectRate * 100)}%`,
                      backgroundColor: analysis.overallCorrectRate >= 0.8 ? "#22C55E" : analysis.overallCorrectRate >= 0.6 ? "#F59E0B" : "#EF4444",
                    }}
                  />
                </div>
              </div>
            )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EducationSuggestions recommendations={analysis.recommendations} />
            <MisconceptionSummary analysis={analysis} />
          </div>

          <QuestionBreakdown breakdowns={analysis.questionBreakdowns} />
        </div>
      )}
    </div>
    </div>
  );
}
