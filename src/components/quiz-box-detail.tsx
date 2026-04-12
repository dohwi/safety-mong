"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { InferSelectModel } from "drizzle-orm";
import type { quizBoxes, questions } from "@/db/schema";
import { deleteQuizBox, updateSafetyContent, addQuestion, deleteQuestion, updateQuestion } from "@/lib/actions/quiz-boxes";
import { createSession } from "@/lib/actions/sessions";
import { AiWarningBanner } from "@/components/ai-warning-banner";
import { SafetyMarkdownEditor } from "@/components/safety-markdown-editor";
import { renderBoldText } from "@/lib/render-bold";

type QuizBox = InferSelectModel<typeof quizBoxes>;
type Question = InferSelectModel<typeof questions>;

interface NewQuestionForm {
  text: string;
  options: string[];
  correctIndex: number;
  questionDurationMs: number;
  explanation: string;
  category: string;
}

const emptyForm = (): NewQuestionForm => ({
  text: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  questionDurationMs: 0,
  explanation: "",
  category: "",
});

const inputClass = "w-full rounded-[16px] border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 text-sm text-[#222222] placeholder-[#9CA3AF] outline-none transition-all duration-200 hover:border-[rgba(0,0,0,0.15)] focus:border-[rgba(79,124,255,0.5)] focus:ring-2 focus:ring-[rgba(79,124,255,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export function QuizBoxDetail({ box, questions: questionList, isEditable, activeSessionId, activeSessionCode }: { box: QuizBox; questions: Question[]; isEditable: boolean; activeSessionId: number | null; activeSessionCode: string | null }) {
  const router = useRouter();
  const [startingSession, setStartingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditingSafety, setIsEditingSafety] = useState(false);
  const [safetyDraft, setSafetyDraft] = useState(box.safetyContent ?? "");
  const [savingSafety, setSavingSafety] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newQ, setNewQ] = useState<NewQuestionForm>(emptyForm());
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  const [targetCount, setTargetCount] = useState<number>(0);

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteQuizBox(box.id);
    router.push("/dashboard");
  }

  async function handleStartSession() {
    setStartingSession(true);
    setError(null);
    const result = await createSession(box.id, targetCount > 0 ? targetCount : undefined);
    if (result.error) {
      setError(result.error);
      setStartingSession(false);
      return;
    }
    if (result.success && result.sessionId) {
      router.push(`/quiz-boxes/${box.id}/sessions/${result.sessionId}/host`);
    }
  }

  async function handleSaveSafety() {
    if (!safetyDraft.trim()) return;
    setSavingSafety(true);
    const result = await updateSafetyContent(box.id, safetyDraft);
    if (result.error) {
      setError(result.error);
      setSavingSafety(false);
      return;
    }
    router.refresh();
    setIsEditingSafety(false);
  }

  async function handleAddQuestion() {
    setAddingQuestion(true);
    setError(null);
    const result = editingQuestionId 
      ? await updateQuestion(editingQuestionId, box.id, newQ)
      : await addQuestion(box.id, newQ);
    
    if (result.error) {
      setError(result.error);
      setAddingQuestion(false);
      return;
    }
    setEditingQuestionId(null);
    setShowAddForm(false);
    router.refresh();
  }

  function handleEditQuestion(q: Question) {
    setNewQ({
      text: q.text,
      options: JSON.parse(q.options) as string[],
      correctIndex: q.correctIndex,
      questionDurationMs: q.questionDurationMs,
      explanation: q.explanation || "",
      category: q.category || "",
    });
    setEditingQuestionId(q.id);
    setShowAddForm(true);
  }

  async function handleDeleteQuestion(questionId: number) {
    if (!confirm("이 문제를 삭제하시겠습니까?")) return;
    const result = await deleteQuestion(questionId, box.id);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function updateOption(idx: number, value: string) {
    setNewQ((prev) => {
      const options = [...prev.options];
      options[idx] = value;
      return { ...prev, options };
    });
  }

  const isFormValid = newQ.text.trim() && newQ.options.every((o) => o.trim()) && newQ.explanation.trim() && newQ.category.trim();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-[28px] border border-[rgba(0,0,0,0.06)] bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8F9FB] text-[#6B7280] transition-all hover:bg-[#F1F3F8] hover:text-[#222222]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{box.icon}</span>
                <h1 className="text-2xl font-bold tracking-tight text-[#222222]">{box.title}</h1>
              </div>
              <p className="mt-1 text-sm font-medium text-[#6B7280]">실험 안전 퀴즈 관리 및 세션 시작</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/quiz-boxes/${box.id}/sessions`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-5 text-sm font-bold text-[#6B7280] transition-all duration-200 hover:bg-[#F8F9FB] hover:text-[#222222]"
            >
              세션 기록
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[rgba(239,68,68,0.1)] bg-white px-5 text-sm font-bold text-[#EF4444] transition-all duration-200 hover:bg-[#FEF2F2]"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      <AiWarningBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#222222]">안전수칙</h2>
              {isEditable && !isEditingSafety && (
                <button
                  onClick={() => { setIsEditingSafety(true); setSafetyDraft(box.safetyContent ?? ""); }}
                  className="text-sm font-medium text-[#4F7CFF] hover:underline"
                >
                  편집하기
                </button>
              )}
            </div>
            {isEditingSafety ? (
              <div className="space-y-4">
                <SafetyMarkdownEditor value={safetyDraft} onChange={setSafetyDraft} minHeight={320} />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSafety}
                    disabled={savingSafety || !safetyDraft.trim()}
                    className="flex-1 rounded-xl bg-[#4F7CFF] py-3 text-sm font-medium text-white transition-all hover:bg-[#6B91FF] disabled:opacity-50"
                  >
                    {savingSafety ? "저장 중..." : "변경 내용 저장"}
                  </button>
                  <button
                    onClick={() => setIsEditingSafety(false)}
                    className="flex-1 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white py-3 text-sm font-medium text-[#6B7280] transition-all hover:bg-[#F8F9FB]"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm prose-blue max-w-none bg-[#F8F9FB] p-5 rounded-[20px] border border-[rgba(0,0,0,0.04)] text-[#4B5563]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {box.safetyContent ?? "*등록된 안전수칙이 없습니다.*"}
                </ReactMarkdown>
              </div>
            )}
          </section>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#222222]">
                퀴즈 문제 ({questionList.length}개)
              </h2>
              {isEditable && (
                <button
                  onClick={() => { setShowAddForm(true); setNewQ(emptyForm()); }}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#4F7CFF] px-5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#6B91FF] active:scale-[0.98]"
                >
                  문제 직접 추가
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              {questionList.map((q, i) => (
                <div key={q.id} className="space-y-4 rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-5 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#6B7280]">
                      문제 {i + 1}
                    </span>
                    {isEditable && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEditQuestion(q)}
                          className="text-xs text-[#4F7CFF] hover:underline"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-xs text-[#EF4444] hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-base font-semibold text-[#222222] leading-relaxed">{q.text}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(JSON.parse(q.options) as string[]).map((opt: string, oi: number) => (
                      <div
                        key={oi}
                        className={`px-4 py-3 rounded-[16px] text-sm transition-all ${
                          oi === q.correctIndex
                            ? "bg-[#4F7CFF] text-white font-semibold"
                            : "bg-[#F1F3F8] text-[#4B5563]"
                        }`}
                      >
                        <span className={`mr-2 font-bold ${oi === q.correctIndex ? "text-white/70" : "text-[#9CA3AF]"}`}>{oi + 1}</span> {opt}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[rgba(0,0,0,0.04)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {q.category && (
                          <span className="rounded-lg bg-[#222222] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                            {q.category}
                          </span>
                        )}
                        <span className="text-xs font-medium text-[#9CA3AF]">제한시간 {q.questionDurationMs / 1000}초</span>
                      </div>
                    </div>
                    <div className="rounded-[16px] bg-[#F8F9FB] px-4 py-3 text-xs leading-relaxed text-[#6B7280]">
                      <span className="font-bold text-[#4F7CFF] mr-1">💡 해설:</span> {renderBoldText(q.explanation ?? "")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            <div className="rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F7CFF] text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-[#222222]">라이브 세션</h2>
              </div>

              {!isEditable && activeSessionId && (
                <div className="mb-4 rounded-2xl bg-[#4F7CFF]/5 p-4 border border-[#4F7CFF]/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F7CFF] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F7CFF]"></span>
                    </span>
                    <p className="text-xs font-bold text-[#4F7CFF]">현재 진행 중인 세션</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center bg-white py-3 rounded-xl border border-[#4F7CFF]/10">
                      <span className="text-xl font-bold text-[#222222] tracking-widest font-mono">{activeSessionCode}</span>
                    </div>
                    <Link
                      href={`/quiz-boxes/${box.id}/sessions/${activeSessionId}/host`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F7CFF] py-3 text-sm font-bold text-white transition-all hover:bg-[#6B91FF]"
                    >
                      입장하기
                    </Link>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#6B7280]">목표 참여 인원</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={targetCount}
                      onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 0)}
                      className={inputClass}
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#9CA3AF]">명</span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF]">0명 입력 시 수동으로 시작합니다.</p>
                </div>
                
                <button
                  onClick={handleStartSession}
                  disabled={startingSession}
                  className="w-full rounded-xl bg-[#4F7CFF] py-4 text-sm font-bold text-white transition-all hover:bg-[#6B91FF] active:scale-[0.98] disabled:opacity-50"
                >
                  {startingSession ? "준비 중..." : "퀴즈 세션 시작"}
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-6">
              <h3 className="text-sm font-bold mb-3 text-[#222222]">도움말</h3>
              <ul className="space-y-2 text-xs text-[#6B7280] font-medium">
                <li className="flex gap-2 leading-relaxed">
                  <span className="text-[#4F7CFF] shrink-0">•</span>
                  세션을 시작하면 학생들이 입장할 수 있는 참여 코드가 생성됩니다.
                </li>
                <li className="flex gap-2 leading-relaxed">
                  <span className="text-[#4F7CFF] shrink-0">•</span>
                  모든 문제가 종료되면 AI가 참여 데이터를 분석해 오답 리포트를 생성합니다.
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.4)] backdrop-blur-sm" onClick={() => { setShowAddForm(false); setEditingQuestionId(null); }}>
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#222222]">{editingQuestionId ? "문제 수정" : "문제 추가"}</h3>
              <button type="button" onClick={() => { setShowAddForm(false); setEditingQuestionId(null); }} className="text-xl leading-none text-[#6B7280] hover:text-[#222222] transition-colors">
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <textarea
                value={newQ.text}
                onChange={(e) => setNewQ((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="문제 텍스트"
                className={inputClass}
                rows={2}
              />

              <div className="space-y-2">
                {newQ.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewQ((prev) => ({ ...prev, correctIndex: oi }))}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200 ${
                        newQ.correctIndex === oi
                          ? "border-[#4F7CFF] bg-[#4F7CFF] text-white"
                          : "border-[rgba(0,0,0,0.08)] bg-[#F1F3F8] text-[#6B7280] hover:border-[rgba(79,124,255,0.4)]"
                      }`}
                    >
                      {oi + 1}
                    </button>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(oi, e.target.value)}
                      placeholder={`선택지 ${oi + 1}`}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs text-[#6B7280]">해설</label>
                <textarea
                  value={newQ.explanation}
                  onChange={(e) => setNewQ((prev) => ({ ...prev, explanation: e.target.value }))}
                  placeholder="해설"
                  className={`mt-1 ${inputClass}`}
                  rows={2}
                />
              </div>

              <input
                value={newQ.category}
                onChange={(e) => setNewQ((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="카테고리 (예: 화학취급)"
                className={inputClass}
              />

              <input
                type="number"
                min={5}
                max={120}
                value={newQ.questionDurationMs / 1000 || ""}
                onChange={(e) => setNewQ((prev) => ({ ...prev, questionDurationMs: (parseInt(e.target.value, 10) || 30) * 1000 }))}
                placeholder="제한시간(초)"
                className={inputClass}
              />

              {error && <p className="text-sm text-[#EF4444] text-center font-medium">{error}</p>}

              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={addingQuestion || !isFormValid}
                className="w-full rounded-xl bg-[#4F7CFF] py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#6B91FF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingQuestion ? "저장 중..." : editingQuestionId ? "수정 완료" : "문제 저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

