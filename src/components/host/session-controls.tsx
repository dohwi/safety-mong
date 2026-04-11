"use client";

export function SessionControls({
  phase,
  onStart,
  onSkip,
  onEnd,
}: {
  phase: string;
  onStart: () => void;
  onSkip: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="flex gap-2">
      {phase === "waiting" && (
        <button
          onClick={onStart}
          className="px-6 py-2.5 bg-[#4F7CFF] text-white font-medium rounded-xl hover:bg-[#6B91FF] transition-all duration-200 active:scale-[0.98]"
        >
          퀴즈 시작
        </button>
      )}
      {phase === "active" && (
        <button
          onClick={onSkip}
          className="px-4 py-2 bg-[#F59E0B] text-white font-medium rounded-xl hover:bg-[#D97706] transition-all duration-200 active:scale-[0.98]"
        >
          다음 문제로
        </button>
      )}
      {(phase === "waiting" || phase === "active" || phase === "intermission") && (
        <button
          onClick={onEnd}
          className="px-4 py-2 border border-[rgba(239,68,68,0.3)] text-[#EF4444] rounded-xl hover:bg-[rgba(239,68,68,0.08)] transition-all duration-200 active:scale-[0.98]"
        >
          세션 종료
        </button>
      )}
    </div>
  );
}
