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
          ? "#4F7CFF" 
          : q.correctRate >= 0.4
            ? "#6B7280" 
            : "#EF4444";

        return (
          <div
            key={q.questionIndex}
            className={`rounded-2xl border bg-white p-5 space-y-4 transition-all duration-200 ${
              isWeak
                ? "border-[rgba(239,68,68,0.15)] bg-[#FFFBFB]"
                : "border-[rgba(79,124,255,0.08)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black text-white shrink-0 ${
                  isWeak ? "bg-[#EF4444]" : "bg-[#4F7CFF]"
                }`}>
                  {q.questionIndex + 1}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F3F8] text-[#6B7280] font-bold">
                  {q.category}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-2xl font-black tabular-nums ${
                  q.correctRate >= 0.8 
                    ? "text-[#4F7CFF]" 
                    : q.correctRate >= 0.4
                      ? "text-[#4B5563]"
                      : "text-[#EF4444]"
                }`}>
                  {Math.round(q.correctRate * 100)}%
                </span>
              </div>
            </div>

            <p className="text-sm font-bold text-[#222222] leading-relaxed">{q.questionText}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded bg-[#4F7CFF]/10 text-[10px] font-bold text-[#4F7CFF] shrink-0">정</span>
                <span className="text-sm text-[#4B5563] font-medium">{q.correctOptionText}</span>
              </div>
              {q.topWrongOptionText && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded bg-[#EF4444]/5 text-[10px] font-bold text-[#EF4444] shrink-0">오</span>
                  <span className="text-sm text-[#6B7280]">
                    {q.topWrongOptionText}
                    {q.topWrongSelectionRate != null && (
                      <span className="text-[#9CA3AF] ml-1.5 font-medium">({Math.round(q.topWrongSelectionRate * 100)}% 선택)</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <RateBar rate={q.correctRate} color={barColor} />

            {isWeak && (
              <div className="space-y-3 pt-4 border-t border-[rgba(0,0,0,0.04)]">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-md bg-[#EF4444]/5">
                    <p className="text-[10px] font-black text-[#EF4444] leading-none">CHECK</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#EF4444] mb-1">오답 원인 분석</p>
                    <p className="text-sm text-[#4B5563] leading-relaxed font-medium">{q.whyStudentsConfused}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-md bg-[#4F7CFF]/5">
                    <p className="text-[10px] font-black text-[#4F7CFF] leading-none">TIP</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#4F7CFF] mb-1">지도 포인트</p>
                    <p className="text-sm text-[#4B5563] leading-relaxed font-medium">{q.teachingTip}</p>
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
