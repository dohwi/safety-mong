"use client";

import type { QuestionStats } from "@/lib/socket/types";

export function QuestionStatsDisplay({ stats, totalQuestions }: { stats: QuestionStats[]; totalQuestions: number }) {
  if (!stats || stats.length === 0) return null;

  const totalCorrect = stats.reduce((sum, s) => sum + s.correctCount, 0);
  const totalParticipants = stats[0]?.totalParticipants || 0;
  const overallRate = totalParticipants > 0 ? Math.round((totalCorrect / (totalParticipants * stats.length)) * 100) : 0;

  return (
    <div className="border border-[rgba(0,0,0,0.08)] rounded-2xl p-4 space-y-3 bg-white shadow-sm">
      <h3 className="font-semibold text-[#222222]">
        전체 통계 ({stats.length}/{totalQuestions}문제)
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-[#F8F9FB] rounded-xl border-l-4 border-[#4F7CFF] transition-all duration-200">
          <p className="text-2xl font-bold text-[#4F7CFF]">{overallRate}%</p>
          <p className="text-xs text-[#9CA3AF]">종합 정답률</p>
        </div>
        <div className="text-center p-3 bg-[#F8F9FB] rounded-xl border-l-4 border-[#6B7280] transition-all duration-200">
          <p className="text-2xl font-bold text-[#222222]">
            {totalCorrect}/{totalParticipants * stats.length}
          </p>
          <p className="text-xs text-[#9CA3AF]">정답/제출</p>
        </div>
      </div>
    </div>
  );
}
