"use client";

import { BrandMascot } from "@/components/brand-mascot";
import type { QuestionReviewItem } from "@/lib/socket/types";

export function QuizComplete({
  correctCount,
  totalCount,
  reviewItems,
}: {
  correctCount: number;
  totalCount: number;
  reviewItems: QuestionReviewItem[];
}) {
  const rate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const wrongItems = reviewItems.filter((item) => !item.isCorrect);

  return (
    <div className="w-full py-10">
      <div className="rounded-[28px] border border-[rgba(79,124,255,0.2)] bg-gradient-to-b from-white to-[#F8F9FB] px-5 py-8 text-center shadow-sm">
        <div className="flex justify-center">
          <BrandMascot variant="safety" size={180} className="h-auto w-32 drop-shadow-sm sm:w-36" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-[#222222]">퀴즈 완료!</h2>
        <p className="mt-2 text-sm text-[#6B7280]">안전몽이 이번 학습 결과를 정리했어요.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-[#F8F9FB] px-4 py-4 border border-[rgba(0,0,0,0.06)] border-l-4 border-l-[#4F7CFF] transition-all duration-200">
            <p className="text-xs text-[#9CA3AF]">맞춘 문제</p>
            <p className="mt-1 text-2xl font-bold text-[#4F7CFF]">{correctCount} / {totalCount}</p>
          </div>
          <div className="rounded-2xl bg-[#F8F9FB] px-4 py-4 border border-[rgba(0,0,0,0.06)] border-l-4 border-l-[#6B7280] transition-all duration-200">
            <p className="text-xs text-[#9CA3AF]">정답률</p>
            <p className="mt-1 text-2xl font-bold text-[#222222]">{rate}%</p>
          </div>
        </div>
        <p className="mt-5 text-sm text-[#9CA3AF]">오늘 배운 안전수칙을 실제 실험 전에도 다시 확인해보세요.</p>
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-left text-lg font-semibold text-[#222222]">오답 다시 보기</h3>
        {wrongItems.length > 0 ? (
          wrongItems.map((item) => (
            <div key={item.questionIndex} className="rounded-3xl border border-[rgba(245,158,11,0.15)] bg-white p-4 shadow-sm transition-all duration-200">
              <div className="rounded-2xl border border-[rgba(245,158,11,0.15)] bg-[rgba(245,158,11,0.06)] px-4 py-3 text-left text-[#F59E0B]">
                <p className="text-xs font-semibold">실험몽 복습 노트</p>
                <p className="mt-1 text-sm font-medium text-[#222222]">문제 {item.questionIndex + 1}. {item.questionText}</p>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{item.explanation}</p>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="min-w-0 flex-1 text-left text-sm text-[#9CA3AF]">
                  <p>내 답: {item.selectedIndex === null ? "미제출" : `${item.selectedIndex + 1}번`}</p>
                  <p className="mt-1 text-[#222222]">정답: {item.correctIndex + 1}번 {item.options[item.correctIndex]}</p>
                </div>
                <BrandMascot variant="surprisedExperiment" size={104} className="h-auto w-20 shrink-0 drop-shadow-sm" />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-[rgba(34,197,94,0.15)] bg-[rgba(34,197,94,0.06)] px-4 py-4 text-sm text-[#22C55E]">
            모든 문제를 맞혔어요. 안전몽이 아주 든든하다고 말하고 있어요.
          </div>
        )}
      </div>
    </div>
  );
}
