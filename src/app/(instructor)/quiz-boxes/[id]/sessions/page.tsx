import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { sessions, quizBoxes, participants } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { SessionRecordCard } from "@/components/session-record-card";
import { EmptySessions } from "@/components/empty-sessions";
import Link from "next/link";

export const metadata = { title: "세션 기록 - 안전몽" };

const phaseLabel: Record<string, string> = {
  waiting: "대기 중",
  active: "진행 중",
  intermission: "쉬는 시간",
  completed: "완료",
  analysis: "분석 완료",
  closed: "마감",
};

const phaseColors: Record<string, string> = {
  waiting: "bg-[#F1F3F8] text-[#6B7280]",
  active: "bg-[#4F7CFF] text-white",
  intermission: "bg-[#4F7CFF] text-white",
  completed: "bg-[#22C55E] text-white",
  analysis: "bg-[#7C5CFF] text-white",
  closed: "bg-[#222222] text-white",
};

export default async function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const quizBoxId = parseInt(id, 10);
  if (isNaN(quizBoxId)) notFound();

  const box = db.select().from(quizBoxes).where(
    and(eq(quizBoxes.id, quizBoxId), eq(quizBoxes.instructorId, session.userId))
  ).get();
  if (!box) notFound();

  const sessionList = db.select().from(sessions)
    .where(eq(sessions.quizBoxId, quizBoxId))
    .orderBy(desc(sessions.createdAt))
    .all();

  const activePhases = ["waiting", "active", "intermission"];
  const analysisPhases = ["analysis"];
  const pastPhases = ["completed", "closed"];
  const activeSessions = sessionList.filter((s) => activePhases.includes(s.phase));
  const analysisSessions = sessionList.filter((s) => analysisPhases.includes(s.phase) || (s.phase === "completed" && s.aiAnalysis));
  const closedSessions = sessionList.filter((s) => pastPhases.includes(s.phase) && !(s.phase === "completed" && s.aiAnalysis));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/quiz-boxes/${quizBoxId}`} className="text-sm text-[#4F7CFF] hover:underline">← 퀴즈함으로</Link>
          <h1 className="text-2xl font-bold text-[#222222] mt-2">{box.title} - 세션 기록</h1>
        </div>
        <Link
          href={`/quiz-boxes/${quizBoxId}`}
          className="px-4 py-2 bg-[#4F7CFF] text-white text-sm font-medium rounded-xl hover:bg-[#6B91FF] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(79,124,255,0.25)]"
        >
          새 세션
        </Link>
      </div>

      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#222222]">진행 중</h2>
          {activeSessions.map((s) => {
            const pCount = db.select().from(participants)
              .where(eq(participants.sessionId, s.id))
              .all().length;
            return (
              <Link
                key={s.id}
                href={`/quiz-boxes/${quizBoxId}/sessions/${s.id}/host`}
                className="block border-2 border-[rgba(79,124,255,0.4)] rounded-2xl p-5 bg-white hover:bg-[#F8F9FB] hover:border-[rgba(79,124,255,0.6)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(79,124,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B7280]">
                      {new Date(s.createdAt).toLocaleString("ko-KR")}
                    </p>
                    <p className="text-sm text-[#222222] mt-1">참여자 {pCount}명</p>
                  </div>
                  <span className="text-xs px-3 py-1 bg-[#4F7CFF] text-white rounded-full font-medium">
                    {phaseLabel[s.phase] || s.phase}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {analysisSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#222222]">분석 리포트</h2>
          {analysisSessions.map((s) => {
            const pCount = db.select().from(participants)
              .where(eq(participants.sessionId, s.id))
              .all().length;
            return (
              <Link
                key={s.id}
                href={`/quiz-boxes/${quizBoxId}/sessions/${s.id}/analysis`}
                className="block border-2 border-[rgba(124,92,255,0.4)] rounded-2xl p-5 bg-white hover:bg-[#F8F9FB] hover:border-[rgba(124,92,255,0.6)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(124,92,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B7280]">
                      {new Date(s.createdAt).toLocaleString("ko-KR")}
                    </p>
                    <p className="text-sm text-[#222222] mt-1">참여자 {pCount}명</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${phaseColors[s.phase] || "bg-[#F1F3F8] text-[#6B7280]"}`}>
                    {phaseLabel[s.phase] || s.phase}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {closedSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#222222]">종료된 세션</h2>
          {closedSessions.map((s) => (
            <SessionRecordCard key={s.id} session={s} quizBoxId={quizBoxId} />
          ))}
        </div>
      )}

      {sessionList.length === 0 && (
        <EmptySessions quizBoxId={quizBoxId} />
      )}
    </div>
  );
}
