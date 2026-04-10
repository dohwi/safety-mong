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
          className="px-6 py-2.5 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#1d4ed8]"
        >
          퀴즈 시작
        </button>
      )}
      {phase === "active" && (
        <button
          onClick={onSkip}
          className="px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600"
        >
          다음 문제로
        </button>
      )}
      {(phase === "waiting" || phase === "active" || phase === "intermission") && (
        <button
          onClick={onEnd}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
        >
          세션 종료
        </button>
      )}
    </div>
  );
}
