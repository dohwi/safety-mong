"use client";

import type { AnalysisOutput } from "@/lib/ai/schemas";

export function EducationSuggestions({ recommendations }: { recommendations: AnalysisOutput["recommendations"] }) {
  const priorityConfig = {
    high: { bg: "bg-[rgba(239,68,68,0.06)]", border: "border-[rgba(239,68,68,0.15)]", text: "text-[#EF4444]", label: "높음" },
    medium: { bg: "bg-[rgba(245,158,11,0.06)]", border: "border-[rgba(245,158,11,0.15)]", text: "text-[#F59E0B]", label: "보통" },
    low: { bg: "bg-[rgba(34,197,94,0.06)]", border: "border-[rgba(34,197,94,0.15)]", text: "text-[#22C55E]", label: "낮음" },
  };

  return (
    <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-5 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">&#x1F4DA;</span>
        <h2 className="text-lg font-semibold text-[#222222]">교육 제안</h2>
      </div>
      {recommendations.length > 0 ? (
        <div className="space-y-2">
          {recommendations.map((rec, i) => {
            const cfg = priorityConfig[rec.priority];
            return (
              <div key={i} className={`p-3 rounded-xl ${cfg.bg} border ${cfg.border} transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.text} ${cfg.bg} border ${cfg.border}`}>
                    {cfg.label}
                  </span>
                  <p className="text-sm font-semibold text-[#222222]">{rec.title}</p>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed ml-[52px]">{rec.description}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[#9CA3AF]">특별한 교육 제안이 없습니다</p>
      )}
    </div>
  );
}
