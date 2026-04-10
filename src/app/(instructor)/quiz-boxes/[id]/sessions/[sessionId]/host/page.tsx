import { getSession, getSessionToken } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { sessions, quizBoxes, questions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { LiveDashboard } from "@/components/host/live-dashboard";

export default async function HostPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, sessionId: sessionIdStr } = await params;
  const sessionId = parseInt(sessionIdStr, 10);
  const quizBoxId = parseInt(id, 10);
  if (isNaN(sessionId) || isNaN(quizBoxId)) notFound();

  const dbSession = db.select().from(sessions).where(
    and(eq(sessions.id, sessionId), eq(sessions.instructorId, session.userId))
  ).get();
  if (!dbSession) notFound();

  const box = db.select().from(quizBoxes).where(eq(quizBoxes.id, quizBoxId)).get();
  if (!box) notFound();

  const questionList = db.select().from(questions)
    .where(eq(questions.quizBoxId, quizBoxId))
    .orderBy(questions.index)
    .all();

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/join/${dbSession.code}`;
  const authToken = await getSessionToken();

  return (
    <LiveDashboard
      sessionId={sessionId}
      sessionCode={dbSession.code}
      quizBoxTitle={box.title}
      totalQuestions={questionList.length}
      qrUrl={qrUrl}
      authToken={authToken || ""}
    />
  );
}
