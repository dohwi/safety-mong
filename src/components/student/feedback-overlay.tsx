"use client";

import type { AnswerFeedback } from "@/lib/socket/types";

export function FeedbackOverlay({
  feedback,
  isTimeUp,
}: {
  feedback: AnswerFeedback | null;
  isTimeUp: boolean;
}) {
  if (!feedback && !isTimeUp) return null;

  return (
    <div className="mt-4 p-4 rounded-xl">
      {isTimeUp && !feedback && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
          <p className="font-semibold">시간 초과!</p>
        </div>
      )}
      {feedback && (
        <div
          className={`rounded-xl p-4 ${
            feedback.isCorrect
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <p className="font-semibold mb-1">
            {feedback.isCorrect ? "정답입니다!" : "틀렸습니다"}
          </p>
          <p className="text-sm">{feedback.explanation}</p>
        </div>
      )}
    </div>
  );
}
