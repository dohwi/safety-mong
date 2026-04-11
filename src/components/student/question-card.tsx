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
  const displaySeconds = Number.isFinite(remainingSeconds) ? Math.max(0, remainingSeconds) : 0;

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div className="space-y-1">
          <span className="text-sm font-bold tracking-wider text-[#4F7CFF] uppercase">Question {question.index + 1}</span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#222222] leading-tight">{question.text}</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-colors ${
          remainingSeconds <= 5 
            ? "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444] animate-pulse" 
            : "bg-white border-[rgba(0,0,0,0.08)] text-[#222222]"
        }`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-lg font-black tabular-nums">{displaySeconds}s</span>
        </div>
      </div>

      <div className="w-full bg-[#F1F3F8] rounded-full h-2 overflow-hidden mb-8">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            remainingSeconds <= 5 ? "bg-[#EF4444]" : "bg-[#4F7CFF]"
          }`}
          style={{ width: `${Math.max(0, (displaySeconds / (question.durationMs / 1000)) * 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSubmit(i)}
            disabled={disabled}
            className={`group relative text-left p-5 sm:p-6 rounded-3xl border-2 transition-all duration-300 min-h-[80px] sm:min-h-[100px] flex items-center gap-4 ${
              selectedIndex === i
                ? "border-[#4F7CFF] bg-[#4F7CFF]/5 text-[#222222] shadow-[0_12px_32px_rgba(79,124,255,0.2)] scale-[1.04] z-10"
                : "border-[rgba(0,0,0,0.06)] bg-white/60 text-[#222222] hover:border-[#4F7CFF]/40 hover:bg-white active:scale-[0.98] active:translate-y-0"
            } disabled:cursor-default disabled:opacity-80 disabled:translate-y-0`}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-2xl text-lg font-black shrink-0 transition-colors ${
              selectedIndex === i 
                ? "bg-[#4F7CFF] text-white" 
                : "bg-[#F1F3F8] text-[#6B7280] group-hover:bg-[#4F7CFF]/10 group-hover:text-[#4F7CFF]"
            }`}>
              {i + 1}
            </div>
            <span className="text-lg font-semibold leading-snug">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
