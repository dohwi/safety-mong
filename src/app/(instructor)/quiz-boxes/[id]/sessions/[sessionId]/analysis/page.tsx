import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { sessions, quizBoxes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AnalysisView } from "@/components/analysis-view";
import type { SessionPhase } from "@/lib/socket/types";

export default async function AnalysisPage({
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

  return (
    <AnalysisView
      sessionId={sessionId}
      quizBoxTitle={box.title}
      aiAnalysis={session.aiAnalysis}
      phase={session.phase as SessionPhase}
    />
  );
}
