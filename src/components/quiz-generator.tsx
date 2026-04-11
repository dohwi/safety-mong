"use client";

import { useState } from "react";
import { BrandMascot } from "@/components/brand-mascot";
import type { QuizGenerationOutput } from "@/lib/ai/schemas";

export function QuizGenerator({
  onGenerated,
}: {
  onGenerated: (result: QuizGenerationOutput, topic: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "퀴즈 생성에 실패했습니다");
      }

      const data: QuizGenerationOutput = await res.json();
      onGenerated(data, topic.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-[28px] border border-[rgba(0,0,0,0.06)] bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-bold text-[#4F7CFF]">AI 퀴즈 생성</p>
            <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#222222]">실험 주제를 입력하면 AI가 퀴즈 초안을 생성합니다</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#6B7280]">핵심 안전수칙, 헷갈리기 쉬운 선택지, 해설까지 한 번에 구성됩니다.</p>
          </div>
          <div className="flex h-24 w-24 items-center justify-center self-center rounded-3xl bg-[#F8F9FB] sm:self-auto">
            <BrandMascot variant="experiment" size={100} className="h-auto w-20" priority />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="rounded-[24px] border border-[rgba(0,0,0,0.06)] bg-[#F8F9FB] p-5 transition-all duration-300 focus-within:border-[rgba(79,124,255,0.2)]">
            <label htmlFor="topic" className="block text-sm font-medium text-[#6B7280]">
              실험 주제
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 산-염기 적정 실험, 유기용매 가열, 증류 장치 조립"
              className="mt-3 w-full rounded-[20px] border border-[rgba(0,0,0,0.08)] bg-white px-5 py-4 text-[15px] text-[#222222] placeholder-[#9CA3AF] outline-none transition-all duration-200 hover:border-[rgba(0,0,0,0.15)] focus:border-[#4F7CFF] focus:ring-4 focus:ring-[#4F7CFF]/10"
              disabled={loading}
            />
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#6B7280] sm:flex-row sm:items-center sm:justify-between">
              <p>AI 초안 생성 후 바로 문항 수정, 삭제, 수동 추가가 가능합니다.</p>
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#4F7CFF] px-6 text-base font-medium text-white transition-all duration-200 hover:bg-[#6B91FF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "실험몽이 생성 중..." : "퀴즈 생성하기"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-[20px] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[#EF4444]">
          {error}
        </div>
      )}

      {loading && (
        <div className="overflow-hidden rounded-[28px] border border-[rgba(0,0,0,0.06)] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative mx-auto sm:mx-0">
              <div className="absolute inset-0 animate-ping rounded-full bg-[rgba(79,124,255,0.1)]" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F1F3F8]">
                <BrandMascot variant="experiment" size={80} className="h-auto w-16 animate-pulse" />
              </div>
            </div>
            <div className="flex-1 rounded-[24px] border border-[rgba(0,0,0,0.04)] bg-[#F8F9FB] px-5 py-5 text-left">
              <p className="text-xs font-bold text-[#4F7CFF]">AI가 분석 중</p>
              <p className="mt-1 text-[20px] font-bold tracking-tight text-[#222222]">실험 주제를 검토하고 안전 퀴즈로 구성하고 있습니다</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#6B7280]">위험 요소를 분석하고, 오답 유도 선택지와 해설을 함께 생성합니다.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-[24px] border border-[rgba(0,0,0,0.06)] bg-white p-4">
                <div className="mb-3 h-4 w-2/3 rounded-full bg-[#F1F3F8]" />
                <div className="space-y-2">
                  <div className="h-11 rounded-[16px] bg-[#E5E7EB]" />
                  <div className="h-11 rounded-[16px] bg-[#E5E7EB]" />
                  <div className="h-11 rounded-[16px] bg-[#E5E7EB]" />
                  <div className="h-11 rounded-[16px] bg-[#E5E7EB]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
