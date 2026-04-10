"use client";

import type { AnalysisOutput } from "@/lib/ai/schemas";

export function EducationSuggestions({ recommendations }: { recommendations: AnalysisOutput["recommendations"] }) {
  const priorityColors = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-green-50 text-green-700",
  };

  return (
    <div className="border border-[#c1c1c1] rounded-2xl p-5 space-y-3">
      <h2 className="text-lg font-semibold text-[#222222]">교육 제안</h2>
      {recommendations.length > 0 ? (
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[rec.priority]}`}>
                {rec.priority === "high" ? "높음" : rec.priority === "medium" ? "보통" : "낮음"}
              </span>
              <div>
                <p className="text-sm font-medium text-[#222222]">{rec.title}</p>
                <p className="text-xs text-[#6a6a6a]">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6a6a6a]">특별한 교육 제안이 없습니다</p>
      )}
    </div>
  );
}
