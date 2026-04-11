import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { sessions, quizBoxes, participants, answers, questions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import type { AnalysisOutput } from "@/lib/ai/schemas";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const authSession = await getSession();
  if (!authSession) redirect("/login");

  const { id, sessionId: sessionIdStr } = await params;
  const sessionId = parseInt(sessionIdStr, 10);
  const quizBoxId = parseInt(id, 10);
  if (isNaN(sessionId) || isNaN(quizBoxId)) notFound();

  const session = db.select().from(sessions).where(
    and(eq(sessions.id, sessionId), eq(sessions.instructorId, authSession.userId))
  ).get();
  if (!session) notFound();

  const box = db.select().from(quizBoxes).where(eq(quizBoxes.id, quizBoxId)).get();
  if (!box) notFound();

  const participantList = db.select().from(participants)
    .where(eq(participants.sessionId, sessionId))
    .all();

  const questionList = db.select().from(questions)
    .where(eq(questions.quizBoxId, quizBoxId))
    .orderBy(questions.index)
    .all();

  const allAnswers = db.select().from(answers)
    .where(eq(answers.sessionId, sessionId))
    .all();

  let analysis: AnalysisOutput | null = null;
  if (session.aiAnalysis) {
    try { analysis = JSON.parse(session.aiAnalysis); } catch {}
  }

  const totalCorrect = allAnswers.filter((a) => a.isCorrect).length;
  const avgRate = allAnswers.length > 0 ? Math.round((totalCorrect / allAnswers.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link href={`/quiz-boxes/${quizBoxId}/sessions`} className="text-sm text-[#4F7CFF] hover:underline">← 세션 기록</Link>
      <h1 className="text-2xl font-bold text-[#222222]">{box.title} - 세션 상세</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 border border-[rgba(0,0,0,0.08)] rounded-xl bg-white shadow-sm border-l-4 border-l-[#4F7CFF] transition-all duration-200">
          <p className="text-2xl font-bold text-[#4F7CFF]">{participantList.length}</p>
          <p className="text-xs text-[#9CA3AF]">참여자</p>
        </div>
        <div className="text-center p-4 border border-[rgba(0,0,0,0.08)] rounded-xl bg-white shadow-sm border-l-4 border-l-[#F59E0B] transition-all duration-200">
          <p className="text-2xl font-bold text-[#222222]">{avgRate}%</p>
          <p className="text-xs text-[#9CA3AF]">평균 정답률</p>
        </div>
        <div className="text-center p-4 border border-[rgba(0,0,0,0.08)] rounded-xl bg-white shadow-sm border-l-4 border-l-[#22C55E] transition-all duration-200">
          <p className="text-2xl font-bold text-[#222222]">{questionList.length}</p>
          <p className="text-xs text-[#9CA3AF]">문항수</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#222222]">문항별 결과</h2>
        {questionList.map((q, i) => {
          const qAnswers = allAnswers.filter((a) => a.questionId === q.id);
          const correct = qAnswers.filter((a) => a.isCorrect).length;
          const rate = qAnswers.length > 0 ? Math.round((correct / qAnswers.length) * 100) : 0;

          return (
            <div key={q.id} className="border border-[rgba(0,0,0,0.08)] rounded-xl p-4 bg-white shadow-sm transition-all duration-200 hover:shadow-[0_8px_24px_rgba(79,124,255,0.1)] hover:scale-[1.01]">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-[#222222] text-sm">{i + 1}. {q.text}</p>
                <span className={`text-sm font-bold ${rate < 50 ? "text-[#EF4444]" : rate < 80 ? "text-[#F59E0B]" : "text-[#22C55E]"}`}>
                  {rate}%
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF]">{correct}/{qAnswers.length} 정답</p>
            </div>
          );
        })}
      </div>

      {analysis && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#222222]">AI 분석 요약</h2>
          <p className="text-sm text-[#6B7280] bg-white p-4 rounded-xl border border-[rgba(0,0,0,0.08)] shadow-sm">{analysis.summary}</p>
        </div>
      )}
    </div>
  );
}
