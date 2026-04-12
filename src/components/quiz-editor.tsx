"use client";

import { useState } from "react";
import type { QuizGenerationOutput, QuestionOutput } from "@/lib/ai/schemas";
import { AiWarningBanner } from "@/components/ai-warning-banner";
import { ReviewChecklist } from "@/components/review-checklist";
import { SafetyMarkdownEditor } from "@/components/safety-markdown-editor";

interface QuizEditorProps {
  initialData: QuizGenerationOutput;
  topic: string;
  onSave: (data: FormData) => void;
  saving: boolean;
}

function createEmptyQuestion(): QuestionOutput {
  return {
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    questionDurationMs: 0,
    explanation: "",
    category: "",
    commonMisconception: null,
  };
}

export function QuizEditor({ initialData, topic, onSave, saving }: QuizEditorProps) {
  const [safetyContent, setSafetyContent] = useState(initialData.safetyContent);
  const [questionList, setQuestionList] = useState<QuestionOutput[]>(initialData.questions);
  const [checklistComplete, setChecklistComplete] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState<QuestionOutput>(createEmptyQuestion());

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

  function openAddQuestionModal() {
    setNewQuestion(createEmptyQuestion());
    setShowAddModal(true);
  }

  function addQuestion() {
    setQuestionList((prev) => [
      ...prev,
      { ...newQuestion, options: [...newQuestion.options] },
    ]);
    setShowAddModal(false);
    setNewQuestion(createEmptyQuestion());
  }

  function updateNewQuestionOption(index: number, value: string) {
    setNewQuestion((prev) => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        title: topic,
        icon: initialData.icon || "🧪",
        safetyContent,
        questions: questionList,
      })
    );
    onSave(formData);
  }

  const isNewQuestionValid =
    newQuestion.text.trim() &&
    newQuestion.options.every((option) => option.trim()) &&
    newQuestion.explanation.trim() &&
    newQuestion.category.trim();

  const inputClass = "w-full rounded-[16px] border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 text-sm text-[#222222] placeholder-[#9CA3AF] outline-none transition-all duration-200 hover:border-[rgba(0,0,0,0.15)] focus:border-[rgba(79,124,255,0.5)] focus:ring-2 focus:ring-[rgba(79,124,255,0.15)]";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-[28px] border border-[rgba(0,0,0,0.06)] bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl">{initialData.icon || "🧪"}</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#222222]">{topic}</h1>
              <p className="text-xs font-medium text-[#9CA3AF]">AI 생성 퀴즈 검수 · {questionList.length}문항</p>
            </div>
          </div>
        </div>
      </div>
      <AiWarningBanner />

      <div className="rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-5">
        <h2 className="mb-2 text-lg font-semibold text-[#222222]">안전수칙</h2>
        <SafetyMarkdownEditor value={safetyContent} onChange={setSafetyContent} />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[#222222]">
            퀴즈 문제 ({questionList.length}개)
          </h2>
          <button
            type="button"
            onClick={openAddQuestionModal}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#4F7CFF] px-5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#6B91FF] active:scale-[0.98]"
          >
            문제 직접 추가
          </button>
        </div>

        {questionList.map((q, qi) => (
          <div
            key={qi}
            className="space-y-4 rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-5 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B7280]">
                문제 {qi + 1}
              </span>
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                className="text-xs text-[#EF4444] hover:text-[#F87171] transition-colors"
              >
                삭제
              </button>
            </div>

            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(qi, "text", e.target.value)}
              className={inputClass.replace("py-3", "py-3")}
              rows={2}
              placeholder="문제를 입력하세요"
            />

            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qi, "correctIndex", oi)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200 ${
                      q.correctIndex === oi
                        ? "border-[#4F7CFF] bg-[#4F7CFF] text-white"
                        : "border-[rgba(0,0,0,0.08)] bg-[#F1F3F8] text-[#6B7280] hover:border-[rgba(79,124,255,0.4)]"
                    }`}
                  >
                    {oi + 1}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    className={inputClass}
                    placeholder={`선택지 ${oi + 1}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs text-[#6B7280]">해설</label>
              <textarea
                value={q.explanation}
                onChange={(e) => updateQuestion(qi, "explanation", e.target.value)}
                className={`mt-1 ${inputClass}`}
                rows={2}
                placeholder="정답 근거와 학생이 기억해야 할 안전 포인트를 적어주세요"
              />
            </div>

            <div className="flex gap-2">
              <input
                value={q.category}
                onChange={(e) => updateQuestion(qi, "category", e.target.value)}
                placeholder="카테고리"
                className={inputClass}
              />
              <input
                type="number"
                min={5}
                max={120}
                value={q.questionDurationMs / 1000 || ""}
                onChange={(e) => updateQuestion(qi, "questionDurationMs", (parseInt(e.target.value, 10) || 30) * 1000)}
                placeholder="제한시간(초)"
                className={`w-28 ${inputClass}`}
              />
            </div>
            <p className="text-xs text-[#9CA3AF]">제한시간 {q.questionDurationMs / 1000}초</p>
          </div>
        ))}
      </div>

      <ReviewChecklist onComplete={setChecklistComplete} />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.4)] backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#222222]">문제 추가</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-xl leading-none text-[#6B7280] hover:text-[#222222] transition-colors">
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <textarea
                value={newQuestion.text}
                onChange={(e) => setNewQuestion((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="문제 텍스트"
                className={inputClass}
                rows={2}
              />

              <div className="space-y-2">
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewQuestion((prev) => ({ ...prev, correctIndex: index }))}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200 ${
                        newQuestion.correctIndex === index
                          ? "border-[#4F7CFF] bg-[#4F7CFF] text-white"
                          : "border-[rgba(0,0,0,0.08)] bg-[#F1F3F8] text-[#6B7280] hover:border-[rgba(79,124,255,0.4)]"
                      }`}
                    >
                      {index + 1}
                    </button>
                    <input
                      value={option}
                      onChange={(e) => updateNewQuestionOption(index, e.target.value)}
                      placeholder={`선택지 ${index + 1}`}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs text-[#6B7280]">해설</label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion((prev) => ({ ...prev, explanation: e.target.value }))}
                  placeholder="해설"
                  className={`mt-1 ${inputClass}`}
                  rows={2}
                />
              </div>

              <input
                value={newQuestion.category}
                onChange={(e) => setNewQuestion((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="카테고리 (예: 화학물질 취급)"
                className={inputClass}
              />

              <input
                type="number"
                min={5}
                max={120}
                value={newQuestion.questionDurationMs / 1000 || ""}
                onChange={(e) => setNewQuestion((prev) => ({ ...prev, questionDurationMs: (parseInt(e.target.value, 10) || 30) * 1000 }))}
                placeholder="제한시간(초)"
                className={inputClass}
              />

              <button
                type="button"
                onClick={addQuestion}
                disabled={!isNewQuestionValid}
                className="w-full rounded-xl bg-[#4F7CFF] py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#6B91FF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                문제 추가
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving || !checklistComplete || questionList.length === 0}
        className="w-full rounded-xl bg-[#4F7CFF] py-3 text-base font-medium text-white transition-all duration-200 hover:bg-[#6B91FF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "저장 중..." : "퀴즈 저장하기"}
      </button>
      {!checklistComplete && (
        <p className="text-sm text-[#9CA3AF] text-center">
          검수 체크리스트를 모두 확인해주세요
        </p>
      )}
    </div>
  );
}
