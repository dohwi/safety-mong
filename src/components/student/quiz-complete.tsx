"use client";

export function QuizComplete({ correctCount, totalCount }: { correctCount: number; totalCount: number }) {
  const rate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-xl font-semibold text-[#222222] mb-2">퀴즈 완료!</h2>
      <div className="mt-6 space-y-2">
        <p className="text-2xl font-bold text-[#3b82f6]">
          {correctCount} / {totalCount}
        </p>
        <p className="text-[#6a6a6a]">정답률 {rate}%</p>
      </div>
    </div>
  );
}
