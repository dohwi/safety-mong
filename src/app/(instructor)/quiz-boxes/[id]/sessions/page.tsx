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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-[28px] border border-[rgba(0,0,0,0.06)] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/quiz-boxes/${quizBoxId}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F9FB] text-[#6B7280] transition-all hover:bg-[#F1F3F8] hover:text-[#222222]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{box.icon}</span>
                <h1 className="text-xl font-bold tracking-tight text-[#222222]">{box.title}</h1>
              </div>
              <p className="text-xs font-medium text-[#9CA3AF]">세션 기록 히스토리</p>
            </div>
          </div>
          <Link
            href={`/quiz-boxes/${quizBoxId}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#4F7CFF] px-5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#6B91FF]"
          >
            새 세션 시작
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {activeSessions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-[#4F7CFF] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F7CFF] animate-pulse" />
              진행 중
            </h2>
            {activeSessions.map((s) => {
              const pCount = db.select().from(participants)
                .where(eq(participants.sessionId, s.id))
                .all().length;
              return (
                <Link
                  key={s.id}
                  href={`/quiz-boxes/${quizBoxId}/sessions/${s.id}/host`}
                  className="block border border-[rgba(79,124,255,0.2)] rounded-2xl p-4 bg-white hover:border-[#4F7CFF] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#222222]">
                        {new Date(s.createdAt).toLocaleString("ko-KR")}
                      </p>
                      <p className="text-xs font-medium text-[#6B7280]">참여자 {pCount}명</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-[#4F7CFF] text-white rounded-md font-black uppercase">
                      {phaseLabel[s.phase] || s.phase}
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {analysisSessions.length > 0 && (
          <section className="space-y-3">
            {analysisSessions.map((s) => {
              const pCount = db.select().from(participants)
                .where(eq(participants.sessionId, s.id))
                .all().length;
              return (
                <Link
                  key={s.id}
                  href={`/quiz-boxes/${quizBoxId}/sessions/${s.id}/analysis`}
                  className="block border border-[rgba(0,0,0,0.06)] rounded-2xl p-4 bg-white hover:border-[#4F7CFF] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#222222]">
                        {new Date(s.createdAt).toLocaleString("ko-KR")}
                      </p>
                      <p className="text-xs font-medium text-[#6B7280]">참여자 {pCount}명 · 분석 리포트</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#F8F9FB] flex items-center justify-center text-[#4F7CFF]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {closedSessions.length > 0 && (
          <section className="space-y-3">
            {closedSessions.map((s) => (
              <SessionRecordCard key={s.id} session={s} quizBoxId={quizBoxId} />
            ))}
          </section>
        )}

        {sessionList.length === 0 && (
          <EmptySessions quizBoxId={quizBoxId} />
        )}
      </div>
    </div>
  );
}
