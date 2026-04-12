import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { sessions, quizBoxes, participants } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { SessionRecordCard } from "@/components/session-record-card";
import { EmptySessions } from "@/components/empty-sessions";
import Link from "next/link";
import { ACTIVE_PHASES } from "@/lib/socket/types";

export const metadata = { title: "세션 기록 - 안전몽" };

const phaseLabel: Record<string, string> = {
  waiting: "대기 중",
  active: "진행 중",
  intermission: "쉬는 시간",
  completed: "완료",
  analysis: "분석 완료",
  closed: "마감",
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

  const activePhases = ACTIVE_PHASES as readonly string[];
  const activeSessions = sessionList.filter((s) => activePhases.includes(s.phase));
  const analysisSessions = sessionList.filter((s) => s.phase === "analysis" || (s.phase === "completed" && s.aiAnalysis));
  const errorSessions = sessionList.filter((s) => s.phase === "completed" && !s.aiAnalysis);
  const closedSessions = sessionList.filter((s) => s.phase === "closed");

  const sessionIds = sessionList.map((s) => s.id);
  const participantCounts = new Map<number, number>();
  if (sessionIds.length > 0) {
    const rows = db.select({
      sessionId: participants.sessionId,
      count: sql<number>`count(*)`.as("count"),
    })
      .from(participants)
      .where(sql`${participants.sessionId} in (${sql.join(sessionIds.map((id) => sql`${id}`), sql`, `)})`)
      .groupBy(participants.sessionId)
      .all();
    for (const row of rows) {
      participantCounts.set(row.sessionId, row.count);
    }
  }

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
              const pCount = participantCounts.get(s.id) ?? 0;
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
            <h2 className="text-sm font-bold text-[#7C5CFF] flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              분석 완료
            </h2>
            {analysisSessions.map((s) => {
              const pCount = participantCounts.get(s.id) ?? 0;
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

        {errorSessions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-[#EF4444] flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              분석 미완료
            </h2>
            {errorSessions.map((s) => {
              const pCount = participantCounts.get(s.id) ?? 0;
              return (
                <div
                  key={s.id}
                  className="block border border-[rgba(239,68,68,0.15)] rounded-2xl p-4 bg-[#FFFBFB]"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-[#EF4444]/10 text-[#EF4444] rounded-md font-black">분석 오류</span>
                        <p className="text-xs font-bold text-[#9CA3AF]">
                          {new Date(s.createdAt).toLocaleString("ko-KR")}
                        </p>
                      </div>
                      <p className="text-xs font-medium text-[#6B7280]">참여자 {pCount}명 · 분석 리포트를 생성하지 못했습니다</p>
                    </div>
                    <Link
                      href={`/quiz-boxes/${quizBoxId}/sessions/${s.id}/analysis`}
                      className="inline-flex h-8 items-center justify-center rounded-lg bg-[#EF4444] px-3 text-xs font-bold text-white transition-all hover:bg-[#DC2626]"
                    >
                      재시도
                    </Link>
                  </div>
                </div>
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
