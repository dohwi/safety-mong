import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { sessions, quizBoxes, participants, answers, questions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { SessionRecordCard } from "@/components/session-record-card";
import { EmptySessions } from "@/components/empty-sessions";
import Link from "next/link";

export const metadata = { title: "세션 기록 - 안전몽" };

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
    .where(and(eq(sessions.quizBoxId, quizBoxId), eq(sessions.phase, "closed")))
    .orderBy(desc(sessions.createdAt))
    .all();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-[#3b82f6] hover:underline">← 대시보드</Link>
          <h1 className="text-2xl font-bold text-[#222222] mt-2">{box.title} - 세션 기록</h1>
        </div>
      </div>

      {sessionList.length === 0 ? (
        <EmptySessions quizBoxId={quizBoxId} />
      ) : (
        <div className="space-y-3">
          {sessionList.map((s) => (
            <SessionRecordCard key={s.id} session={s} quizBoxId={quizBoxId} />
          ))}
        </div>
      )}
    </div>
  );
}
