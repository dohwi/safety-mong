"use client";

import type { AnalysisOutput } from "@/lib/ai/schemas";

function RateBar({ rate, color }: { rate: number; color: string }) {
  return (
    <div className="w-full h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.round(rate * 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function QuestionBreakdown({ breakdowns }: { breakdowns: AnalysisOutput["questionBreakdowns"] }) {
  if (breakdowns.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#222222]">문항별 오답 분석</h2>
      {breakdowns.map((q) => {
        const isWeak = q.correctRate < 0.6;
        const barColor = q.correctRate >= 0.8 
          ? "#22C55E" 
          : q.correctRate >= 0.6 
            ? "#F59E0B" 
            : q.correctRate >= 0.4 
              ? "#FB923C" // Orange-400 (약 50% 구간)
              : "#EF4444";

        return (
          <div
            key={q.questionIndex}
            className={`rounded-2xl border bg-white p-5 space-y-4 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${
              isWeak
                ? q.correctRate >= 0.4
                  ? "border-[rgba(251,146,60,0.2)] ring-1 ring-[rgba(251,146,60,0.06)]"
                  : "border-[rgba(239,68,68,0.2)] ring-1 ring-[rgba(239,68,68,0.06)]"
                : "border-[rgba(0,0,0,0.08)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black text-white shrink-0 ${
                  isWeak 
                    ? q.correctRate >= 0.4 ? "bg-[#FB923C]" : "bg-[#EF4444]" 
                    : "bg-[#4F7CFF]"
                }`}>
                  {q.questionIndex + 1}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F3F8] text-[#6B7280] font-medium">
                  {q.category}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-2xl font-black tabular-nums ${
                  q.correctRate >= 0.8 
                    ? "text-[#22C55E]" 
                    : q.correctRate >= 0.6 
                      ? "text-[#F59E0B]" 
                      : q.correctRate >= 0.4 
                        ? "text-[#FB923C]" 
                        : "text-[#EF4444]"
                }`}>
                  {Math.round(q.correctRate * 100)}%
                </span>
                <p className="text-[10px] text-[#9CA3AF] font-medium">정답률</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-[#222222] leading-relaxed">{q.questionText}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded bg-[#22C55E]/10 text-[10px] font-bold text-[#22C55E] shrink-0">정</span>
                <span className="text-sm text-[#4B5563]">{q.correctOptionText}</span>
              </div>
              {q.topWrongOptionText && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded bg-[#EF4444]/10 text-[10px] font-bold text-[#EF4444] shrink-0">오</span>
                  <span className="text-sm text-[#4B5563]">
                    {q.topWrongOptionText}
                    {q.topWrongSelectionRate != null && (
                      <span className="text-[#9CA3AF] ml-1.5">({Math.round(q.topWrongSelectionRate * 100)}% 선택)</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <RateBar rate={q.correctRate} color={barColor} />

            {isWeak && (
              <div className="space-y-2 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5 shrink-0">&#x1F50D;</span>
                  <div>
                    <p className={`text-xs font-bold mb-0.5 ${q.correctRate >= 0.4 ? "text-[#FB923C]" : "text-[#EF4444]"}`}>왜 헷갈렸을까?</p>
                    <p className="text-sm text-[#4B5563] leading-relaxed">{q.whyStudentsConfused}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5 shrink-0">&#x1F4A1;</span>
                  <div>
                    <p className="text-xs font-bold text-[#4F7CFF] mb-0.5">지도 팁</p>
                    <p className="text-sm text-[#4B5563] leading-relaxed">{q.teachingTip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
