"use client";

import type { QuestionStats } from "@/lib/socket/types";

export function QuestionStatsDisplay({ stats, totalQuestions }: { stats: QuestionStats | null; totalQuestions: number }) {
  if (!stats) return null;

  const correctRate = stats.totalParticipants > 0
    ? Math.round((stats.correctCount / stats.totalParticipants) * 100)
    : 0;

  return (
    <div className="border border-[#c1c1c1] rounded-2xl p-4 space-y-3">
      <h3 className="font-semibold text-[#222222]">
        문제 {stats.questionIndex + 1}/{totalQuestions} 통계
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-[#3b82f6]">{correctRate}%</p>
          <p className="text-xs text-[#6a6a6a]">정답률</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-[#222222]">
            {stats.responseCount}/{stats.totalParticipants}
          </p>
          <p className="text-xs text-[#6a6a6a]">응답</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {stats.optionDistribution.map((count, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-[#6a6a6a] w-8">{i + 1}번</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4">
              <div
                className="bg-[#3b82f6] h-4 rounded-full transition-all"
                style={{ width: `${stats.totalParticipants > 0 ? (count / stats.totalParticipants) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-[#6a6a6a] w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
