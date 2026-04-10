"use client";

import { useState } from "react";
import type { QuizGenerationOutput } from "@/lib/ai/schemas";

export function QuizGenerator({
  onGenerated,
}: {
  onGenerated: (result: QuizGenerationOutput) => void;
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
      onGenerated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#222222] mb-6">새 퀴즈 만들기</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-[#222222] mb-1">
            실험 주제
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 산-염기 적정 실험, 유기화학 증류 실험"
            className="w-full px-4 py-2.5 border border-[#c1c1c1] rounded-lg text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full py-2.5 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "AI가 퀴즈를 생성 중..." : "퀴즈 생성하기"}
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="space-y-2">
                <div className="h-10 bg-gray-100 rounded-lg" />
                <div className="h-10 bg-gray-100 rounded-lg" />
                <div className="h-10 bg-gray-100 rounded-lg" />
                <div className="h-10 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
