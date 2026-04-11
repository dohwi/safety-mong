"use client";

import type { AnalysisOutput } from "@/lib/ai/schemas";

export function EducationSuggestions({ recommendations }: { recommendations: AnalysisOutput["recommendations"] }) {
  const priorityConfig = {
    high: { bg: "bg-[#EF4444]", text: "text-white", label: "중요" },
    medium: { bg: "bg-[#4F7CFF]", text: "text-white", label: "일반" },
    low: { bg: "bg-[#6B7280]", text: "text-white", label: "참고" },
  };

  return (
    <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[#4F7CFF] text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#222222]">교육 가이드 제안</h2>
      </div>
      {recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const cfg = priorityConfig[rec.priority];
            return (
              <div key={i} className="p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <p className="text-sm font-bold text-[#222222]">{rec.title}</p>
                </div>
                <p className="text-sm text-[#6B7280] leading-relaxed font-medium pl-0 sm:pl-[44px]">
                  {rec.description}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[#9CA3AF] font-bold">제안된 가이드가 없습니다.</p>
      )}
    </div>
  );
}
