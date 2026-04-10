"use client";

import type { QuestionBroadcast } from "@/lib/socket/types";

interface QuestionCardProps {
  question: QuestionBroadcast;
  selectedIndex: number | null;
  remainingSeconds: number;
  onSubmit: (selectedIndex: number) => void;
}

export function QuestionCard({ question, selectedIndex, remainingSeconds, onSubmit }: QuestionCardProps) {
  const disabled = selectedIndex !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#6a6a6a]">문제 {question.index + 1}</span>
        <span className={`text-lg font-bold ${remainingSeconds <= 5 ? "text-red-500" : "text-[#222222]"}`}>
          {remainingSeconds}s
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-[#3b82f6] h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${Math.max(0, (remainingSeconds / (question.durationMs / 1000)) * 100)}%` }}
        />
      </div>

      <p className="text-lg font-medium text-[#222222]">{question.text}</p>

      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSubmit(i)}
            disabled={disabled}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
              selectedIndex === i
                ? "border-[#3b82f6] bg-blue-50 text-[#222222]"
                : "border-[#c1c1c1] bg-white text-[#222222] hover:border-[#3b82f6]"
            } disabled:cursor-default min-h-[44px]`}
          >
            <span className="font-medium">{i + 1}.</span> {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
