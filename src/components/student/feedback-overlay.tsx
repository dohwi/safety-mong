"use client";

import { BrandMascot } from "@/components/brand-mascot";
import type { AnswerFeedback } from "@/lib/socket/types";

export function FeedbackOverlay({
  feedback,
  isTimeUp,
}: {
  feedback: AnswerFeedback | null;
  isTimeUp: boolean;
}) {
  if (!feedback && !isTimeUp) return null;

  const mascotVariant = isTimeUp && !feedback
    ? "experiment"
    : feedback?.isCorrect
      ? "experiment"
      : "surprisedExperiment";
  const title = isTimeUp && !feedback
    ? "실험몽 해설"
    : feedback?.isCorrect
      ? "실험몽 해설"
      : "깜짝 실험몽 해설";
  const summary = isTimeUp && !feedback
    ? "시간이 끝났어요. 다음 문제 전에 핵심 내용을 확인해보세요."
    : feedback?.isCorrect
      ? "정답이에요. 왜 맞는지 바로 짚어드릴게요."
      : "앗, 여기서 많이 헷갈려요. 왜 틀렸는지 바로 볼게요.";
  const explanation = feedback?.explanation ?? "제출하지 못했더라도 해설을 보고 다음 문제에 대비해보세요.";
  const bubbleClassName = isTimeUp && !feedback
    ? "border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.06)] text-[#F59E0B]"
    : feedback?.isCorrect
      ? "border-[rgba(79,124,255,0.2)] bg-[rgba(79,124,255,0.06)] text-[#4F7CFF]"
      : "border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.06)] text-[#EF4444]";
  const tailBorderColor = isTimeUp && !feedback
    ? "rgba(245,158,11,0.2)"
    : feedback?.isCorrect
      ? "rgba(79,124,255,0.2)"
      : "rgba(239,68,68,0.2)";
  const tailBgColor = isTimeUp && !feedback
    ? "rgb(255, 251, 235)"
    : feedback?.isCorrect
      ? "rgb(239, 246, 255)"
      : "rgb(254, 242, 242)";

  return (
    <div className="mt-8 flex flex-col items-center animate-fade-in-up">
      <div 
        className={`relative w-full rounded-3xl border px-6 py-6 shadow-sm ${bubbleClassName}`}
        style={{ backgroundColor: tailBgColor }}
      >
        <div 
          className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-[9px] rotate-45 border-b border-r"
          style={{ borderColor: tailBorderColor, backgroundColor: tailBgColor }}
        />
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</p>
        <p className="mt-1 text-lg font-bold text-[#222222]">{summary}</p>
        <div className="mt-4 h-px w-full bg-current opacity-10" />
        <p className="mt-4 text-base leading-relaxed text-[#4B5563]">{explanation}</p>
      </div>
      <div className="mt-8 flex justify-center">
        <BrandMascot variant={mascotVariant} size={200} className="h-auto w-40 shrink-0 drop-shadow-md sm:w-48" />
      </div>
    </div>
  );
}
