"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { InferSelectModel } from "drizzle-orm";
import type { quizBoxes, questions } from "@/db/schema";
import { deleteQuizBox, updateSafetyContent, addQuestion, deleteQuestion, updateQuestionDuration, updateQuestion } from "@/lib/actions/quiz-boxes";
import { createSession } from "@/lib/actions/sessions";
import { AiWarningBanner } from "@/components/ai-warning-banner";

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

const inputClass = "w-full px-3 py-2 border border-[rgba(0,0,0,0.08)] rounded-xl bg-white text-[#222222] text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(79,124,255,0.5)] transition-all duration-200 hover:border-[rgba(0,0,0,0.15)]";

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
  const [durationDrafts, setDurationDrafts] = useState<Record<number, number>>(
    Object.fromEntries(questionList.map((question) => [question.id, question.questionDurationMs / 1000]))
  );
  const [savingDurationId, setSavingDurationId] = useState<number | null>(null);

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
      options: JSON.parse(q.options),
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

  async function handleSaveQuestionDuration(questionId: number) {
    const draftSeconds = durationDrafts[questionId];
    setSavingDurationId(questionId);
    setError(null);

    const result = await updateQuestionDuration(questionId, box.id, (draftSeconds || 30) * 1000);
    if (result.error) {
      setError(result.error);
      setSavingDurationId(null);
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
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[rgba(0,0,0,0.06)]">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-xl hover:bg-[#F1F3F8] text-[#6B7280] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-black text-[#222222] tracking-tight">{box.title}</h1>
          </div>
          <p className="text-[#6B7280] ml-12 font-medium">관리 및 세션 시작을 위한 상세 페이지입니다.</p>
        </div>
        <div className="flex items-center gap-3 ml-12 md:ml-0">
          <Link
            href={`/quiz-boxes/${box.id}/sessions`}
            className="px-5 py-2.5 border border-[rgba(0,0,0,0.08)] text-[#6B7280] text-sm font-bold rounded-2xl hover:bg-[#F1F3F8] hover:text-[#222222] transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            세션 기록
          </Link>
          <button
            onClick={handleDelete}
            className="px-5 py-2.5 border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-sm font-bold rounded-2xl hover:bg-[#EF4444]/5 transition-all duration-200"
          >
            삭제
          </button>
        </div>
      </div>

      <AiWarningBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 border border-[rgba(0,0,0,0.06)] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#4F7CFF]/10 flex items-center justify-center text-[#4F7CFF]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-[#222222]">안전수칙</h2>
              </div>
              {isEditable && !isEditingSafety && (
                <button
                  onClick={() => { setIsEditingSafety(true); setSafetyDraft(box.safetyContent ?? ""); }}
                  className="px-4 py-2 text-sm font-bold text-[#4F7CFF] hover:bg-[#4F7CFF]/5 rounded-xl transition-all"
                >
                  편집하기
                </button>
              )}
            </div>
            {isEditingSafety ? (
              <div className="space-y-4">
                <textarea
                  value={safetyDraft}
                  onChange={(e) => setSafetyDraft(e.target.value)}
                  className={`${inputClass} min-h-[300px] p-6 text-base leading-relaxed`}
                  placeholder="실험 안전수칙을 마크다운으로 입력하세요."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSafety}
                    disabled={savingSafety || !safetyDraft.trim()}
                    className="flex-1 py-3 bg-[#4F7CFF] text-white font-bold rounded-2xl hover:bg-[#6B91FF] transition-all disabled:opacity-50"
                  >
                    {savingSafety ? "저장 중..." : "변경 내용 저장"}
                  </button>
                  <button
                    onClick={() => setIsEditingSafety(false)}
                    className="px-8 py-3 border border-[rgba(0,0,0,0.08)] text-[#6B7280] font-bold rounded-2xl hover:bg-[#F1F3F8] transition-all"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-blue max-w-none bg-[#F8F9FB] p-8 rounded-3xl border border-[rgba(0,0,0,0.04)] text-[#4B5563] min-h-[100px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {box.safetyContent ?? "*등록된 안전수칙이 없습니다.*"}
                </ReactMarkdown>
              </div>
            )}
          </section>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-[#222222]">
                퀴즈 문항 <span className="text-[#4F7CFF] font-black ml-1">{questionList.length}</span>
              </h2>
              {isEditable && (
                <button
                  onClick={() => { setShowAddForm(true); setNewQ(emptyForm()); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F7CFF] text-white text-sm font-bold rounded-xl hover:bg-[#6B91FF] transition-all shadow-sm active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  문제 추가
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {questionList.map((q, i) => (
                <div key={q.id} className="group border border-[rgba(0,0,0,0.06)] rounded-[2rem] p-6 space-y-4 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#4F7CFF]/20 hover:translate-y-[-4px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#4F7CFF]/10 text-[#4F7CFF] text-xs font-black">
                        Q{i + 1}
                      </span>
                      <p className="font-bold text-[#222222] text-lg tracking-tight">{q.text}</p>
                    </div>
                    {isEditable && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditQuestion(q)}
                          className="p-2 text-[#4F7CFF] hover:bg-[#4F7CFF]/5 rounded-lg transition-all"
                          title="편집"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2 text-[#EF4444] hover:bg-[#EF4444]/5 rounded-lg transition-all"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {JSON.parse(q.options).map((opt: string, oi: number) => (
                      <div
                        key={oi}
                        className={`px-4 py-3 rounded-2xl text-sm transition-all ${
                          oi === q.correctIndex
                            ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 font-bold"
                            : "bg-[#F8F9FB] text-[#6B7280] border border-transparent"
                        }`}
                      >
                        <span className="opacity-40 mr-2 font-black">{oi + 1}</span> {opt}
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2">
                      {q.category && (
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-[#222222] text-white rounded-lg">
                          {q.category}
                        </span>
                      )}
                      <span className="text-xs font-bold text-[#9CA3AF] flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {q.questionDurationMs / 1000}s
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#6B7280] bg-[#F1F3F8] px-4 py-2 rounded-xl italic flex-1 max-w-sm">
                      <span className="not-italic mr-1">💡</span> {q.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-[rgba(0,0,0,0.06)] shadow-xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#4F7CFF] opacity-[0.03] rounded-full transition-transform duration-500 group-hover:scale-150" />
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#4F7CFF] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(79,124,255,0.3)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-black text-[#222222]">라이브 세션</h2>
                </div>

                {!isEditable && activeSessionId && (
                  <div className="bg-[#4F7CFF]/5 border border-[#4F7CFF]/10 p-5 rounded-3xl space-y-4 shadow-inner">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F7CFF] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F7CFF]"></span>
                      </span>
                      <p className="text-xs font-black text-[#4F7CFF] uppercase tracking-wider">진행 중인 세션</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-center bg-white py-4 rounded-2xl border border-[#4F7CFF]/10 shadow-sm">
                        <span className="text-2xl font-black text-[#222222] tracking-[0.2em] font-mono">{activeSessionCode}</span>
                      </div>
                      <Link
                        href={`/quiz-boxes/${box.id}/sessions/${activeSessionId}/host`}
                        className="w-full py-3.5 bg-[#4F7CFF] text-white rounded-2xl text-sm font-black hover:bg-[#6B91FF] transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 group"
                      >
                        입장하기
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-[#F8F9FB] p-5 rounded-3xl space-y-4 border border-[rgba(0,0,0,0.02)]">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#9CA3AF] uppercase tracking-wider">목표 참여 인원</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          value={targetCount}
                          onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 0)}
                          className="w-full pl-4 pr-12 py-3.5 bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl text-[#222222] font-black focus:ring-2 focus:ring-[#4F7CFF]/20 transition-all outline-none"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6B7280]">명</span>
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] px-1 font-medium">0명 입력 시 수동으로 시작합니다.</p>
                    </div>
                    
                    <button
                      onClick={handleStartSession}
                      disabled={startingSession}
                      className="w-full py-4 bg-[#4F7CFF] text-white font-black rounded-2xl hover:bg-[#6B91FF] transition-all duration-300 shadow-[0_8px_24px_rgba(79,124,255,0.25)] hover:translate-y-[-2px] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {startingSession ? "준비 중..." : (
                        <>
                          퀴즈 세션 시작
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#222222] rounded-[2.5rem] p-8 text-white space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-700" />
              <h3 className="text-lg font-black relative z-10">빠른 도움말</h3>
              <ul className="space-y-3 text-sm text-gray-400 relative z-10 font-medium">
                <li className="flex gap-2">
                  <span className="text-[#4F7CFF]">●</span>
                  세션을 시작하면 학생들이 입장할 수 있는 QR코드가 생성됩니다.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#4F7CFF]">●</span>
                  모든 문제가 종료되면 AI가 참여 데이터를 분석합니다.
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.4)] backdrop-blur-sm" onClick={() => { setShowAddForm(false); setEditingQuestionId(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-[rgba(0,0,0,0.08)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#222222]">{editingQuestionId ? "문제 수정" : "문제 추가"}</h3>
              <button onClick={() => { setShowAddForm(false); setEditingQuestionId(null); }} className="text-[#6B7280] hover:text-[#222222] text-xl leading-none transition-colors">&times;</button>
            </div>

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
                    onClick={() => setNewQ((prev) => ({ ...prev, correctIndex: oi }))}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 transition-all duration-200 ${
                      newQ.correctIndex === oi
                        ? "border-[#4F7CFF] bg-[#4F7CFF] text-white"
                        : "border-[rgba(0,0,0,0.08)]"
                    }`}
                  >
                    {oi + 1}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(oi, e.target.value)}
                    placeholder={`선택지 ${oi + 1}`}
                    className={`flex-1 ${inputClass}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs text-[#9CA3AF]">해설</label>
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

            {error && <p className="text-sm text-[#EF4444]">{error}</p>}

            <button
              onClick={handleAddQuestion}
              disabled={addingQuestion || !isFormValid}
              className="w-full py-2.5 bg-[#4F7CFF] text-white font-medium rounded-xl hover:bg-[#6B91FF] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(79,124,255,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingQuestion ? "저장 중..." : editingQuestionId ? "수정 완료" : "문제 저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
