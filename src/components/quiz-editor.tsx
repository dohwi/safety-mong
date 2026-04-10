"use client";

import { useState } from "react";
import type { QuizGenerationOutput, QuestionOutput } from "@/lib/ai/schemas";
import { AiWarningBanner } from "@/components/ai-warning-banner";
import { ReviewChecklist } from "@/components/review-checklist";

interface QuizEditorProps {
  initialData: QuizGenerationOutput;
  topic: string;
  onSave: (data: FormData) => void;
  saving: boolean;
}

export function QuizEditor({ initialData, topic, onSave, saving }: QuizEditorProps) {
  const [safetyContent, setSafetyContent] = useState(initialData.safetyContent);
  const [questionList, setQuestionList] = useState<QuestionOutput[]>(initialData.questions);
  const [checklistComplete, setChecklistComplete] = useState(false);

  function updateQuestion(index: number, field: keyof QuestionOutput, value: unknown) {
    setQuestionList((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestionList((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOptions = [...q.options];
        newOptions[oIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  }

  function removeQuestion(index: number) {
    setQuestionList((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        title: topic,
        safetyContent,
        questionDurationMs: 30000,
        questions: questionList,
      })
    );
    onSave(formData);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#222222]">퀴즈 검수</h1>
      <AiWarningBanner />

      <div>
        <h2 className="text-lg font-semibold text-[#222222] mb-2">안전수칙</h2>
        <textarea
          value={safetyContent}
          onChange={(e) => setSafetyContent(e.target.value)}
          className="w-full px-4 py-3 border border-[#c1c1c1] rounded-lg text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6] min-h-[200px]"
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-[#222222]">
          퀴즈 문제 ({questionList.length}개)
        </h2>

        {questionList.map((q, qi) => (
          <div
            key={qi}
            className="border border-[#c1c1c1] rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#6a6a6a]">
                문제 {qi + 1}
              </span>
              <button
                onClick={() => removeQuestion(qi)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                삭제
              </button>
            </div>

            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(qi, "text", e.target.value)}
              className="w-full px-3 py-2 border border-[#c1c1c1] rounded-lg text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              rows={2}
            />

            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuestion(qi, "correctIndex", oi)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                      q.correctIndex === oi
                        ? "border-[#3b82f6] bg-[#3b82f6] text-white"
                        : "border-[#c1c1c1]"
                    }`}
                  >
                    {oi + 1}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#c1c1c1] rounded-lg text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs text-[#6a6a6a]">해설</label>
              <textarea
                value={q.explanation}
                onChange={(e) => updateQuestion(qi, "explanation", e.target.value)}
                className="w-full px-3 py-2 border border-[#c1c1c1] rounded-lg text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <input
                value={q.category}
                onChange={(e) => updateQuestion(qi, "category", e.target.value)}
                placeholder="카테고리"
                className="flex-1 px-3 py-2 border border-[#c1c1c1] rounded-lg text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              />
            </div>
          </div>
        ))}
      </div>

      <ReviewChecklist onComplete={setChecklistComplete} />

      <button
        onClick={handleSubmit}
        disabled={saving || !checklistComplete || questionList.length === 0}
        className="w-full py-2.5 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "저장 중..." : "퀴즈 확정하기"}
      </button>
      {!checklistComplete && (
        <p className="text-sm text-[#6a6a6a] text-center">
          검수 체크리스트를 모두 확인해주세요
        </p>
      )}
    </div>
  );
}
