"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrandMascot } from "@/components/brand-mascot";
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
    if (phase === "completed" && !loading && !didFetch.current) {
      didFetch.current = true;
      setLoading(true);
      fetchAnalysis();
    }
  }, [phase, aiAnalysis, analysis]);

  async function fetchAnalysis() {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.summary) {
        setAnalysis(data);
        setLoading(false);
        return;
      }
    } catch {}
    setTimeout(fetchAnalysis, 3000);
  }

  async function handleClose() {
    await fetch("/api/session/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    router.push("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BrandMascot variant="safety" size={56} className="shrink-0" />
          <div>
            <h1 className="text-2xl font-black text-[#222222] tracking-tight">{quizBoxTitle}</h1>
            <p className="text-sm text-[#6B7280] font-medium">안전몽 분석 리포트</p>
          </div>
        </div>
        {analysis && (
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-[#222222] text-white text-sm font-bold rounded-xl hover:bg-black transition-all duration-200 active:scale-[0.98] shadow-lg shadow-black/10"
          >
            세션 마감
          </button>
        )}
      </div>

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

          <QuestionBreakdown breakdowns={analysis.questionBreakdowns} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MisconceptionSummary analysis={analysis} />
            <EducationSuggestions recommendations={analysis.recommendations} />
          </div>
        </div>
      )}
    </div>
  );
}
