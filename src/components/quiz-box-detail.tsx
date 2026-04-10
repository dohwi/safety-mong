"use client";

import { useState } from "react";
import type { InferSelectModel } from "drizzle-orm";
import type { quizBoxes, questions } from "@/db/schema";
import { confirmQuizBox, deleteQuizBox } from "@/lib/actions/quiz-boxes";
import { AiWarningBanner } from "@/components/ai-warning-banner";

type QuizBox = InferSelectModel<typeof quizBoxes>;
type Question = InferSelectModel<typeof questions>;

export function QuizBoxDetail({ box, questions: questionList }: { box: QuizBox; questions: Question[] }) {
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    await confirmQuizBox(box.id);
    window.location.reload();
  }

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteQuizBox(box.id);
    window.location.href = "/dashboard";
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#222222]">{box.title}</h1>
        <div className="flex gap-2">
          {!box.isConfirmed && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {confirming ? "처리 중..." : "확정"}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>

      {!box.isConfirmed && <AiWarningBanner />}

      {box.isConfirmed && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          확정된 퀴즈함입니다. 세션에서 사용할 수 있습니다.
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-[#222222] mb-2">안전수칙</h2>
        <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap font-sans text-sm text-[#222222]">{box.safetyContent}</pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#222222]">
          문제 ({questionList.length}개)
        </h2>
        {questionList.map((q, i) => (
          <div key={q.id} className="border border-[#c1c1c1] rounded-2xl p-5 space-y-2">
            <p className="font-medium text-[#222222]">
              {i + 1}. {q.text}
            </p>
            <div className="space-y-1">
              {JSON.parse(q.options).map((opt: string, oi: number) => (
                <div
                  key={oi}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    oi === q.correctIndex
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-gray-50 text-[#222222]"
                  }`}
                >
                  {oi + 1}. {opt}
                </div>
              ))}
            </div>
            <p className="text-sm text-[#6a6a6a]">해설: {q.explanation}</p>
            {q.category && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-[#6a6a6a] rounded-full">
                {q.category}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
