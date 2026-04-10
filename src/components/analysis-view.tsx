"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisOutput } from "@/lib/ai/schemas";
import { VulnerabilitySummary } from "./analysis/vulnerability-summary";
import { EducationSuggestions } from "./analysis/education-suggestions";

interface AnalysisViewProps {
  sessionId: number;
  quizBoxTitle: string;
  aiAnalysis: string | null;
  phase: string;
}

export function AnalysisView({ sessionId, quizBoxTitle, aiAnalysis, phase }: AnalysisViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  let analysis: AnalysisOutput | null = null;
  if (aiAnalysis) {
    try {
      analysis = JSON.parse(aiAnalysis);
    } catch {
      analysis = null;
    }
  }

  async function runAnalysis() {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleClose() {
    await fetch("/api/session/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    router.push(`/quiz-boxes/${quizBoxTitle}/sessions`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#222222]">{quizBoxTitle} - 분석</h1>
        {phase === "analysis" && (
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#1d4ed8]"
          >
            마감
          </button>
        )}
      </div>

      {!analysis && phase === "completed" && (
        <div className="text-center py-8">
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="px-6 py-3 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {loading ? "분석 중..." : "AI 분석 시작"}
          </button>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <VulnerabilitySummary analysis={analysis} />
          <EducationSuggestions recommendations={analysis.recommendations} />
        </div>
      )}
    </div>
  );
}
